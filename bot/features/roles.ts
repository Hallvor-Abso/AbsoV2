import type { Guild } from 'discord.js';

type GameLike = { slug: string; discordRoleTag: string | null };

/** Tag des rôles Discord d'un jeu (« WOW »…). Champ dédié, sinon slug en majuscules. */
export function gameRoleTag(game: GameLike): string {
  return (game.discordRoleTag?.trim() || game.slug).toUpperCase();
}

/** Noms des rôles à pinguer pour le calendrier d'un jeu. */
export function calendarRoleNames(game: GameLike): string[] {
  const tag = gameRoleTag(game);
  return ['GM', `Officier ${tag}`, `Roster ${tag}`, `Membre ${tag}`, `Recrue ${tag}`];
}

/** Noms des rôles à pinguer pour une candidature d'un jeu. */
export function applicationRoleNames(game: GameLike): string[] {
  const tag = gameRoleTag(game);
  return ['GM', `Officier ${tag}`];
}

/**
 * Résout des noms de rôles en mentions Discord (« <@&id> »), en cherchant les
 * rôles du serveur PAR NOM (insensible à la casse). Les rôles introuvables sont
 * simplement ignorés → le bot s'adapte aux rôles créés plus tard, sans config.
 */
export async function resolveRoleMentions(
  guild: Guild,
  names: string[],
): Promise<{ content: string; roleIds: string[] }> {
  await guild.roles.fetch();
  const roleIds: string[] = [];
  for (const name of names) {
    const wanted = name.trim().toLowerCase();
    const role = guild.roles.cache.find((r) => r.name.toLowerCase() === wanted);
    if (role) {
      if (!roleIds.includes(role.id)) roleIds.push(role.id);
    } else {
      console.warn(`Rôle Discord introuvable : « ${name} » (ping ignoré).`);
    }
  }
  return { content: roleIds.map((id) => `<@&${id}>`).join(' '), roleIds };
}
