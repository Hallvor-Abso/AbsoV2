'use server';

/**
 * SERVER ACTIONS — toutes les opérations d'écriture de l'espace admin.
 *
 * Chaque action :
 *  1. vérifie que l'utilisateur est bien un admin connecté (requireAdmin)
 *  2. effectue la modification en base
 *  3. rafraîchit (revalidate) les pages publiques concernées
 *
 * C'est ce qui permet de TOUT gérer depuis l'interface, sans toucher au code.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/auth';
import { canAccessAdmin, canAccessContenu, canAccessOverlays, canManageGlobally, allowedGameIds } from '@/lib/permissions';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeHtml, sanitizeText, sanitizePlainText } from '@/lib/sanitize';
import { SITE_CONTENT_DEFAULTS } from '@/lib/site-content';
import { OVERLAY_CONFIG_KEY } from '@/lib/overlay-config';
import { enqueueAlert } from '@/lib/alerts';
import { setupSubscriptions, deleteSubscription, clearBroadcaster } from '@/lib/twitch';
import type { AlertType } from '@prisma/client';
import { slugify } from '@/lib/utils';
import {
  DEFAULT_RECRUIT_FIELDS,
  FIELD_TYPES,
  slugifyKey,
  type RecruitFieldType,
} from '@/lib/recruitment-fields';
import {
  syncEventToBot,
  syncProgressionToBot,
  removeEventFromBot,
  syncNewsToBot,
  removeNewsFromBot,
  syncRosterToBot,
  syncApplicationStatusToBot,
  deleteApplicationChannelFromBot,
  getMemberDiscordRoles,
  setMemberDiscordRoles,
  isBotConfigured,
} from '@/lib/bot';

/** Bloque l'action réservée au Super Admin (ex : Contenu du site). */
async function requireSuperAdmin() {
  const user = await getAppUser();
  if (!canAccessContenu(user)) {
    throw new Error('Non autorisé');
  }
}

/** Bloque l'action réservée au Super Admin (hub des overlays). */
async function requireOverlays() {
  if (!canAccessOverlays(await getAppUser())) throw new Error('Non autorisé');
}

/** Réservé aux admins globaux (gestion des membres et des jeux). */
async function requireManager() {
  const user = await getAppUser();
  if (!canManageGlobally(user)) throw new Error('Non autorisé');
  return user!;
}

/**
 * Vérifie que l'utilisateur a le droit d'agir sur CE jeu précis.
 * Un admin global passe toujours ; un admin de jeu seulement pour ses jeux.
 */
async function requireGameAccess(gameId?: string | null) {
  const user = await getAppUser();
  if (!canAccessAdmin(user)) throw new Error('Non autorisé');
  const scope = allowedGameIds(user);
  if (scope === 'all') return;
  if (!gameId || !scope.includes(gameId)) throw new Error('Non autorisé');
}

/** Résout le gameId d'un tier / boss / candidature pour vérifier le périmètre. */
async function gameIdOfTier(tierId: string) {
  const t = await prisma.raidTier.findUnique({ where: { id: tierId }, select: { gameId: true } });
  return t?.gameId ?? null;
}
async function gameIdOfBoss(bossId: string) {
  const b = await prisma.boss.findUnique({ where: { id: bossId }, select: { tier: { select: { gameId: true } } } });
  return b?.tier.gameId ?? null;
}

/** Journalise une action admin sensible (best-effort, n'interrompt jamais l'action). */
async function logAudit(action: string, detail?: string) {
  try {
    const u = await getAppUser();
    const name = (u as { name?: string } | null)?.name || 'Admin';
    await prisma.auditLog.create({
      data: { actorId: u?.id ?? null, actorName: name, action, detail: detail ?? null },
    });
  } catch (e) {
    console.error('audit log :', e);
  }
}

// =============================================================================
//  MEMBRES (gestion des rôles)
// =============================================================================
export async function updateMember(formData: FormData) {
  const me = await requireManager();
  const id = formData.get('id') as string;
  const role = formData.get('role') as Role;
  const gameIds = formData.getAll('gameIds').map(String);

  // Seul un Super Admin peut accorder le rôle Super Admin.
  if (role === 'SUPER_ADMIN' && me.role !== 'SUPER_ADMIN') {
    throw new Error('Non autorisé');
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { displayName: true, username: true, email: true },
  });
  await prisma.user.update({
    where: { id },
    data: {
      role,
      adminGames: { set: gameIds.map((g) => ({ id: g })) },
    },
  });
  const who = target?.displayName || target?.username || target?.email || id;
  await logAudit('Membre modifié', `${who} → rôle ${role}${gameIds.length ? ` · admin de ${gameIds.length} jeu(x)` : ''}`);
  revalidatePath('/admin/membres');
}

export async function deleteMember(id: string) {
  const me = await requireManager();
  if (me.id === id) throw new Error('Vous ne pouvez pas supprimer votre propre compte.');
  const target = await prisma.user.findUnique({
    where: { id },
    select: { displayName: true, username: true, email: true },
  });
  await prisma.user.delete({ where: { id } });
  await logAudit('Membre supprimé', target?.displayName || target?.username || target?.email || id);
  revalidatePath('/admin/membres');
}

// --- Rôles Discord d'un membre (indépendants des grades du site) -------------

/** Lit en direct les rôles Discord structurés d'un membre (via le bot). */
export async function fetchMemberDiscordRoles(discordId: string) {
  await requireManager();
  if (!isBotConfigured()) return { status: 'unconfigured' as const };
  const data = await getMemberDiscordRoles(discordId);
  if (!data) return { status: 'unreachable' as const };
  return { status: 'ok' as const, found: data.found, roles: data.roles };
}

/** Applique les rôles Discord souhaités d'un membre (via le bot). */
export async function saveMemberDiscordRoles(discordId: string, assignedKeys: string[]) {
  await requireManager();
  if (!isBotConfigured()) {
    throw new Error('Canal site → bot non configuré (BOT_URL / BOT_HTTP_SECRET manquants côté site).');
  }
  const data = await setMemberDiscordRoles(discordId, assignedKeys);
  if (!data) throw new Error('Bot injoignable en HTTP (URL publique / port / secret ?).');
  return data;
}

/** Rafraîchit l'ensemble du site public après une modification. */
function revalidatePublic() {
  revalidatePath('/');
  revalidatePath('/progression');
  revalidatePath('/news');
  revalidatePath('/recrutement');
  revalidatePath('/calendrier');
}

// =============================================================================
//  JEUX
// =============================================================================
export async function saveGame(formData: FormData) {
  await requireManager();
  const id = formData.get('id') as string | null;
  const name = sanitizeText(formData.get('name'), 80);
  const slug = slugify((formData.get('slug') as string) || name);

  const data = {
    name,
    slug,
    logoUrl: sanitizeText(formData.get('logoUrl'), 500) || null,
    coverImageUrl: sanitizeText(formData.get('coverImageUrl'), 500) || null,
    color: (sanitizeText(formData.get('color'), 7) || '#4A9EFF'),
    status: (formData.get('status') as 'ACTIVE' | 'UPCOMING') || 'ACTIVE',
    isActive: formData.get('isActive') === 'on',
    order: Number(formData.get('order') || 0),
    discordCalendarChannelId: sanitizeText(formData.get('discordCalendarChannelId'), 40) || null,
    discordRecruitmentChannelId: sanitizeText(formData.get('discordRecruitmentChannelId'), 40) || null,
    discordRecruitmentCategoryId: sanitizeText(formData.get('discordRecruitmentCategoryId'), 40) || null,
    discordRoleTag: sanitizeText(formData.get('discordRoleTag'), 30) || null,
  };

  if (id) {
    await prisma.game.update({ where: { id }, data });
  } else {
    await prisma.game.create({ data });
  }
  revalidatePublic();
}

/** Active / désactive un jeu (le retire entièrement du site public si OFF). */
export async function toggleGame(id: string, isActive: boolean) {
  await requireManager();
  const game = await prisma.game.update({ where: { id }, data: { isActive }, select: { name: true } });
  await logAudit(isActive ? 'Jeu réactivé' : 'Jeu désactivé', game.name);
  revalidatePublic();
}

export async function deleteGame(id: string) {
  await requireManager();
  const game = await prisma.game.findUnique({ where: { id }, select: { name: true } });
  await prisma.game.delete({ where: { id } });
  await logAudit('Jeu supprimé', game?.name ?? id);
  revalidatePublic();
}

// =============================================================================
//  NEWS
// =============================================================================
export async function saveNews(formData: FormData) {
  const id = formData.get('id') as string | null;
  const title = sanitizeText(formData.get('title'), 180);
  const status = (formData.get('status') as 'DRAFT' | 'PUBLISHED') || 'DRAFT';
  const gameId = (formData.get('gameId') as string) || null;
  await requireGameAccess(gameId);

  // Slug unique basé sur le titre.
  let slug = slugify(title);
  const existing = await prisma.news.findUnique({ where: { slug } });
  if (existing && existing.id !== id) slug = `${slug}-${Date.now().toString(36)}`;

  // Date de publication (instant UTC ISO envoyé par le formulaire).
  // - une date fournie PROGRAMME la publication (future = masquée jusque-là) ;
  // - champ vidé = publie MAINTENANT, sauf si l'article est déjà en ligne
  //   (date passée) : on conserve alors sa date d'origine pour ne pas la
  //   « rajeunir » à chaque édition.
  // Un article publié dont la date est future reste invisible (voir getPublishedNews).
  const scheduledRaw = formData.get('publishedAt') as string;
  const current = id ? await prisma.news.findUnique({ where: { id } }) : null;
  const now = new Date();
  const publishedAt =
    status === 'PUBLISHED'
      ? scheduledRaw
        ? new Date(scheduledRaw)
        : current?.publishedAt && current.publishedAt <= now
          ? current.publishedAt
          : now
      : null;

  const data = {
    title,
    slug: id ? undefined : slug, // on ne régénère pas le slug à l'édition
    excerpt: sanitizeText(formData.get('excerpt'), 400) || null,
    content: sanitizeHtml((formData.get('content') as string) || ''),
    imageUrl: sanitizeText(formData.get('imageUrl'), 500) || null,
    imageFit: (formData.get('imageFit') as string) === 'contain' ? 'contain' : 'cover',
    // NB : « À la Une » se gère via un bouton dans la liste (toggleFeatured),
    // pas ici, pour ne pas l'écraser à chaque édition.
    status,
    gameId: gameId || null,
    publishedAt,
  };

  let savedId = id;
  if (id) {
    await prisma.news.update({ where: { id }, data });
  } else {
    const created = await prisma.news.create({ data: { ...data, slug } });
    savedId = created.id;
  }

  // Publie sur le salon News de Discord (uniquement si publié et déjà visible).
  if (savedId && status === 'PUBLISHED' && publishedAt && publishedAt <= now) {
    await syncNewsToBot(savedId);
  }

  revalidatePublic();
  revalidatePath(`/news/${slug}`);
  revalidatePath('/admin/news');
  // Retour à la liste des articles après l'enregistrement.
  redirect('/admin/news');
}

/** Bascule l'article « À la Une » (un seul à la fois sur tout le site). */
export async function toggleFeatured(id: string) {
  const n = await prisma.news.findUnique({ where: { id }, select: { gameId: true, featured: true } });
  await requireGameAccess(n?.gameId);
  if (n?.featured) {
    await prisma.news.update({ where: { id }, data: { featured: false } });
  } else {
    await prisma.news.updateMany({ data: { featured: false } }); // une seule à la Une
    await prisma.news.update({ where: { id }, data: { featured: true } });
  }
  revalidatePublic();
  revalidatePath('/admin/news');
}

export async function deleteNews(id: string) {
  const n = await prisma.news.findUnique({
    where: { id },
    select: { gameId: true, discordChannelId: true, discordMessageId: true },
  });
  await requireGameAccess(n?.gameId);
  await prisma.news.delete({ where: { id } });
  await removeNewsFromBot(n?.discordChannelId ?? null, n?.discordMessageId ?? null);
  revalidatePublic();
}

// =============================================================================
//  PROGRESSION (tiers & boss)
// =============================================================================
export async function createTier(formData: FormData) {
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const name = sanitizeText(formData.get('name'), 120);
  if (!gameId || !name) return;
  const expansion = sanitizeText(formData.get('expansion'), 120) || null;
  const count = await prisma.raidTier.count({ where: { gameId } });
  await prisma.raidTier.create({ data: { gameId, name, expansion, order: count } });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

/** Met à jour les métadonnées d'un tier (extension + zoneId Warcraft Logs). */
export async function updateTier(formData: FormData) {
  const id = formData.get('id') as string;
  const gameId = await gameIdOfTier(id);
  await requireGameAccess(gameId);
  const zoneRaw = formData.get('zoneId') as string;
  const zoneId = zoneRaw && !Number.isNaN(Number(zoneRaw)) ? Number(zoneRaw) : null;
  const name = sanitizeText(formData.get('name'), 120);
  const expansion = sanitizeText(formData.get('expansion'), 120) || null;
  await prisma.raidTier.update({
    where: { id },
    data: { zoneId, expansion, ...(name ? { name } : {}) },
  });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

/** SWTOR : bascule le Succès « timer » de l'opération (tier) validé ou non. */
export async function toggleTierTimer(id: string, value: boolean) {
  const gameId = await gameIdOfTier(id);
  await requireGameAccess(gameId);
  await prisma.raidTier.update({ where: { id }, data: { timerDone: value } });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

export async function deleteTier(id: string) {
  const gameId = await gameIdOfTier(id);
  await requireGameAccess(gameId);
  await prisma.raidTier.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

export async function createBoss(formData: FormData) {
  const tierId = formData.get('tierId') as string;
  const gameId = await gameIdOfTier(tierId);
  await requireGameAccess(gameId);
  const name = sanitizeText(formData.get('name'), 120);
  if (!tierId || !name) return;
  const count = await prisma.boss.count({ where: { tierId } });
  await prisma.boss.create({ data: { tierId, name, order: count } });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

/** Met à jour un boss : statut, date de premier kill et visuel. */
export async function updateBoss(formData: FormData) {
  const id = formData.get('id') as string;
  const gameId = await gameIdOfBoss(id);
  await requireGameAccess(gameId);
  const status = formData.get('status') as 'KILLED' | 'PROGRESSING' | 'UNTESTED';
  const dateStr = formData.get('firstKillDate') as string;
  const name = sanitizeText(formData.get('name'), 120);

  const encounterRaw = formData.get('encounterId') as string;
  const encounterId = encounterRaw && !Number.isNaN(Number(encounterRaw))
    ? Number(encounterRaw)
    : null;

  await prisma.boss.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      status,
      firstKillDate:
        status === 'KILLED' && dateStr ? new Date(dateStr) : null,
      imageUrl: sanitizeText(formData.get('imageUrl'), 500) || null,
      encounterId,
    },
  });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

export async function deleteBoss(id: string) {
  const gameId = await gameIdOfBoss(id);
  await requireGameAccess(gameId);
  await prisma.boss.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/progression');
  await syncProgressionToBot(gameId);
}

// =============================================================================
//  RECRUTEMENT (postes)
// =============================================================================
export async function saveSlot(formData: FormData) {
  const id = formData.get('id') as string | null;
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const data = {
    gameId,
    role: sanitizeText(formData.get('role'), 60),
    className: sanitizeText(formData.get('className'), 60),
    status: (formData.get('status') as 'OPEN' | 'LIMITED' | 'CLOSED') || 'OPEN',
    order: Number(formData.get('order') || 0),
  };
  if (id) {
    await prisma.recruitmentSlot.update({ where: { id }, data });
  } else {
    await prisma.recruitmentSlot.create({ data });
  }
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

export async function deleteSlot(id: string) {
  const s = await prisma.recruitmentSlot.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(s?.gameId);
  await prisma.recruitmentSlot.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Crée un rôle de recrutement (Tank, Heal...) pour un jeu. */
export async function createRecruitRole(formData: FormData) {
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const name = sanitizeText(formData.get('name'), 60);
  const description = sanitizeText(formData.get('description'), 500) || null;
  if (!name) return;
  const count = await prisma.recruitmentRole.count({ where: { gameId } });
  await prisma.recruitmentRole.upsert({
    where: { gameId_name: { gameId, name } },
    update: { description },
    create: { gameId, name, description, order: count },
  });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

// Met à jour la description (et le nom) d'une catégorie de rôle.
export async function updateRecruitRole(formData: FormData) {
  const id = formData.get('id') as string;
  const role = await prisma.recruitmentRole.findUnique({ where: { id } });
  await requireGameAccess(role?.gameId);
  if (!role) return;
  const name = sanitizeText(formData.get('name'), 60) || role.name;
  const description = sanitizeText(formData.get('description'), 500) || null;
  // Si le nom change, on répercute sur les classes rattachées (liées par nom).
  if (name !== role.name) {
    await prisma.recruitmentSlot.updateMany({
      where: { gameId: role.gameId, role: role.name },
      data: { role: name },
    });
  }
  await prisma.recruitmentRole.update({ where: { id }, data: { name, description } });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Supprime un rôle et toutes ses classes. */
export async function deleteRecruitRole(id: string) {
  const role = await prisma.recruitmentRole.findUnique({ where: { id } });
  await requireGameAccess(role?.gameId);
  if (role) {
    await prisma.recruitmentSlot.deleteMany({ where: { gameId: role.gameId, role: role.name } });
    await prisma.recruitmentRole.delete({ where: { id } });
  }
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Ajoute une classe/spécialisation à un rôle (statut « Ouvert » par défaut). */
export async function addRecruitClass(formData: FormData) {
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const role = sanitizeText(formData.get('role'), 60);
  const className = sanitizeText(formData.get('className'), 60);
  if (!role || !className) return;
  const count = await prisma.recruitmentSlot.count({ where: { gameId, role } });
  await prisma.recruitmentSlot.create({
    data: { gameId, role, className, status: 'OPEN', order: count },
  });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Fait défiler le statut d'une classe au clic : Ouvert → Fermé → Limité → ... */
export async function cycleSlotStatus(id: string) {
  const slot = await prisma.recruitmentSlot.findUnique({ where: { id }, select: { gameId: true, status: true } });
  await requireGameAccess(slot?.gameId);
  const next =
    slot?.status === 'OPEN' ? 'CLOSED' : slot?.status === 'CLOSED' ? 'LIMITED' : 'OPEN';
  await prisma.recruitmentSlot.update({ where: { id }, data: { status: next } });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

// =============================================================================
//  CHAMPS DU FORMULAIRE DE CANDIDATURE (constructeur par jeu)
// =============================================================================

/** Lit et normalise le type de champ depuis le formulaire. */
function parseFieldType(raw: FormDataEntryValue | null): RecruitFieldType {
  const value = String(raw ?? 'TEXT') as RecruitFieldType;
  return FIELD_TYPES.includes(value) ? value : 'TEXT';
}

/** Parse les options d'une liste déroulante (une par ligne ou séparées par des virgules). */
function parseOptions(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split(/[\n,]/)
    .map((o) => sanitizeText(o, 200))
    .filter(Boolean)
    .slice(0, 50);
}

/** Génère une clé unique pour un nouveau champ d'un jeu. */
async function uniqueFieldKey(gameId: string, label: string): Promise<string> {
  const base = slugifyKey(label) || 'champ';
  let key = base;
  let i = 2;
  while (await prisma.recruitmentField.findUnique({ where: { gameId_key: { gameId, key } } })) {
    key = `${base}_${i++}`;
  }
  return key;
}

/** Crée un champ de formulaire pour un jeu. */
export async function createRecruitField(formData: FormData) {
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const label = sanitizeText(formData.get('label'), 80);
  if (!label) return;
  const type = parseFieldType(formData.get('type'));
  const count = await prisma.recruitmentField.count({ where: { gameId } });
  await prisma.recruitmentField.create({
    data: {
      gameId,
      key: await uniqueFieldKey(gameId, label),
      label,
      type,
      placeholder: sanitizeText(formData.get('placeholder'), 200) || null,
      helpText: sanitizeText(formData.get('helpText'), 300) || null,
      required: formData.get('required') === 'on',
      options: type === 'SELECT' ? parseOptions(formData.get('options')) : [],
      order: count,
    },
  });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Met à jour un champ de formulaire. */
export async function updateRecruitField(formData: FormData) {
  const id = formData.get('id') as string;
  const field = await prisma.recruitmentField.findUnique({ where: { id } });
  await requireGameAccess(field?.gameId);
  if (!field) return;
  const label = sanitizeText(formData.get('label'), 80) || field.label;
  const type = parseFieldType(formData.get('type'));
  await prisma.recruitmentField.update({
    where: { id },
    data: {
      label,
      type,
      placeholder: sanitizeText(formData.get('placeholder'), 200) || null,
      helpText: sanitizeText(formData.get('helpText'), 300) || null,
      required: formData.get('required') === 'on',
      options: type === 'SELECT' ? parseOptions(formData.get('options')) : [],
    },
  });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Supprime un champ de formulaire. */
export async function deleteRecruitField(id: string) {
  const field = await prisma.recruitmentField.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(field?.gameId);
  await prisma.recruitmentField.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Déplace un champ vers le haut/bas (échange l'ordre avec le voisin). */
export async function moveRecruitField(id: string, direction: 'up' | 'down') {
  const field = await prisma.recruitmentField.findUnique({ where: { id } });
  await requireGameAccess(field?.gameId);
  if (!field) return;
  const neighbor = await prisma.recruitmentField.findFirst({
    where: {
      gameId: field.gameId,
      order: direction === 'up' ? { lt: field.order } : { gt: field.order },
    },
    orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbor) return;
  await prisma.$transaction([
    prisma.recruitmentField.update({ where: { id: field.id }, data: { order: neighbor.order } }),
    prisma.recruitmentField.update({ where: { id: neighbor.id }, data: { order: field.order } }),
  ]);
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

/** Crée les champs par défaut pour un jeu (modèle de départ, si vide). */
export async function seedDefaultRecruitFields(gameId: string) {
  await requireGameAccess(gameId);
  const existing = await prisma.recruitmentField.count({ where: { gameId } });
  if (existing > 0) return;
  await prisma.recruitmentField.createMany({
    data: DEFAULT_RECRUIT_FIELDS.map((f, i) => ({
      gameId,
      key: f.key,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder ?? null,
      helpText: f.helpText ?? null,
      required: f.required,
      options: f.options ?? [],
      order: i,
    })),
  });
  revalidatePublic();
  revalidatePath('/admin/recrutement');
}

// =============================================================================
//  CANDIDATURES
// =============================================================================
export async function updateApplication(formData: FormData) {
  const id = formData.get('id') as string;
  const app = await prisma.application.findUnique({ where: { id }, select: { gameId: true, status: true } });
  await requireGameAccess(app?.gameId);
  const newStatus = formData.get('status') as 'PENDING' | 'DISCUSSING' | 'ACCEPTED' | 'REJECTED';
  await prisma.application.update({
    where: { id },
    data: {
      status: newStatus,
      internalNotes: sanitizeText(formData.get('internalNotes'), 4000) || null,
    },
  });
  // Si le statut change, le bot poste un message dans le salon dédié.
  if (app && app.status !== newStatus) await syncApplicationStatusToBot(id);
  revalidatePath('/admin/candidatures');
}

export async function deleteApplication(id: string) {
  const app = await prisma.application.findUnique({
    where: { id },
    select: { gameId: true, discordChannelId: true, pseudo: true },
  });
  await requireGameAccess(app?.gameId);
  await prisma.application.delete({ where: { id } });
  // Supprime aussi le salon Discord dédié (no-op si pas de salon / bot non configuré).
  await deleteApplicationChannelFromBot(app?.discordChannelId ?? null);
  await logAudit('Candidature supprimée', app?.pseudo ?? id);
  revalidatePath('/admin/candidatures');
}

// =============================================================================
//  CALENDRIER (événements)
// =============================================================================
export async function saveEvent(formData: FormData) {
  const id = formData.get('id') as string | null;
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  // Instants UTC (ISO) envoyés par le formulaire (DateTimeInput).
  const start = formData.get('startDate') as string;
  const end = formData.get('endDate') as string;
  const startDate = start ? new Date(start) : null;
  if (!startDate || Number.isNaN(startDate.getTime())) return; // date de début requise

  const endDate = end ? new Date(end) : null;
  const data = {
    gameId,
    title: sanitizeText(formData.get('title'), 180),
    description: sanitizeText(formData.get('description'), 2000) || null,
    type: (formData.get('type') as string) || 'RAID',
    startDate,
    endDate,
  };

  // Édition : on met simplement à jour l'occurrence ciblée.
  if (id) {
    await prisma.event.update({ where: { id }, data });
    await syncEventToBot(id);
    revalidatePublic();
    revalidatePath('/admin/calendrier');
    return;
  }

  // Création : génère une série si une récurrence est demandée.
  const recurrence = (formData.get('recurrence') as string) || 'none';
  const occurrences = clampOccurrences(formData.get('occurrences'), recurrence);
  const duration = endDate ? endDate.getTime() - startDate.getTime() : null;
  // Série partagée seulement si > 1 occurrence (sinon événement unique).
  const seriesId = occurrences > 1 ? crypto.randomUUID() : null;

  const createdIds: string[] = [];
  for (let i = 0; i < occurrences; i++) {
    const occStart = stepDate(startDate, recurrence, i);
    const created = await prisma.event.create({
      data: {
        ...data,
        startDate: occStart,
        endDate: duration != null ? new Date(occStart.getTime() + duration) : null,
        seriesId,
      },
    });
    createdIds.push(created.id);
  }

  // Publie / met à jour le message Discord de chaque occurrence (no-op si bot non configuré).
  for (const eventId of createdIds) await syncEventToBot(eventId);
  revalidatePublic();
  revalidatePath('/admin/calendrier');
}

/** Nombre d'occurrences à générer (1 si pas de récurrence ; borné à 52). */
function clampOccurrences(raw: FormDataEntryValue | null, recurrence: string): number {
  if (recurrence === 'none') return 1;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 52);
}

/**
 * Décale une date d'`i` pas selon la cadence. Le calcul se fait sur l'instant
 * UTC ; un changement d'heure d'été Paris peut décaler l'heure affichée d'1 h
 * sur une occurrence — l'admin peut alors ajuster cette occurrence à la main.
 */
function stepDate(base: Date, recurrence: string, i: number): Date {
  if (i === 0) return base;
  const d = new Date(base);
  switch (recurrence) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + i);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7 * i);
      break;
    case 'biweekly':
      d.setUTCDate(d.getUTCDate() + 14 * i);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + i);
      break;
  }
  return d;
}

export async function deleteEvent(id: string) {
  const ev = await prisma.event.findUnique({
    where: { id },
    select: { gameId: true, discordChannelId: true, discordMessageId: true, title: true },
  });
  await requireGameAccess(ev?.gameId);
  await prisma.event.delete({ where: { id } });
  // Retire le message Discord associé (no-op si bot non configuré).
  await removeEventFromBot(ev?.discordChannelId ?? null, ev?.discordMessageId ?? null);
  await logAudit('Événement supprimé', ev?.title ?? id);
  revalidatePublic();
  revalidatePath('/admin/calendrier');
}

/** Valide le groupe de raid (joueurs retenus) → ping Discord des sélectionnés. */
export async function validateRaidRoster(eventId: string, selectedDiscordIds: string[], message?: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { gameId: true, title: true } });
  await requireGameAccess(ev?.gameId);

  const ids = new Set(selectedDiscordIds);
  const signups = await prisma.eventSignup.findMany({
    where: { eventId, status: 'GOING' },
    select: { id: true, discordId: true },
  });
  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: { rosterMessage: sanitizeText(message, 1000) || null },
    }),
    ...signups.map((s) =>
      prisma.eventSignup.update({ where: { id: s.id }, data: { selected: ids.has(s.discordId) } }),
    ),
  ]);

  await syncRosterToBot(eventId);
  await logAudit('Groupe de raid validé', `${ev?.title ?? eventId} · ${ids.size} retenu(s)`);
  revalidatePath('/admin/calendrier');
}

// =============================================================================
//  CONTENU STATIQUE (textes homepage, logo)
// =============================================================================
// Clés dont la valeur est du HTML riche (éditeur en place + texte riche),
// à nettoyer en conséquence. Tous les textes éditables sur la page en font
// partie, car ils acceptent désormais la mise en forme (gras, listes…).
const RICH_CONTENT_KEYS = new Set([
  'hero.tagline',
  'hero.subtitle',
  'about.title',
  'about.body',
  'philosophy.title',
  'philosophy.body',
]);

export async function saveSiteContent(formData: FormData) {
  await requireSuperAdmin();
  // On parcourt toutes les paires clé/valeur soumises et on les enregistre,
  // en nettoyant le HTML riche (anti-XSS) et le texte simple.
  for (const [key, raw] of formData.entries()) {
    if (typeof raw !== 'string') continue;
    const value = RICH_CONTENT_KEYS.has(key)
      ? sanitizeHtml(raw)
      : sanitizeText(raw, 4000);
    await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePublic();
  revalidatePath('/admin/contenu');
}

/**
 * Enregistre UNE seule clé de contenu (édition en place depuis l'aperçu).
 * Appelée par l'éditeur visuel quand on clique sur un texte de la homepage.
 */
export async function saveSiteContentField(key: string, raw: string) {
  await requireSuperAdmin();
  // On n'accepte que les clés de contenu connues (anti-abus).
  if (!(key in SITE_CONTENT_DEFAULTS)) throw new Error('Clé de contenu inconnue');
  const value = RICH_CONTENT_KEYS.has(key) ? sanitizeHtml(raw) : sanitizeText(raw, 4000);
  await prisma.siteContent.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePublic();
  revalidatePath('/admin/contenu');
}

/**
 * Enregistre les réglages des overlays de stream (hub /admin/overlays).
 * Reçoit le JSON { shared, overlays } produit par le hub ; on le re-construit
 * proprement (valeurs texte nettoyées, plafonnées) avant de le stocker.
 */
export async function saveOverlayConfig(json: string) {
  await requireOverlays();

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Configuration invalide');
  }

  // Nettoie un dictionnaire { param: valeur } en ne gardant que des chaînes courtes.
  const cleanMap = (input: unknown): Record<string, string> => {
    const out: Record<string, string> = {};
    if (input && typeof input === 'object') {
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
        if (typeof v === 'string' && v.length > 0) out[k] = sanitizePlainText(v, 300);
      }
    }
    return out;
  };

  const src = (parsed ?? {}) as { shared?: unknown; overlays?: unknown };
  const overlays: Record<string, Record<string, string>> = {};
  if (src.overlays && typeof src.overlays === 'object') {
    for (const [id, map] of Object.entries(src.overlays as Record<string, unknown>)) {
      overlays[id] = cleanMap(map);
    }
  }
  const value = JSON.stringify({ shared: cleanMap(src.shared), overlays });

  await prisma.siteContent.upsert({
    where: { key: OVERLAY_CONFIG_KEY },
    update: { value },
    create: { key: OVERLAY_CONFIG_KEY, value },
  });
  revalidatePath('/admin/overlays');
}

// =============================================================================
//  ALERTES DE STREAM (Twitch) — réservé au Super Admin
// =============================================================================

/** Envoie une alerte de TEST dans la file (pour prévisualiser l'overlay). */
export async function fireTestAlert(type: AlertType) {
  await requireOverlays();
  const samples: Record<AlertType, Parameters<typeof enqueueAlert>[0]> = {
    FOLLOW: { type: 'FOLLOW', username: 'NouveauFollow' },
    SUB: { type: 'SUB', username: 'NouvelAbo', tier: '1000' },
    RESUB: { type: 'RESUB', username: 'FidèleViewer', tier: '1000', amount: 6, message: 'Toujours au rendez-vous !' },
    SUBGIFT: { type: 'SUBGIFT', username: 'GénéreuxDonateur', tier: '1000', amount: 5 },
    RAID: { type: 'RAID', username: 'AmiStreamer', amount: 42 },
    TEST: { type: 'TEST', username: 'Test' },
  };
  await enqueueAlert(samples[type] ?? samples.TEST);
}

/** (Re)crée les abonnements Twitch EventSub pour la chaîne connectée. */
export async function setupTwitchSubscriptions() {
  await requireOverlays();
  const results = await setupSubscriptions();
  revalidatePath('/admin/overlays');
  return results;
}

/** Supprime un abonnement EventSub. */
export async function removeTwitchSubscription(id: string) {
  await requireOverlays();
  await deleteSubscription(id);
  revalidatePath('/admin/overlays');
}

/** Déconnecte la chaîne Twitch (oublie le diffuseur mémorisé). */
export async function disconnectTwitch() {
  await requireOverlays();
  await clearBroadcaster();
  revalidatePath('/admin/overlays');
}

// =============================================================================
//  BOT TWITCH — commandes de chat personnalisées
// =============================================================================
const TWITCH_LEVELS = new Set(['EVERYONE', 'SUB', 'MOD']);

function cleanCommandName(raw: FormDataEntryValue | null): string {
  return sanitizeText(raw, 40).toLowerCase().replace(/^!/, '').replace(/[^a-z0-9_]/g, '');
}

export async function createTwitchCommand(formData: FormData) {
  await requireOverlays();
  const name = cleanCommandName(formData.get('name'));
  const response = sanitizeText(formData.get('response'), 400);
  if (!name || !response) return;
  const userLevel = String(formData.get('userLevel') || 'EVERYONE');
  const cooldown = Math.max(0, Math.min(3600, Number(formData.get('cooldownSeconds')) || 5));
  await prisma.twitchCommand.upsert({
    where: { name },
    update: { response, userLevel: TWITCH_LEVELS.has(userLevel) ? userLevel : 'EVERYONE', cooldownSeconds: cooldown },
    create: { name, response, userLevel: TWITCH_LEVELS.has(userLevel) ? userLevel : 'EVERYONE', cooldownSeconds: cooldown },
  });
  revalidatePath('/admin/twitch');
}

export async function updateTwitchCommand(formData: FormData) {
  await requireOverlays();
  const id = formData.get('id') as string;
  const response = sanitizeText(formData.get('response'), 400);
  const userLevel = String(formData.get('userLevel') || 'EVERYONE');
  const cooldown = Math.max(0, Math.min(3600, Number(formData.get('cooldownSeconds')) || 5));
  if (!response) return;
  await prisma.twitchCommand.update({
    where: { id },
    data: { response, userLevel: TWITCH_LEVELS.has(userLevel) ? userLevel : 'EVERYONE', cooldownSeconds: cooldown },
  });
  revalidatePath('/admin/twitch');
}

export async function toggleTwitchCommand(id: string, enabled: boolean) {
  await requireOverlays();
  await prisma.twitchCommand.update({ where: { id }, data: { enabled } });
  revalidatePath('/admin/twitch');
}

export async function deleteTwitchCommand(id: string) {
  await requireOverlays();
  await prisma.twitchCommand.delete({ where: { id } });
  revalidatePath('/admin/twitch');
}

// --- Bot Twitch : timers ----------------------------------------------------
export async function createTwitchTimer(formData: FormData) {
  await requireOverlays();
  const name = sanitizeText(formData.get('name'), 60);
  const message = sanitizeText(formData.get('message'), 400);
  const interval = Math.max(1, Math.min(720, Number(formData.get('intervalMinutes')) || 15));
  if (!name || !message) return;
  await prisma.twitchTimer.create({ data: { name, message, intervalMinutes: interval } });
  revalidatePath('/admin/twitch');
}

export async function updateTwitchTimer(formData: FormData) {
  await requireOverlays();
  const id = formData.get('id') as string;
  const name = sanitizeText(formData.get('name'), 60);
  const message = sanitizeText(formData.get('message'), 400);
  const interval = Math.max(1, Math.min(720, Number(formData.get('intervalMinutes')) || 15));
  if (!message) return;
  await prisma.twitchTimer.update({ where: { id }, data: { name, message, intervalMinutes: interval } });
  revalidatePath('/admin/twitch');
}

export async function toggleTwitchTimer(id: string, enabled: boolean) {
  await requireOverlays();
  await prisma.twitchTimer.update({ where: { id }, data: { enabled } });
  revalidatePath('/admin/twitch');
}

export async function deleteTwitchTimer(id: string) {
  await requireOverlays();
  await prisma.twitchTimer.delete({ where: { id } });
  revalidatePath('/admin/twitch');
}

// --- Bot Twitch : modération ------------------------------------------------
export async function saveTwitchModConfig(formData: FormData) {
  await requireOverlays();
  const blacklist = String(formData.get('blacklist') || '')
    .split(/[\n,]/)
    .map((w) => sanitizeText(w, 60))
    .filter(Boolean)
    .slice(0, 200);
  const num = (key: string, def: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number(formData.get(key)) || def));
  const data = {
    blockLinks: formData.get('blockLinks') === 'on',
    permitSeconds: num('permitSeconds', 60, 5, 3600),
    capsEnabled: formData.get('capsEnabled') === 'on',
    capsMinLength: num('capsMinLength', 12, 1, 500),
    capsPercent: num('capsPercent', 70, 10, 100),
    blacklist,
    timeoutSeconds: num('timeoutSeconds', 30, 1, 1209600),
    warnMessage: sanitizeText(formData.get('warnMessage'), 200) || null,
    modsImmune: formData.get('modsImmune') === 'on',
  };
  await prisma.twitchModConfig.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
  revalidatePath('/admin/twitch');
}
