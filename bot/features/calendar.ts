import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  type ButtonInteraction,
  type Client,
  type GuildTextBasedChannel,
} from 'discord.js';
import { SignupStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { env } from '../env';
import { resolveRoleMentions, calendarRoleNames } from './roles';

const ACCENT = 0x4a9eff;

const STATUS_LABEL: Record<SignupStatus, string> = {
  GOING: 'Présent ✅',
  MAYBE: 'Peut-être ❓',
  DECLINED: 'Absent ❌',
};

function toColor(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(d);
}

/** Construit l'embed + les boutons RSVP d'un événement. */
async function buildEventMessage(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { game: true, signups: { orderBy: { createdAt: 'asc' } } },
  });
  if (!event) return null;

  const groups: Record<SignupStatus, string[]> = { GOING: [], MAYBE: [], DECLINED: [] };
  for (const s of event.signups) groups[s.status].push(s.displayName);

  const when = event.endDate
    ? `${formatDate(event.startDate)} → ${formatDate(event.endDate)}`
    : formatDate(event.startDate);

  const embed = new EmbedBuilder()
    .setColor(toColor(event.game.color))
    .setTitle(`📅 ${event.title}`)
    .setDescription(event.description || null)
    .addFields(
      { name: 'Quand', value: when },
      { name: `✅ Présents (${groups.GOING.length})`, value: groups.GOING.join('\n') || '—', inline: true },
      { name: `❓ Peut-être (${groups.MAYBE.length})`, value: groups.MAYBE.join('\n') || '—', inline: true },
      { name: `❌ Absents (${groups.DECLINED.length})`, value: groups.DECLINED.join('\n') || '—', inline: true },
    )
    .setFooter({ text: event.game.name });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:GOING`).setLabel('Présent').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:MAYBE`).setLabel('Peut-être').setEmoji('❓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:DECLINED`).setLabel('Absent').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  return { embed, row, event };
}

/** Publie (ou met à jour) le message d'un événement dans le salon calendrier. */
export async function syncEvent(client: Client, eventId: string): Promise<void> {
  const built = await buildEventMessage(eventId);
  if (!built) return;
  const { embed, row, event } = built;

  // Priorité : salon déjà utilisé pour cet event > salon configuré pour le jeu >
  // salon global de secours (env).
  const channelId =
    event.discordChannelId || event.game.discordCalendarChannelId || env.DISCORD_CALENDAR_CHANNEL_ID;
  if (!channelId) {
    throw new Error(`Aucun salon calendrier configuré pour le jeu « ${event.game.name} ».`);
  }

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Salon calendrier introuvable ou non textuel.');
  }
  const textChannel = channel as GuildTextBasedChannel;

  // Mise à jour du message existant si possible.
  if (event.discordMessageId) {
    try {
      const msg = await textChannel.messages.fetch(event.discordMessageId);
      await msg.edit({ embeds: [embed], components: [row] });
      return;
    } catch {
      // message supprimé manuellement → on en recrée un.
    }
  }

  // Première publication → on pingue les rôles du jeu (GM + Officier/Roster/
  // Membre/Recrue <TAG>). Les mises à jour suivantes (edit) ne re-pinguent pas.
  const { content, roleIds } = await resolveRoleMentions(textChannel.guild, calendarRoleNames(event.game));

  const sent = await textChannel.send({
    content: content || undefined,
    embeds: [embed],
    components: [row],
    allowedMentions: { roles: roleIds },
  });
  await prisma.event.update({
    where: { id: event.id },
    data: { discordChannelId: textChannel.id, discordMessageId: sent.id },
  });
}

/** Clic sur un bouton RSVP : enregistre/maj l'inscription puis rafraîchit le message. */
export async function handleRsvp(interaction: ButtonInteraction): Promise<void> {
  const [, eventId, rawStatus] = interaction.customId.split(':');
  const status = rawStatus as SignupStatus;
  const displayName = interaction.user.globalName ?? interaction.user.username;

  // Réponse éphémère (visible par toi seul) qui confirme — ou explique l'échec.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await prisma.eventSignup.upsert({
      where: { eventId_discordId: { eventId, discordId: interaction.user.id } },
      create: { eventId, discordId: interaction.user.id, displayName, status, source: 'discord' },
      update: { status, displayName },
    });
    await syncEvent(interaction.client, eventId);
    await interaction.editReply(`Réponse enregistrée : **${STATUS_LABEL[status]}**`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('handleRsvp a échoué :', err);
    await interaction.editReply(`Impossible d'enregistrer ta réponse : ${msg}`).catch(() => {});
  }
}

/** Supprime le message Discord d'un événement (appelé quand on supprime l'event). */
export async function removeEventMessage(
  client: Client,
  channelId: string | null,
  messageId: string | null,
): Promise<void> {
  if (!channelId || !messageId) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) return;
    const msg = await (channel as GuildTextBasedChannel).messages.fetch(messageId);
    await msg.delete();
  } catch {
    // déjà supprimé / introuvable → rien à faire.
  }
}
