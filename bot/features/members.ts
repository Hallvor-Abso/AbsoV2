import type { Client, Guild, GuildMember } from 'discord.js';
import { prisma } from '../prisma';
import { gameRoleTag } from './roles';
import { env } from '../env';

export type StructuredRole = {
  key: string; // identifiant stable (« gm », « visiteur », « officier:<gameId> »…)
  name: string; // nom du rôle Discord attendu (« GM », « Officier WOW »…)
  kind: 'gm' | 'visiteur' | 'officier' | 'roster' | 'membre' | 'recrue';
  gameId: string | null;
  gameName: string | null;
  roleId: string | null; // null si le rôle n'existe pas (encore) sur le serveur
};

const GAME_KINDS = [
  { kind: 'officier', prefix: 'Officier' },
  { kind: 'roster', prefix: 'Roster' },
  { kind: 'membre', prefix: 'Membre' },
  { kind: 'recrue', prefix: 'Recrue' },
] as const;

function getGuild(client: Client): Guild {
  const guild =
    (env.DISCORD_GUILD_ID && client.guilds.cache.get(env.DISCORD_GUILD_ID)) ||
    client.guilds.cache.first();
  if (!guild) throw new Error('Serveur Discord introuvable.');
  return guild;
}

/**
 * Construit la liste des rôles « structurés » gérables depuis le site :
 * GM (global) + Officier/Roster/Membre/Recrue de chaque jeu. Les IDs sont
 * résolus PAR NOM → les rôles des futurs jeux apparaissent automatiquement
 * dès qu'ils sont créés sur Discord.
 */
async function buildStructuredRoles(guild: Guild): Promise<StructuredRole[]> {
  await guild.roles.fetch();
  const findId = (name: string) =>
    guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase())?.id ?? null;

  const list: StructuredRole[] = [
    { key: 'gm', name: 'GM', kind: 'gm', gameId: null, gameName: null, roleId: findId('GM') },
    { key: 'visiteur', name: 'Visiteur', kind: 'visiteur', gameId: null, gameName: null, roleId: findId('Visiteur') },
  ];
  const games = await prisma.game.findMany({ orderBy: { order: 'asc' } });
  for (const g of games) {
    const tag = gameRoleTag(g);
    for (const { kind, prefix } of GAME_KINDS) {
      const name = `${prefix} ${tag}`;
      list.push({ key: `${kind}:${g.id}`, name, kind, gameId: g.id, gameName: g.name, roleId: findId(name) });
    }
  }
  return list;
}

/**
 * Applique la hiérarchie des grades à un ensemble de clés souhaitées :
 *  - cumul descendant par jeu : Officier ⟹ Roster + Membre, Roster ⟹ Membre
 *  - Recrue exclusif : retiré dès qu'un grade supérieur (Membre/Roster/Officier)
 *    du même jeu est présent
 *  - Visiteur (global, unique) : retiré dès qu'un grade de jeu (Recrue ou plus)
 *    ou GM est présent
 */
function normalizeKeys(keys: Iterable<string>, structured: StructuredRole[]): Set<string> {
  const out = new Set(keys);
  const gameIds = [...new Set(structured.filter((r) => r.gameId).map((r) => r.gameId!))];
  let hasAnyGameRank = false;

  for (const gid of gameIds) {
    let m = out.has(`membre:${gid}`);
    let r = out.has(`roster:${gid}`);
    const o = out.has(`officier:${gid}`);
    let rec = out.has(`recrue:${gid}`);

    if (o) r = true; // Officier ⟹ Roster
    if (r) m = true; // Roster ⟹ Membre
    if (m || r || o) rec = false; // un grade supérieur retire Recrue

    if (m) out.add(`membre:${gid}`); else out.delete(`membre:${gid}`);
    if (r) out.add(`roster:${gid}`); else out.delete(`roster:${gid}`);
    if (rec) out.add(`recrue:${gid}`); else out.delete(`recrue:${gid}`);

    if (m || r || o || rec) hasAnyGameRank = true;
  }

  if (hasAnyGameRank || out.has('gm')) out.delete('visiteur');
  return out;
}

/** Rôles structurés d'un membre + s'ils lui sont attribués (lecture en direct). */
export async function getMemberRoles(client: Client, discordId: string) {
  const guild = getGuild(client);
  const structured = await buildStructuredRoles(guild);
  let member: GuildMember | null = null;
  try {
    member = await guild.members.fetch(discordId);
  } catch {
    member = null; // membre absent du serveur Discord
  }
  const roles = structured.map((r) => ({
    ...r,
    assigned: Boolean(member && r.roleId && member.roles.cache.has(r.roleId)),
  }));
  return { found: Boolean(member), roles };
}

/**
 * Applique l'état souhaité (liste de clés attribuées) sur le membre : n'agit
 * QUE sur les rôles structurés, jamais sur les autres rôles Discord du membre.
 */
export async function setMemberRoles(client: Client, discordId: string, assignedKeys: string[]) {
  const guild = getGuild(client);
  const structured = await buildStructuredRoles(guild);
  const member = await guild.members.fetch(discordId); // lève une erreur si absent
  const wanted = normalizeKeys(assignedKeys, structured); // applique la hiérarchie
  const warnings: string[] = [];
  const applied: string[] = []; // clés réellement attribuées après application

  for (const r of structured) {
    const want = wanted.has(r.key);
    if (!r.roleId) {
      if (want) warnings.push(`Rôle « ${r.name} » introuvable sur le serveur (à créer).`);
      continue;
    }
    const has = member.roles.cache.has(r.roleId);
    try {
      if (want && !has) await member.roles.add(r.roleId, 'Rôle assigné depuis le site Absolution');
      else if (!want && has) await member.roles.remove(r.roleId, 'Rôle retiré depuis le site Absolution');
      if (want) applied.push(r.key);
    } catch {
      warnings.push(`Impossible de modifier « ${r.name} » — vérifie les permissions du bot.`);
      if (has) applied.push(r.key); // inchangé : on reflète l'état réel
    }
  }
  return { ok: true, warnings, assignedKeys: applied };
}
