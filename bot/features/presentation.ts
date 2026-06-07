import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  type Guild,
  type TextChannel,
} from 'discord.js';
import { prisma } from '../prisma';
import { env } from '../env';

/**
 * Embed de présentation de la guilde, publié dans le salon #présentation.
 *
 * Le contenu reprend AUTOMATIQUEMENT les textes du site (table SiteContent,
 * mêmes textes que la page d'accueil) → une seule source de vérité. La commande
 * est relançable : elle met à jour l'embed existant au lieu d'en reposter un.
 */

const ACCENT = 0x4a9eff;
const MARKER = 'Présentation officielle · Absolution';

// Valeurs par défaut (repli si un texte n'a pas été personnalisé côté site).
const DEFAULTS: Record<string, string> = {
  'hero.tagline': 'Progression. Cohésion. Excellence.',
  'hero.subtitle':
    'Absolution est une guilde semi-hardcore dédiée au contenu haut-niveau.',
  'about.title': 'Qui sommes-nous',
  'about.body': '',
  'philosophy.title': 'Notre philosophie',
  'philosophy.body': '',
  'site.logoUrl': '',
};

/** Tronque proprement un champ d'embed (limite Discord : 1024 caractères). */
function clamp(value: string, max = 1024): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function siteContent(): Promise<Record<string, string>> {
  const rows = await prisma.siteContent.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...overrides };
}

function buildEmbed(c: Record<string, string>, games: { name: string }[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('Absolution')
    .setDescription(clamp(`*${c['hero.tagline']}*\n\n${c['hero.subtitle']}`, 4000))
    .setFooter({ text: MARKER });

  if (c['about.body']) embed.addFields({ name: c['about.title'], value: clamp(c['about.body']) });
  if (c['philosophy.body']) {
    embed.addFields({ name: c['philosophy.title'], value: clamp(c['philosophy.body']) });
  }
  if (games.length > 0) {
    embed.addFields({ name: 'Nos jeux', value: games.map((g) => `• ${g.name}`).join('\n') });
  }
  if (c['site.logoUrl']) embed.setThumbnail(c['site.logoUrl']);
  if (env.SITE_URL) embed.setURL(env.SITE_URL);
  return embed;
}

function buildButtons(): ActionRowBuilder<ButtonBuilder> | null {
  if (!env.SITE_URL) return null;
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('🌐 Site web').setURL(env.SITE_URL),
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel('📝 Recrutement')
      .setURL(`${env.SITE_URL}/recrutement`),
  );
}

export type PresentationResult =
  | { ok: false; reason: string }
  | { ok: true; updated: boolean };

/** Publie (ou met à jour) l'embed de présentation dans #présentation. */
export async function postPresentation(guild: Guild): Promise<PresentationResult> {
  await guild.channels.fetch();
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'presentation',
  ) as TextChannel | undefined;
  if (!channel) {
    return { ok: false, reason: 'Salon #présentation introuvable — lance `/setup-serveur` d’abord.' };
  }

  const [content, games] = await Promise.all([
    siteContent(),
    prisma.game.findMany({
      where: { isActive: true },
      orderBy: [{ status: 'asc' }, { order: 'asc' }],
      select: { name: true },
    }),
  ]);

  const embed = buildEmbed(content, games);
  const row = buildButtons();
  const payload = { embeds: [embed], components: row ? [row] : [] };

  // Met à jour l'embed déjà posté par le bot (identifié par son footer).
  const me = channel.client.user?.id;
  let existing = null;
  try {
    const recent = await channel.messages.fetch({ limit: 25 });
    existing =
      recent.find(
        (m) => m.author.id === me && m.embeds.some((e) => e.footer?.text === MARKER),
      ) ?? null;
  } catch {
    existing = null; // pas d'historique accessible → on postera un nouveau message
  }

  if (existing) {
    await existing.edit(payload);
    return { ok: true, updated: true };
  }
  await channel.send(payload);
  return { ok: true, updated: false };
}
