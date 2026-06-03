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
import { canAccessAdmin, canAccessContenu, canManageGlobally, allowedGameIds } from '@/lib/permissions';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize';
import { slugify } from '@/lib/utils';

/** Bloque l'action réservée au Super Admin (ex : Contenu du site). */
async function requireSuperAdmin() {
  const user = await getAppUser();
  if (!canAccessContenu(user)) {
    throw new Error('Non autorisé');
  }
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

  await prisma.user.update({
    where: { id },
    data: {
      role,
      adminGames: { set: gameIds.map((g) => ({ id: g })) },
    },
  });
  revalidatePath('/admin/membres');
}

export async function deleteMember(id: string) {
  const me = await requireManager();
  if (me.id === id) throw new Error('Vous ne pouvez pas supprimer votre propre compte.');
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/membres');
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
  await prisma.game.update({ where: { id }, data: { isActive } });
  revalidatePublic();
}

export async function deleteGame(id: string) {
  await requireManager();
  await prisma.game.delete({ where: { id } });
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

  const data = {
    title,
    slug: id ? undefined : slug, // on ne régénère pas le slug à l'édition
    excerpt: sanitizeText(formData.get('excerpt'), 400) || null,
    content: sanitizeHtml((formData.get('content') as string) || ''),
    imageUrl: sanitizeText(formData.get('imageUrl'), 500) || null,
    featured: formData.get('featured') === 'on', // article « À la Une »
    status,
    gameId: gameId || null,
    // On fixe la date de publication la première fois qu'on publie.
    publishedAt:
      status === 'PUBLISHED' ? new Date() : null,
  };

  if (id) {
    // À l'édition, on conserve la date de publication d'origine si déjà publiée.
    const current = await prisma.news.findUnique({ where: { id } });
    await prisma.news.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          status === 'PUBLISHED'
            ? current?.publishedAt ?? new Date()
            : null,
      },
    });
  } else {
    await prisma.news.create({ data: { ...data, slug } });
  }
  revalidatePublic();
  revalidatePath(`/news/${slug}`);
  revalidatePath('/admin/news');
  // Retour à la liste des articles après l'enregistrement.
  redirect('/admin/news');
}

export async function deleteNews(id: string) {
  const n = await prisma.news.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(n?.gameId);
  await prisma.news.delete({ where: { id } });
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
  const count = await prisma.raidTier.count({ where: { gameId } });
  await prisma.raidTier.create({ data: { gameId, name, order: count } });
  revalidatePublic();
  revalidatePath('/admin/progression');
}

/** Met à jour le zoneId Warcraft Logs d'un tier (pour la synchro auto). */
export async function updateTier(formData: FormData) {
  const id = formData.get('id') as string;
  await requireGameAccess(await gameIdOfTier(id));
  const zoneRaw = formData.get('zoneId') as string;
  const zoneId = zoneRaw && !Number.isNaN(Number(zoneRaw)) ? Number(zoneRaw) : null;
  await prisma.raidTier.update({ where: { id }, data: { zoneId } });
  revalidatePublic();
  revalidatePath('/admin/progression');
}

export async function deleteTier(id: string) {
  await requireGameAccess(await gameIdOfTier(id));
  await prisma.raidTier.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/progression');
}

export async function createBoss(formData: FormData) {
  const tierId = formData.get('tierId') as string;
  await requireGameAccess(await gameIdOfTier(tierId));
  const name = sanitizeText(formData.get('name'), 120);
  if (!tierId || !name) return;
  const count = await prisma.boss.count({ where: { tierId } });
  await prisma.boss.create({ data: { tierId, name, order: count } });
  revalidatePublic();
  revalidatePath('/admin/progression');
}

/** Met à jour un boss : statut, date de premier kill et visuel. */
export async function updateBoss(formData: FormData) {
  const id = formData.get('id') as string;
  await requireGameAccess(await gameIdOfBoss(id));
  const status = formData.get('status') as 'KILLED' | 'PROGRESSING' | 'UNTESTED';
  const dateStr = formData.get('firstKillDate') as string;

  const encounterRaw = formData.get('encounterId') as string;
  const encounterId = encounterRaw && !Number.isNaN(Number(encounterRaw))
    ? Number(encounterRaw)
    : null;

  await prisma.boss.update({
    where: { id },
    data: {
      status,
      firstKillDate:
        status === 'KILLED' && dateStr ? new Date(dateStr) : null,
      imageUrl: sanitizeText(formData.get('imageUrl'), 500) || null,
      encounterId,
    },
  });
  revalidatePublic();
  revalidatePath('/admin/progression');
}

export async function deleteBoss(id: string) {
  await requireGameAccess(await gameIdOfBoss(id));
  await prisma.boss.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/progression');
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

// =============================================================================
//  CANDIDATURES
// =============================================================================
export async function updateApplication(formData: FormData) {
  const id = formData.get('id') as string;
  const app = await prisma.application.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(app?.gameId);
  await prisma.application.update({
    where: { id },
    data: {
      status: formData.get('status') as
        | 'PENDING'
        | 'DISCUSSING'
        | 'ACCEPTED'
        | 'REJECTED',
      internalNotes: sanitizeText(formData.get('internalNotes'), 4000) || null,
    },
  });
  revalidatePath('/admin/candidatures');
}

export async function deleteApplication(id: string) {
  const app = await prisma.application.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(app?.gameId);
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin/candidatures');
}

// =============================================================================
//  CALENDRIER (événements)
// =============================================================================
export async function saveEvent(formData: FormData) {
  const id = formData.get('id') as string | null;
  const gameId = formData.get('gameId') as string;
  await requireGameAccess(gameId);
  const start = formData.get('startDate') as string;
  const end = formData.get('endDate') as string;

  const data = {
    gameId,
    title: sanitizeText(formData.get('title'), 180),
    description: sanitizeText(formData.get('description'), 2000) || null,
    type: (formData.get('type') as string) || 'RAID',
    startDate: new Date(start),
    endDate: end ? new Date(end) : null,
  };
  if (id) {
    await prisma.event.update({ where: { id }, data });
  } else {
    await prisma.event.create({ data });
  }
  revalidatePublic();
  revalidatePath('/admin/calendrier');
}

export async function deleteEvent(id: string) {
  const ev = await prisma.event.findUnique({ where: { id }, select: { gameId: true } });
  await requireGameAccess(ev?.gameId);
  await prisma.event.delete({ where: { id } });
  revalidatePublic();
  revalidatePath('/admin/calendrier');
}

// =============================================================================
//  CONTENU STATIQUE (textes homepage, logo)
// =============================================================================
export async function saveSiteContent(formData: FormData) {
  await requireSuperAdmin();
  // On parcourt toutes les paires clé/valeur soumises et on les enregistre.
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  revalidatePublic();
  revalidatePath('/admin/contenu');
}
