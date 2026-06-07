import { ChannelType, EmbedBuilder, type Client, type Guild, type TextChannel } from 'discord.js';
import { prisma } from '../prisma';
import { env } from '../env';

/**
 * Salon public « progression » par jeu : le bot y publie (et met à jour) un
 * embed reprenant la progression du site (tiers + boss). Idempotent : il édite
 * son message existant au lieu d'en reposter (repéré par son footer).
 */

const ACCENT = 0x4a9eff;
const MARKER = 'Progression officielle · Absolution';
const BOSS_ICON = { KILLED: '✅', PROGRESSING: '🔶', UNTESTED: '⬜' } as const;

function toColor(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

function clamp(value: string, max = 1024): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function getGuild(client: Client): Guild | null {
  return (
    (env.DISCORD_GUILD_ID && client.guilds.cache.get(env.DISCORD_GUILD_ID)) ||
    client.guilds.cache.first() ||
    null
  );
}

/** Publie / met à jour l'embed de progression d'un jeu dans `#progression-<slug>`. */
export async function syncProgression(client: Client, gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      raidTiers: {
        orderBy: { createdAt: 'desc' }, // contenu le plus récent en premier
        include: { bosses: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!game) return;

  const guild = getGuild(client);
  if (!guild) return;
  await guild.channels.fetch();
  const name = `progression-${game.slug}`;
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === name,
  ) as TextChannel | undefined;
  if (!channel) return; // pas de salon de progression pour ce jeu

  const embed = new EmbedBuilder()
    .setColor(toColor(game.color))
    .setTitle(`📊 Progression — ${game.name}`)
    .setFooter({ text: MARKER })
    .setTimestamp();
  if (game.logoUrl) embed.setThumbnail(game.logoUrl);

  if (game.raidTiers.length === 0) {
    embed.setDescription('Aucun contenu de raid pour le moment.');
  } else {
    for (const tier of game.raidTiers.slice(0, 10)) {
      const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;
      const total = tier.bosses.length;
      const body = tier.bosses.map((b) => `${BOSS_ICON[b.status]} ${b.name}`).join('\n') || '—';
      const title = `${tier.name}${tier.expansion ? ` — ${tier.expansion}` : ''} (${killed}/${total})`;
      embed.addFields({ name: title, value: clamp(body) });
    }
  }

  // Met à jour le message déjà posté par le bot (repéré par son footer).
  const me = channel.client.user?.id;
  let existing = null;
  try {
    const recent = await channel.messages.fetch({ limit: 20 });
    existing = recent.find((m) => m.author.id === me && m.embeds.some((e) => e.footer?.text === MARKER)) ?? null;
  } catch {
    existing = null;
  }

  if (existing) await existing.edit({ embeds: [embed] });
  else await channel.send({ embeds: [embed] });
}
