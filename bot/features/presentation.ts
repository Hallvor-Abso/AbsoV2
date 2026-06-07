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

/** Convertit le HTML éventuel (éditeur du site) en texte simple pour Discord. */
function stripHtml(input: string): string {
  return input
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '') // toutes les autres balises
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&(#39|apos);/gi, "'")
    .replace(/&(#8217|rsquo);/gi, '’')
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Tronque proprement un champ d'embed (limite Discord : 1024 caractères). */
function clamp(value: string, max = 1024): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

async function siteContent(): Promise<Record<string, string>> {
  const rows = await prisma.siteContent.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged = { ...DEFAULTS, ...overrides };
  // Nettoyage HTML systématique des textes affichés.
  for (const key of ['hero.tagline', 'hero.subtitle', 'about.body', 'philosophy.body']) {
    if (merged[key]) merged[key] = stripHtml(merged[key]);
  }
  return merged;
}

function buildEmbed(
  c: Record<string, string>,
  games: { name: string; coverImageUrl: string | null }[],
): EmbedBuilder {
  const logo = c['site.logoUrl'] || undefined;
  // Bannière : variable dédiée en priorité, sinon art d'un jeu en repli.
  const banner =
    env.PRESENTATION_BANNER_URL || games.find((g) => g.coverImageUrl)?.coverImageUrl || undefined;

  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setAuthor({ name: 'Guilde Absolution', iconURL: logo })
    .setTitle(c['hero.tagline'])
    .setDescription(clamp(c['hero.subtitle'], 4000))
    .setFooter({ text: MARKER, iconURL: logo })
    .setTimestamp();

  if (env.SITE_URL) embed.setURL(env.SITE_URL);

  // Sections côte à côte (inline) pour un rendu horizontal et compact.
  if (c['about.body']) {
    embed.addFields({ name: `📜 ${c['about.title']}`, value: clamp(c['about.body']), inline: true });
  }
  if (c['philosophy.body']) {
    embed.addFields({
      name: `⚔️ ${c['philosophy.title']}`,
      value: clamp(c['philosophy.body']),
      inline: true,
    });
  }
  if (games.length > 0) {
    embed.addFields({
      name: '🎮 Nos jeux',
      value: games.map((g) => `🔹 ${g.name}`).join('   '),
      inline: false,
    });
  }

  // Appel à l'action (le lien cliquable n'apparaît que si SITE_URL est défini).
  embed.addFields({
    name: '​',
    value: env.SITE_URL
      ? `**Envie de nous rejoindre ?** Découvre les postes ouverts et postule sur [notre site](${env.SITE_URL}/recrutement).`
      : '**Envie de nous rejoindre ?** Consulte le salon de recrutement et postule sur notre site.',
  });

  // Visuel : grande bannière (art d'un jeu) si dispo, sinon le logo en vignette.
  if (banner) embed.setImage(banner);
  else if (logo) embed.setThumbnail(logo);

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
      select: { name: true, coverImageUrl: true },
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
