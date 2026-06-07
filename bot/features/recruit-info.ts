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
 * Embed « Rejoins-nous » dans le salon public #rejoins-nous : explique où
 * postuler, avec un bouton par jeu vers le formulaire de candidature du site.
 * Idempotent : édite son message existant (repéré par son footer).
 */

const ACCENT = 0x4a9eff;
const MARKER = 'Recrutement officiel · Absolution';

export async function postRecruitInfo(guild: Guild): Promise<void> {
  await guild.channels.fetch();
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'rejoins-nous',
  ) as TextChannel | undefined;
  if (!channel) return;

  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
    select: { name: true, slug: true, status: true },
  });

  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle('🛡️ Rejoindre Absolution')
    .setDescription(
      "Envie de nous rejoindre ? Choisis ton jeu ci-dessous : tu seras dirigé vers le " +
        "formulaire de candidature sur notre site. Notre équipe de recrutement te recontacte " +
        'ensuite ici, sur Discord.',
    )
    .setFooter({ text: MARKER });

  if (games.length > 0) {
    embed.addFields({
      name: 'Nos jeux',
      value: games
        .map((g) => `• ${g.name}${g.status === 'UPCOMING' ? ' *(bientôt)*' : ''}`)
        .join('\n'),
    });
  }

  // Boutons (lien vers le site) : un par jeu, max 5 par ligne.
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  if (env.SITE_URL) {
    let row = new ActionRowBuilder<ButtonBuilder>();
    for (const g of games) {
      if (row.components.length === 5) {
        rows.push(row);
        row = new ActionRowBuilder<ButtonBuilder>();
      }
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel(`Postuler — ${g.name}`)
          .setURL(`${env.SITE_URL}/recrutement?jeu=${g.slug}`),
      );
    }
    if (row.components.length > 0) rows.push(row);
  } else {
    embed.addFields({ name: '🌐 Postuler', value: 'Rends-toi sur la page **Recrutement** de notre site.' });
  }

  const payload = { embeds: [embed], components: rows };
  const me = channel.client.user?.id;
  let existing = null;
  try {
    const recent = await channel.messages.fetch({ limit: 20 });
    existing = recent.find((m) => m.author.id === me && m.embeds.some((e) => e.footer?.text === MARKER)) ?? null;
  } catch {
    existing = null;
  }

  if (existing) await existing.edit(payload);
  else await channel.send(payload);
}
