import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Client,
  type GuildTextBasedChannel,
} from 'discord.js';
import { prisma } from '../prisma';
import { env } from '../env';

const ACCENT = 0x4a9eff;

function toColor(hex?: string | null): number {
  if (!hex) return ACCENT;
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function resolveChannel(client: Client, channelId: string): Promise<GuildTextBasedChannel | null> {
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (ch && ch.isTextBased() && !ch.isDMBased()) return ch as GuildTextBasedChannel;
  return null;
}

/**
 * Poste (ou met à jour) une news publiée dans le salon « News » de Discord.
 * Ne fait rien si l'article n'est pas publié / pas encore visible.
 */
export async function syncNews(client: Client, newsId: string): Promise<void> {
  const news = await prisma.news.findUnique({ where: { id: newsId }, include: { game: true } });
  if (!news) return;

  const visible = news.status === 'PUBLISHED' && news.publishedAt != null && news.publishedAt <= new Date();
  if (!visible) return;

  const channelId = news.discordChannelId || env.DISCORD_NEWS_CHANNEL_ID;
  if (!channelId) {
    console.log('Bot news : aucun salon configuré (DISCORD_NEWS_CHANNEL_ID).');
    return;
  }
  const channel = await resolveChannel(client, channelId);
  if (!channel) {
    console.error('Bot news : salon introuvable ou non textuel.');
    return;
  }

  const url = env.SITE_URL ? `${env.SITE_URL}/news/${news.slug}` : undefined;
  const desc = (news.excerpt || stripHtml(news.content)).slice(0, 300);

  const embed = new EmbedBuilder()
    .setColor(toColor(news.game?.color))
    .setTitle(news.title)
    .setTimestamp(news.publishedAt);
  if (desc) embed.setDescription(desc);
  if (url) embed.setURL(url);
  if (news.imageUrl) embed.setImage(news.imageUrl);
  embed.setFooter({ text: news.game ? `News · ${news.game.name}` : 'News Absolution' });

  const components = url
    ? [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setLabel("Lire l'article").setStyle(ButtonStyle.Link).setURL(url),
        ),
      ]
    : [];

  // Édite le message existant si possible, sinon en poste un nouveau.
  if (news.discordMessageId) {
    const existing = await channel.messages.fetch(news.discordMessageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed], components });
      return;
    }
  }
  const sent = await channel.send({ embeds: [embed], components });
  await prisma.news.update({
    where: { id: news.id },
    data: { discordChannelId: channelId, discordMessageId: sent.id },
  });
  console.log(`📰 News postée sur Discord : « ${news.title} ».`);
}

/** Supprime le message Discord d'une news (à l'archivage/suppression de l'article). */
export async function removeNews(client: Client, channelId: string | null, messageId: string | null): Promise<void> {
  if (!channelId || !messageId) return;
  const channel = await resolveChannel(client, channelId);
  if (!channel) return;
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});
}
