import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type Client,
  type Guild,
  type GuildTextBasedChannel,
  type RepliableInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { SignupStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { env } from '../env';
import { resolveRoleMentions, calendarRoleNames } from './roles';
import {
  CLASSES,
  ROLE_EMOJI,
  ROLE_LABEL,
  ROLE_ORDER,
  specEmojiName,
  classEmojiName,
  findClass,
  findSpec,
  findSpecByLabel,
  gameKey,
  type GameKey,
  type SpecRole,
} from './classes';

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

/** Supprime la réponse éphémère après un délai (par défaut 10 s) pour désencombrer. */
function autoDelete(interaction: RepliableInteraction, ms = 10_000): void {
  setTimeout(() => {
    interaction.deleteReply().catch(() => {});
  }, ms);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(d);
}

type SignupRow = {
  displayName: string;
  status: SignupStatus;
  role: string | null;
  classId: string | null;
  spec: string | null;
};

/** Emoji d'une spé : icône personnalisée du serveur si dispo, sinon emoji de rôle. */
function specEmoji(
  guild: Guild | null,
  key: GameKey,
  classId: string | null,
  specLabel: string | null,
  role: string | null,
): string {
  if (guild && classId) {
    // 1) icône de spé si disponible
    if (specLabel) {
      const spec = findSpecByLabel(key, classId, specLabel);
      if (spec) {
        const found = guild.emojis.cache.find((e) => e.name === specEmojiName(key, classId, spec.id));
        if (found) return found.toString();
      }
    }
    // 2) repli : icône de classe
    const byClass = guild.emojis.cache.find((e) => e.name === classEmojiName(key, classId));
    if (byClass) return byClass.toString();
  }
  // 3) repli final : emoji de rôle
  return ROLE_EMOJI[(role as SpecRole) ?? 'DPS'] ?? '•';
}

/** Bloc « Présents » groupé par rôle (Tank/Heal/DPS) avec icône de classe + spé. */
function renderGoing(going: SignupRow[], guild: Guild | null, key: GameKey | null): string {
  if (going.length === 0) return '—';
  const lines: string[] = [];
  const withRole = key ? going.filter((s) => s.role) : [];
  const without = key ? going.filter((s) => !s.role) : going;

  if (key) {
    for (const role of ROLE_ORDER) {
      const members = withRole.filter((s) => s.role === role);
      if (members.length === 0) continue;
      lines.push(`**${ROLE_EMOJI[role]} ${ROLE_LABEL[role]} (${members.length})**`);
      for (const m of members) {
        const emoji = specEmoji(guild, key, m.classId, m.spec, m.role);
        lines.push(`${emoji} ${m.displayName}${m.spec ? ` · ${m.spec}` : ''}`);
      }
    }
  }
  for (const m of without) lines.push(`• ${m.displayName}`);
  return lines.join('\n') || '—';
}

/** Construit l'embed + les boutons RSVP d'un événement. */
async function buildEventMessage(eventId: string, guild: Guild | null) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { game: true, signups: { orderBy: { createdAt: 'asc' } } },
  });
  if (!event) return null;

  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);
  const rows: SignupRow[] = event.signups.map((s) => ({
    displayName: s.displayName,
    status: s.status,
    role: s.role,
    classId: s.classId,
    spec: s.spec,
  }));
  const going = rows.filter((s) => s.status === 'GOING');
  const maybe = rows.filter((s) => s.status === 'MAYBE');
  const declined = rows.filter((s) => s.status === 'DECLINED');

  const when = event.endDate
    ? `${formatDate(event.startDate)} → ${formatDate(event.endDate)}`
    : formatDate(event.startDate);

  const embed = new EmbedBuilder()
    .setColor(toColor(event.game.color))
    .setTitle(`📅 ${event.title}`)
    .setDescription(event.description || null)
    .addFields({ name: 'Quand', value: when });

  // Jeu à classes : colonnes Tank | DPS, puis Heal sous le Tank.
  if (key && going.length > 0) {
    const lines = (role: string) =>
      going
        .filter((s) => s.role === role)
        .map((m) => `${specEmoji(guild, key, m.classId, m.spec, m.role)} ${m.displayName}${m.spec ? ` · ${m.spec}` : ''}`)
        .join('\n') || '—';
    const cnt = (role: string) => going.filter((s) => s.role === role).length;
    const without = going.filter((s) => !s.role);
    const blank = () => ({ name: '\u200b', value: '\u200b', inline: true });

    embed.addFields(
      {
        name: `✅ Présents (${going.length})`,
        value: without.length ? without.map((m) => `• ${m.displayName}`).join('\n') : '\u200b',
      },
      { name: `${ROLE_EMOJI.TANK} ${ROLE_LABEL.TANK} (${cnt('TANK')})`, value: lines('TANK'), inline: true },
      { name: `${ROLE_EMOJI.DPS} ${ROLE_LABEL.DPS} (${cnt('DPS')})`, value: lines('DPS'), inline: true },
      blank(),
      { name: `${ROLE_EMOJI.HEAL} ${ROLE_LABEL.HEAL} (${cnt('HEAL')})`, value: lines('HEAL'), inline: true },
      blank(),
      blank(),
    );
  } else {
    embed.addFields({ name: `✅ Présents (${going.length})`, value: renderGoing(going, guild, key) });
  }

  embed
    .addFields(
      { name: `❓ Peut-être (${maybe.length})`, value: maybe.map((s) => s.displayName).join('\n') || '—', inline: true },
      { name: `❌ Absents (${declined.length})`, value: declined.map((s) => s.displayName).join('\n') || '—', inline: true },
    )
    .setFooter({ text: event.game.name });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:GOING`).setLabel('Présent').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:MAYBE`).setLabel('Peut-être').setEmoji('❓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`rsvp:${event.id}:DECLINED`).setLabel('Absent').setEmoji('❌').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`respec:${event.id}`).setLabel('Changer de spé').setEmoji('🔁').setStyle(ButtonStyle.Primary),
  );

  return { embed, row, event };
}

/** Publie (ou met à jour) le message d'un événement dans le salon calendrier. */
export async function syncEvent(client: Client, eventId: string): Promise<void> {
  // On résout d'abord le salon (pour récupérer la guilde et ses emojis).
  const base = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!base) return;

  // Publication différée : tant que l'heure d'annonce n'est pas atteinte et
  // qu'aucun message n'existe encore, on ne publie pas (ex. une occurrence de
  // série pas encore « drippée », même si quelqu'un s'inscrit côté site). La
  // boucle planifiée du bot la publiera le moment venu.
  if (!base.discordMessageId && base.announceAt && base.announceAt.getTime() > Date.now()) return;

  // Ne pas (re)créer de message pour un raid déjà commencé : son annonce a pu
  // être nettoyée automatiquement 30 min après le début (cf. sweepStartedEventMessages).
  // On laisse l'édition d'un message existant passer (discordMessageId présent).
  if (!base.discordMessageId && base.startDate.getTime() <= Date.now()) return;

  const channelId =
    base.discordChannelId || base.game.discordCalendarChannelId || env.DISCORD_CALENDAR_CHANNEL_ID;
  if (!channelId) {
    throw new Error(`Aucun salon calendrier configuré pour le jeu « ${base.game.name} ».`);
  }
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Salon calendrier introuvable ou non textuel.');
  }
  const textChannel = channel as GuildTextBasedChannel;
  await textChannel.guild.emojis.fetch().catch(() => {});

  const built = await buildEventMessage(eventId, textChannel.guild);
  if (!built) return;
  const { embed, row, event } = built;

  if (event.discordMessageId) {
    try {
      const msg = await textChannel.messages.fetch(event.discordMessageId);
      await msg.edit({ embeds: [embed], components: [row] });
      return;
    } catch {
      // message supprimé manuellement → on en recrée un.
    }
  }

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

/** Enregistre une inscription en réutilisant le main du membre s'il existe. */
async function registerWithMain(
  eventId: string,
  gameId: string,
  discordId: string,
  displayName: string,
  status: SignupStatus,
) {
  const main = await prisma.memberMain.findUnique({
    where: { discordId_gameId: { discordId, gameId } },
  });
  await prisma.eventSignup.upsert({
    where: { eventId_discordId: { eventId, discordId } },
    create: {
      eventId, discordId, displayName, status, source: 'discord',
      role: main?.role ?? null, classId: main?.classId ?? null,
      className: main?.className ?? null, spec: main?.spec ?? null,
    },
    update: {
      status, displayName,
      role: main?.role ?? null, classId: main?.classId ?? null,
      className: main?.className ?? null, spec: main?.spec ?? null,
    },
  });
  return main;
}

/** Menu de sélection de classe pour un jeu (1ʳᵉ étape). */
function classSelect(eventId: string, status: string, key: GameKey) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`clsel:${eventId}:${status}`)
      .setPlaceholder('Choisis ta classe')
      .addOptions(CLASSES[key].map((c) => ({ label: c.label, value: c.id }))),
  );
}

/** Menu de sélection de spé pour une classe (2ᵉ étape, WoW). */
function specSelect(eventId: string, status: string, key: GameKey, classId: string) {
  const cls = findClass(key, classId);
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`spsel:${eventId}:${status}:${classId}`)
      .setPlaceholder('Choisis ta spécialisation')
      .addOptions((cls?.specs ?? []).map((s) => ({ label: `${s.label} (${ROLE_LABEL[s.role]})`, value: s.id }))),
  );
}

/** Menu de sélection de rôle pour une classe (2ᵉ étape, SWTOR). */
function roleSelect(eventId: string, status: string, classId: string) {
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`rolsel:${eventId}:${status}:${classId}`)
      .setPlaceholder('Choisis ton rôle')
      .addOptions(ROLE_ORDER.map((r) => ({ label: `${ROLE_EMOJI[r]} ${ROLE_LABEL[r]}`, value: r }))),
  );
}

/** WoW demande la spé ; les autres jeux (SWTOR) demandent juste le rôle. */
function usesSpec(key: GameKey): boolean {
  return key === 'wow';
}

/** Clic sur un bouton RSVP (Présent / Peut-être / Absent). */
export async function handleRsvp(interaction: ButtonInteraction): Promise<void> {
  const [, eventId, rawStatus] = interaction.customId.split(':');
  const status = rawStatus as SignupStatus;
  const displayName = interaction.user.globalName ?? interaction.user.username;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!event) {
    await interaction.editReply('Événement introuvable.');
    return;
  }
  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);

  try {
    // « Absent » ne nécessite pas de spé. « Présent/Peut-être » : on demande la
    // spé seulement si le membre n'a pas encore de main pour ce jeu.
    if (status !== 'DECLINED' && key) {
      const main = await prisma.memberMain.findUnique({
        where: { discordId_gameId: { discordId: interaction.user.id, gameId: event.gameId! } },
      });
      if (!main) {
        await interaction.editReply({
          content: 'Choisis ta **classe** puis ta **spécialisation** (mémorisé pour les prochaines fois) :',
          components: [classSelect(eventId, status, key)],
        });
        return;
      }
    }

    await registerWithMain(eventId, event.gameId!, interaction.user.id, displayName, status);
    await syncEvent(interaction.client, eventId);
    await interaction.editReply(`Réponse enregistrée : **${STATUS_LABEL[status]}**`);
    autoDelete(interaction);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('handleRsvp a échoué :', err);
    await interaction.editReply(`Impossible d'enregistrer ta réponse : ${msg}`).catch(() => {});
    autoDelete(interaction);
  }
}

/** Clic sur « Changer de spé » : ouvre la sélection de classe. */
export async function handleRespec(interaction: ButtonInteraction): Promise<void> {
  const [, eventId] = interaction.customId.split(':');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!event) {
    await interaction.editReply('Événement introuvable.');
    return;
  }
  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);
  if (!key) {
    await interaction.editReply('La sélection de classe n’est pas disponible pour ce jeu.');
    return;
  }
  await interaction.editReply({
    content: 'Choisis ta nouvelle **classe** puis ta **spécialisation** :',
    components: [classSelect(eventId, 'RESPEC', key)],
  });
}

/** Étape 1 : une classe a été choisie → on propose les spés. */
export async function handleClassSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const [, eventId, status] = interaction.customId.split(':');
  const classId = interaction.values[0];
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  const key = event ? gameKey(event.game.slug) ?? gameKey(event.game.name) : null;
  if (!event || !key) {
    await interaction.update({ content: 'Jeu non reconnu.', components: [] });
    return;
  }
  await interaction.update(
    usesSpec(key)
      ? { content: 'Et ta **spécialisation** :', components: [specSelect(eventId, status, key, classId)] }
      : { content: 'Et ton **rôle** :', components: [roleSelect(eventId, status, classId)] },
  );
}

/** Étape 2 (SWTOR) : un rôle a été choisi → on enregistre le main (+ l'inscription). */
export async function handleRoleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const [, eventId, status, classId] = interaction.customId.split(':');
  const role = interaction.values[0] as SpecRole;
  await interaction.deferUpdate();

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  const key = event ? gameKey(event.game.slug) ?? gameKey(event.game.name) : null;
  if (!event || !key) {
    await interaction.editReply({ content: 'Jeu non reconnu.', components: [] });
    return;
  }
  const cls = findClass(key, classId);
  if (!cls || !ROLE_ORDER.includes(role)) {
    await interaction.editReply({ content: 'Choix invalide.', components: [] });
    return;
  }

  const discordId = interaction.user.id;
  const displayName = interaction.user.globalName ?? interaction.user.username;

  await prisma.memberMain.upsert({
    where: { discordId_gameId: { discordId, gameId: event.gameId! } },
    create: { discordId, gameId: event.gameId!, role, classId: cls.id, className: cls.label, specId: '', spec: '' },
    update: { role, classId: cls.id, className: cls.label, specId: '', spec: '' },
  });

  if (status === 'RESPEC') {
    await prisma.eventSignup.updateMany({
      where: { eventId, discordId },
      data: { role, classId: cls.id, className: cls.label, spec: '' },
    });
  } else {
    await prisma.eventSignup.upsert({
      where: { eventId_discordId: { eventId, discordId } },
      create: {
        eventId, discordId, displayName, status: status as SignupStatus, source: 'discord',
        role, classId: cls.id, className: cls.label, spec: '',
      },
      update: { status: status as SignupStatus, displayName, role, classId: cls.id, className: cls.label, spec: '' },
    });
  }

  await syncEvent(interaction.client, eventId);
  await interaction.editReply({
    content: `✅ Enregistré : **${cls.label}** (${ROLE_LABEL[role]}).`,
    components: [],
  });
  autoDelete(interaction);
}

/** Étape 2 : une spé a été choisie → on enregistre le main (+ l'inscription). */
export async function handleSpecSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const [, eventId, status, classId] = interaction.customId.split(':');
  const specId = interaction.values[0];
  await interaction.deferUpdate();

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  const key = event ? gameKey(event.game.slug) ?? gameKey(event.game.name) : null;
  if (!event || !key) {
    await interaction.editReply({ content: 'Jeu non reconnu.', components: [] });
    return;
  }
  const cls = findClass(key, classId);
  const spec = findSpec(key, classId, specId);
  if (!cls || !spec) {
    await interaction.editReply({ content: 'Spécialisation invalide.', components: [] });
    return;
  }

  const discordId = interaction.user.id;
  const displayName = interaction.user.globalName ?? interaction.user.username;

  // Mémorise le main du membre pour ce jeu.
  await prisma.memberMain.upsert({
    where: { discordId_gameId: { discordId, gameId: event.gameId! } },
    create: {
      discordId, gameId: event.gameId!, role: spec.role,
      classId: cls.id, className: cls.label, specId: spec.id, spec: spec.label,
    },
    update: { role: spec.role, classId: cls.id, className: cls.label, specId: spec.id, spec: spec.label },
  });

  // RESPEC : on met à jour l'inscription existante (si présente) sans changer le
  // statut. Sinon, on enregistre l'inscription avec le statut demandé.
  if (status === 'RESPEC') {
    await prisma.eventSignup.updateMany({
      where: { eventId, discordId },
      data: { role: spec.role, classId: cls.id, className: cls.label, spec: spec.label },
    });
  } else {
    await prisma.eventSignup.upsert({
      where: { eventId_discordId: { eventId, discordId } },
      create: {
        eventId, discordId, displayName, status: status as SignupStatus, source: 'discord',
        role: spec.role, classId: cls.id, className: cls.label, spec: spec.label,
      },
      update: {
        status: status as SignupStatus, displayName,
        role: spec.role, classId: cls.id, className: cls.label, spec: spec.label,
      },
    });
  }

  await syncEvent(interaction.client, eventId);
  await interaction.editReply({
    content: `✅ Enregistré : **${cls.label} — ${spec.label}** (${ROLE_LABEL[spec.role]}).`,
    components: [],
  });
  autoDelete(interaction);
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

/** Délai après le début d'un raid avant de nettoyer son annonce Discord. */
const EVENT_CLEANUP_DELAY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Supprime le message Discord des events commencés depuis plus de 30 min, pour
 * désencombrer le salon calendrier. L'événement reste en base (les stats de
 * Présence et l'historique sont conservés) ; on vide juste ses identifiants de
 * message pour que le bot ne le republie pas. Appelée périodiquement.
 */
export async function sweepStartedEventMessages(client: Client): Promise<void> {
  const cutoff = new Date(Date.now() - EVENT_CLEANUP_DELAY_MS);
  const due = await prisma.event.findMany({
    where: { discordMessageId: { not: null }, startDate: { lte: cutoff } },
    select: { id: true, title: true, discordChannelId: true, discordMessageId: true },
  });
  for (const e of due) {
    try {
      await removeEventMessage(client, e.discordChannelId, e.discordMessageId);
      await prisma.event.update({
        where: { id: e.id },
        data: { discordChannelId: null, discordMessageId: null },
      });
      console.log(`🧹 Annonce nettoyée (raid commencé depuis 30 min) : « ${e.title} ».`);
    } catch (err) {
      console.error(`Nettoyage de l'annonce « ${e.title} » :`, err);
    }
  }
}

/**
 * Publie les occurrences de série dont l'heure d'annonce est arrivée et qui
 * n'ont pas encore de message Discord (et dont le raid n'est pas déjà passé).
 * Appelée périodiquement par la boucle du bot.
 */
export async function publishScheduledEvents(client: Client): Promise<void> {
  const now = new Date();
  const due = await prisma.event.findMany({
    where: {
      announceAt: { not: null, lte: now },
      discordMessageId: null,
      startDate: { gt: now },
    },
    select: { id: true, title: true },
    orderBy: { startDate: 'asc' },
  });
  for (const e of due) {
    try {
      await syncEvent(client, e.id);
      console.log(`📣 Annonce planifiée publiée : « ${e.title} ».`);
    } catch (err) {
      console.error(`Publication planifiée « ${e.title} » :`, err);
    }
  }
}
