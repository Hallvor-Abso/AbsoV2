import type { Client, Guild, GuildMember } from 'discord.js';
import { prisma } from '../prisma';
import { gameRoleTag } from './roles';
import { env } from '../env';

export type StructuredRole = {
  key: string; // identifiant stable (« gm », « officier:<gameId> »…)
  name: string; // nom du rôle Discord attendu (« GM », « Officier WOW »…)
  kind: 'gm' | 'officier' | 'roster' | 'membre' | 'recrue';
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
  const wanted = new Set(assignedKeys);
  const warnings: string[] = [];

  for (const r of structured) {
    if (!r.roleId) {
      if (wanted.has(r.key)) warnings.push(`Rôle « ${r.name} » introuvable sur le serveur (à créer).`);
      continue;
    }
    const has = member.roles.cache.has(r.roleId);
    const want = wanted.has(r.key);
    try {
      if (want && !has) await member.roles.add(r.roleId, 'Rôle assigné depuis le site Absolution');
      else if (!want && has) await member.roles.remove(r.roleId, 'Rôle retiré depuis le site Absolution');
    } catch {
      warnings.push(`Impossible de modifier « ${r.name} » — vérifie les permissions du bot.`);
    }
  }
  return { ok: true, warnings };
}
