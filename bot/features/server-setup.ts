import {
  ChannelType,
  OverwriteType,
  PermissionFlagsBits,
  type CategoryChannel,
  type Guild,
  type OverwriteResolvable,
} from 'discord.js';
import { prisma } from '../prisma';
import { gameRoleTag } from './roles';
import { syncProgression } from './progression';

/**
 * Construit (ou complète) la structure complète du serveur Discord :
 * catégories, salons, vocaux et permissions, à partir des jeux et des rôles
 * existants.
 *
 * IDÉMPOTENT et NON DESTRUCTIF : tout est recherché par nom et créé seulement
 * s'il manque. La commande ne supprime jamais rien — on peut la relancer après
 * avoir ajouté un jeu pour générer uniquement ce qui manque.
 */

const P = PermissionFlagsBits;

// Droits accordés aux rôles autorisés dans une zone (texte + vocal).
const MEMBER_ALLOW = [
  P.ViewChannel,
  P.SendMessages,
  P.ReadMessageHistory,
  P.AddReactions,
  P.Connect,
  P.Speak,
];

/** Construit une permission overwrite de rôle. */
function ow(id: string, allow: bigint[] = [], deny: bigint[] = []): OverwriteResolvable {
  return { id, allow, deny, type: OverwriteType.Role };
}

/** Normalise un nom de salon texte (minuscules, tirets). */
function textName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type Acc = { created: string[]; warnings: string[] };

/** Trouve un rôle par nom, ou le crée s'il manque. Renvoie son ID. */
async function ensureRole(guild: Guild, name: string, acc: Acc): Promise<string> {
  const existing = guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  try {
    const role = await guild.roles.create({ name, reason: 'Structure serveur (setup)' });
    acc.created.push(`@${name}`);
    return role.id;
  } catch {
    acc.warnings.push(`Rôle « ${name} » introuvable et impossible à créer (permissions du bot ?).`);
    return '';
  }
}

/** Trouve une catégorie par nom, ou la crée. Met à jour ses permissions. */
async function ensureCategory(
  guild: Guild,
  name: string,
  overwrites: OverwriteResolvable[],
  acc: Acc,
): Promise<CategoryChannel | null> {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name,
  ) as CategoryChannel | undefined;
  if (existing) {
    await existing.permissionOverwrites.set(overwrites).catch(() => {
      acc.warnings.push(`Permissions de la catégorie « ${name} » non mises à jour.`);
    });
    return existing;
  }
  try {
    const cat = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
    });
    acc.created.push(`📁 ${name}`);
    return cat;
  } catch {
    acc.warnings.push(`Catégorie « ${name} » impossible à créer (permissions du bot ?).`);
    return null;
  }
}

/** Trouve un salon (texte/vocal) dans une catégorie, ou le crée. */
async function ensureChannel(
  guild: Guild,
  rawName: string,
  parent: CategoryChannel,
  type: ChannelType.GuildText | ChannelType.GuildVoice,
  acc: Acc,
  overwrites?: OverwriteResolvable[],
): Promise<void> {
  const name = type === ChannelType.GuildText ? textName(rawName) : rawName;
  const existing = guild.channels.cache.find(
    (c) => c.type === type && c.parentId === parent.id && c.name === name,
  );
  if (existing) {
    if (overwrites && !existing.isThread()) {
      await existing.permissionOverwrites.set(overwrites).catch(() => {});
    }
    return;
  }
  try {
    await guild.channels.create({
      name,
      type,
      parent: parent.id,
      ...(overwrites ? { permissionOverwrites: overwrites } : {}),
    });
    acc.created.push(`${type === ChannelType.GuildText ? '#' : '🔊'} ${name}`);
  } catch {
    acc.warnings.push(`Salon « ${name} » impossible à créer.`);
  }
}

/**
 * Déplace un salon existant (par ID) sous une catégorie.
 * - `lock` : aligne les droits du salon sur ceux de la catégorie.
 * - `restrictTo` : applique des droits explicites (ex. officiers uniquement).
 */
async function moveChannel(
  guild: Guild,
  channelId: string | null,
  parent: CategoryChannel,
  acc: Acc,
  opts: { lock?: boolean; restrictTo?: OverwriteResolvable[] } = {},
): Promise<void> {
  if (!channelId) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.isThread() || channel.type === ChannelType.GuildCategory) return;
  try {
    await channel.setParent(parent.id, { lockPermissions: opts.lock ?? false });
    if (opts.restrictTo) await channel.permissionOverwrites.set(opts.restrictTo).catch(() => {});
  } catch {
    acc.warnings.push(`Salon existant ${channelId} non rangé (introuvable ou droits).`);
  }
}

export async function setupServer(guild: Guild): Promise<Acc> {
  const acc: Acc = { created: [], warnings: [] };
  await guild.roles.fetch();
  await guild.channels.fetch();

  const everyone = guild.roles.everyone.id;
  const gm = await ensureRole(guild, 'GM', acc);
  await ensureRole(guild, 'Visiteur', acc); // garanti présent (utilisé par le site)

  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });

  // Rôles par jeu (résolus/créés) : utiles pour les permissions des zones.
  const officerIds: string[] = [];
  const allMemberIds: string[] = []; // tous grades de tous les jeux
  const perGame: {
    game: (typeof games)[number];
    tag: string;
    officier: string;
    roster: string;
    membre: string;
    recrue: string;
  }[] = [];

  for (const game of games) {
    const tag = gameRoleTag(game);
    const officier = await ensureRole(guild, `Officier ${tag}`, acc);
    const roster = await ensureRole(guild, `Roster ${tag}`, acc);
    const membre = await ensureRole(guild, `Membre ${tag}`, acc);
    const recrue = await ensureRole(guild, `Recrue ${tag}`, acc);
    if (officier) officerIds.push(officier);
    for (const id of [officier, roster, membre, recrue]) if (id) allMemberIds.push(id);
    perGame.push({ game, tag, officier, roster, membre, recrue });
  }

  const gmAllow = gm ? [ow(gm, MEMBER_ALLOW)] : [];

  // ----- 🌐 ACCUEIL (public, lecture seule sauf #général) ---------------------
  const accueil = await ensureCategory(
    guild,
    '🌐 Accueil',
    [ow(everyone, [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages]), ...gmAllow,
     ...officerIds.map((id) => ow(id, [P.SendMessages]))],
    acc,
  );
  if (accueil) {
    await ensureChannel(guild, 'présentation', accueil, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'général', accueil, ChannelType.GuildText, acc, [
      ow(everyone, [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AddReactions]),
    ]);
  }

  // ----- 🏰 GUILDE (tous les grades + GM) -------------------------------------
  const guilde = await ensureCategory(
    guild,
    '🏰 Guilde',
    [ow(everyone, [], [P.ViewChannel]), ...gmAllow, ...allMemberIds.map((id) => ow(id, MEMBER_ALLOW))],
    acc,
  );
  if (guilde) {
    await ensureChannel(guild, 'général', guilde, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'médias', guilde, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'hors-sujet', guilde, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'Taverne', guilde, ChannelType.GuildVoice, acc);
    await ensureChannel(guild, 'Détente', guilde, ChannelType.GuildVoice, acc);
  }

  // ----- 🎮 Une catégorie par jeu ---------------------------------------------
  for (const g of perGame) {
    const roleIds = [g.officier, g.roster, g.membre, g.recrue].filter(Boolean);
    const cat = await ensureCategory(
      guild,
      `🎮 ${g.game.name}`,
      [ow(everyone, [], [P.ViewChannel]), ...gmAllow, ...roleIds.map((id) => ow(id, MEMBER_ALLOW))],
      acc,
    );
    if (!cat) continue;

    // #annonces : lecture seule pour les non-officiers du jeu.
    const annoncesDeny = [g.roster, g.membre, g.recrue]
      .filter(Boolean)
      .map((id) => ow(id, [], [P.SendMessages]));

    await ensureChannel(guild, `${g.tag}-général`, cat, ChannelType.GuildText, acc);
    await ensureChannel(guild, `${g.tag}-annonces`, cat, ChannelType.GuildText, acc, annoncesDeny);
    await ensureChannel(guild, `${g.tag}-stratégies`, cat, ChannelType.GuildText, acc);
    await ensureChannel(guild, `${g.tag} Général`, cat, ChannelType.GuildVoice, acc);
    await ensureChannel(guild, `${g.tag} Raid 1`, cat, ChannelType.GuildVoice, acc);
    await ensureChannel(guild, `${g.tag} Raid 2`, cat, ChannelType.GuildVoice, acc);

    // Rangement des salons existants sous la catégorie du jeu.
    // - calendrier : aligné sur la catégorie → visible par les membres du jeu.
    await moveChannel(guild, g.game.discordCalendarChannelId, cat, acc, { lock: true });
    // - candidature (salon unique) : restreint aux officiers + GM (caché aux membres).
    const officerOnly: OverwriteResolvable[] = [
      ow(everyone, [], [P.ViewChannel]),
      ...[g.roster, g.membre, g.recrue].filter(Boolean).map((id) => ow(id, [], [P.ViewChannel])),
      ...gmAllow,
      ...(g.officier ? [ow(g.officier, MEMBER_ALLOW)] : []),
    ];
    await moveChannel(guild, g.game.discordRecruitmentChannelId, cat, acc, { restrictTo: officerOnly });
  }

  // ----- 🛡️ STAFF (GM + Officiers) --------------------------------------------
  const staff = await ensureCategory(
    guild,
    '🛡️ Staff',
    [ow(everyone, [], [P.ViewChannel]), ...gmAllow, ...officerIds.map((id) => ow(id, MEMBER_ALLOW))],
    acc,
  );
  if (staff) {
    await ensureChannel(guild, 'officiers', staff, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'logs', staff, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'modération', staff, ChannelType.GuildText, acc);
    await ensureChannel(guild, 'Réunion Staff', staff, ChannelType.GuildVoice, acc);
  }

  // ----- 📊 PROGRESSION (public, lecture seule) : un salon par jeu ------------
  const botId = guild.client.user?.id;
  const progression = await ensureCategory(
    guild,
    '📊 Progression',
    [ow(everyone, [P.ViewChannel, P.ReadMessageHistory], [P.SendMessages]), ...gmAllow,
     ...officerIds.map((id) => ow(id, [P.SendMessages])),
     ...(botId ? [ow(botId, [P.ViewChannel, P.SendMessages, P.ReadMessageHistory])] : [])],
    acc,
  );
  if (progression) {
    for (const g of perGame) {
      await ensureChannel(guild, `progression-${g.game.slug}`, progression, ChannelType.GuildText, acc);
    }
    // Publie / met à jour l'embed de progression de chaque jeu.
    for (const g of perGame) {
      await syncProgression(guild.client, g.game.id).catch((e) =>
        acc.warnings.push(`Progression ${g.game.name} non publiée : ${e instanceof Error ? e.message : e}`),
      );
    }
  }

  return acc;
}
