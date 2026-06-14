import type { Client, GuildTextBasedChannel } from 'discord.js';
import { prisma } from '../prisma';
import { env } from '../env';

/**
 * « Groupe validé » : quand le GM valide le groupe sur le site, on poste un
 * message qui ping les joueurs retenus (présents sur le Discord). Ce message
 * est supprimé automatiquement 30 min après le début de l'événement.
 */

const ROSTER_TTL_MS = 30 * 60 * 1000;

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(d);
}

async function resolveChannel(client: Client, channelId: string | null): Promise<GuildTextBasedChannel | null> {
  if (!channelId) return null;
  const ch = await client.channels.fetch(channelId).catch(() => null);
  if (ch && ch.isTextBased() && !ch.isDMBased()) return ch as GuildTextBasedChannel;
  return null;
}

async function deleteRosterMessage(client: Client, channelId: string | null, messageId: string | null): Promise<void> {
  const channel = await resolveChannel(client, channelId);
  if (!channel || !messageId) return;
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (msg) await msg.delete().catch(() => {});
}

/** Poste (ou re-poste) le message du groupe validé pour un événement. */
export async function postRaidRoster(client: Client, eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      game: true,
      signups: { where: { status: 'GOING', selected: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!event) return;

  // Supprime l'ancien message de groupe s'il y en a un (re-validation).
  await deleteRosterMessage(client, event.rosterChannelId, event.rosterMessageId);
  await prisma.event.update({ where: { id: event.id }, data: { rosterChannelId: null, rosterMessageId: null } });

  if (event.signups.length === 0) return; // groupe vidé → on retire juste l'ancien message

  const channel = await resolveChannel(client, event.discordChannelId || env.DISCORD_CALENDAR_CHANNEL_ID);
  if (!channel) {
    console.error('Roster : salon introuvable.');
    return;
  }

  // On ping uniquement les membres présents sur le serveur ; sinon, pseudo brut.
  const parts: string[] = [];
  const mentionIds: string[] = [];
  for (const s of event.signups) {
    const member = await channel.guild.members.fetch(s.discordId).catch(() => null);
    if (member) {
      parts.push(`<@${s.discordId}>`);
      mentionIds.push(s.discordId);
    } else {
      parts.push(`**${s.displayName}**`);
    }
  }

  const note = event.rosterMessage?.trim();
  const content =
    `🛡️ **Groupe validé — ${event.title}**\n` +
    `🗓️ ${fmt(event.startDate)}\n\n` +
    (note ? `📌 ${note}\n\n` : '') +
    `${parts.join(' · ')}\n\n` +
    `Soyez prêts et à l'heure ! ✅`;

  const sent = await channel.send({ content, allowedMentions: { users: mentionIds } });
  await prisma.event.update({
    where: { id: event.id },
    data: { rosterChannelId: channel.id, rosterMessageId: sent.id },
  });
  console.log(`🛡️ Groupe validé posté pour « ${event.title} » (${event.signups.length} joueur·s).`);

  // MP « tu es pris » : envoi immédiat si l'heure planifiée est déjà passée
  // (groupe validé après 20h). Sinon, la boucle l'enverra à 20h.
  if (event.rosterDmAt && event.rosterDmAt.getTime() <= Date.now() && !event.rosterDmSentAt) {
    await sendRosterSelectionDms(client, event.id);
  }
}

/** Envoie un MP à un membre (ignore silencieusement si MP fermés / introuvable). */
async function dmUser(client: Client, discordId: string, content: string): Promise<boolean> {
  try {
    const user = await client.users.fetch(discordId);
    await user.send(content);
    return true;
  } catch {
    return false;
  }
}

/**
 * Envoie le MP « tu es pris pour le raid » aux joueurs RETENUS et marque l'envoi
 * (idempotent : ne renvoie pas si déjà fait, ne marque pas si personne à notifier).
 */
export async function sendRosterSelectionDms(client: Client, eventId: string): Promise<void> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { game: true, signups: { where: { status: 'GOING', selected: true } } },
  });
  if (!event || event.rosterDmSentAt) return;
  if (event.signups.length === 0) return; // rien à notifier → on ne marque pas « envoyé »

  const note = event.rosterMessage?.trim();
  let n = 0;
  for (const s of event.signups) {
    const ok = await dmUser(
      client,
      s.discordId,
      `🎯 **Tu es pris pour le raid — ${event.title}** (${event.game.name})\n` +
        `🗓️ ${fmt(event.startDate)}\n` +
        `Tu fais partie du groupe retenu — prépare-toi et sois à l'heure ! 🛡️` +
        (note ? `\n\n📌 ${note}` : ''),
    );
    if (ok) n += 1;
  }
  await prisma.event.update({ where: { id: event.id }, data: { rosterDmSentAt: new Date() } });
  console.log(`📩 MP « tu es pris » — ${event.title} : ${n}/${event.signups.length} envoyé(s).`);
}

/** Boucle : envoie les MP de sélection dont l'heure planifiée (20h) est arrivée. */
export async function sweepRosterSelectionDms(client: Client): Promise<void> {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { rosterDmAt: { not: null, lte: now }, rosterDmSentAt: null, startDate: { gt: now } },
    select: { id: true },
  });
  for (const e of events) {
    await sendRosterSelectionDms(client, e.id).catch((err) => console.error('MP sélection :', err));
  }
}

/** Supprime les messages de groupe dont l'événement a commencé depuis 30 min. */
export async function sweepRaidRosters(client: Client): Promise<void> {
  const cutoff = new Date(Date.now() - ROSTER_TTL_MS);
  const events = await prisma.event.findMany({
    where: { rosterMessageId: { not: null }, startDate: { lte: cutoff } },
    select: { id: true, rosterChannelId: true, rosterMessageId: true },
  });
  for (const e of events) {
    await deleteRosterMessage(client, e.rosterChannelId, e.rosterMessageId);
    await prisma.event.update({ where: { id: e.id }, data: { rosterChannelId: null, rosterMessageId: null } });
  }
}
