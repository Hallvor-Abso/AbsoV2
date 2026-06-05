import {
  ChannelType,
  EmbedBuilder,
  type CategoryChannel,
  type Client,
  type Guild,
  type GuildTextBasedChannel,
} from 'discord.js';
import { prisma } from '../prisma';

const ACCENT = 0x4a9eff;

function toColor(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

/** Tronque proprement un champ d'embed (limite Discord : 1024 caractères). */
function clamp(value: string, max = 1024): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Construit un nom de salon Discord valide : « candid-pseudo » (minuscules, sans accents). */
function candidateChannelName(pseudo: string): string {
  const slug = pseudo
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return `candid-${slug || 'candidat'}`;
}

/** Récupère (ou crée) le salon « candid-pseudo » dans la catégorie donnée. */
async function getOrCreateCandidateChannel(
  client: Client,
  categoryId: string,
  pseudo: string,
): Promise<GuildTextBasedChannel> {
  const category = await client.channels.fetch(categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error('Catégorie de candidatures introuvable (ID invalide ?).');
  }
  const cat = category as CategoryChannel;
  const guild: Guild = cat.guild;
  const name = candidateChannelName(pseudo);

  // Réutilise un salon existant de même nom dans la catégorie (re-candidature).
  await guild.channels.fetch();
  const existing = guild.channels.cache.find(
    (c) => c?.parentId === cat.id && c.type === ChannelType.GuildText && c.name === name,
  );
  if (existing) return existing as GuildTextBasedChannel;

  // Sinon, on le crée sous la catégorie (il hérite des permissions de la catégorie).
  return guild.channels.create({ name, type: ChannelType.GuildText, parent: cat.id });
}

/** Publie une nouvelle candidature : salon dédié « candid-pseudo », ou salon unique. */
export async function postApplication(client: Client, applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { game: true },
  });
  if (!application || !application.game) return;
  const { game } = application;

  // Choix de la destination : catégorie (salon dédié) en priorité, sinon salon unique.
  let target: GuildTextBasedChannel;
  let dedicated = false;
  if (game.discordRecruitmentCategoryId) {
    target = await getOrCreateCandidateChannel(client, game.discordRecruitmentCategoryId, application.pseudo);
    dedicated = true;
  } else if (game.discordRecruitmentChannelId) {
    const channel = await client.channels.fetch(game.discordRecruitmentChannelId);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      throw new Error('Salon de candidatures introuvable ou non textuel.');
    }
    target = channel as GuildTextBasedChannel;
  } else {
    return; // rien de configuré pour ce jeu → on ne publie pas.
  }

  // On ne mémorise le salon que s'il est DÉDIÉ (créé par le bot) : c'est lui qui
  // recevra les messages de statut et qui sera supprimé avec la candidature.
  if (dedicated) {
    await prisma.application.update({
      where: { id: application.id },
      data: { discordChannelId: target.id },
    });
  }

  const embed = new EmbedBuilder()
    .setColor(toColor(game.color))
    .setTitle(`📥 Candidature — ${application.pseudo}`)
    .addFields(
      ...(application.discord ? [{ name: 'Discord', value: clamp(application.discord, 256), inline: true }] : []),
      { name: 'Classe / Rôle', value: clamp(`${application.className} · ${application.role}`, 256), inline: true },
      { name: 'Serveur', value: clamp(application.server, 256), inline: true },
      ...(application.characterId ? [{ name: 'BattleTag / ID', value: clamp(application.characterId, 256), inline: true }] : []),
      { name: 'Disponibilités', value: clamp(application.availability) },
      { name: 'Expérience', value: clamp(application.experience) },
      { name: 'Motivation', value: clamp(application.motivation) },
      ...(application.logsUrl ? [{ name: 'Logs / Armory', value: clamp(application.logsUrl, 512) }] : []),
    )
    .setFooter({ text: game.name })
    .setTimestamp(application.createdAt);

  await target.send({ embeds: [embed] });
}

const STATUS_MESSAGE: Record<string, string> = {
  PENDING: '🕓 Candidature remise en attente.',
  DISCUSSING: '💬 Candidature passée **en discussion**.',
  ACCEPTED: '✅ Candidature **acceptée** — bienvenue ! 🎉',
  REJECTED: '🔴 Candidature **refusée**.',
};

/** Poste un message de statut dans le salon dédié de la candidature. */
export async function postApplicationStatus(client: Client, applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { discordChannelId: true, status: true, pseudo: true },
  });
  if (!application?.discordChannelId) return; // pas de salon dédié → rien à faire.

  const channel = await client.channels.fetch(application.discordChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) return;

  const text = STATUS_MESSAGE[application.status] ?? `Statut mis à jour : ${application.status}`;
  await (channel as GuildTextBasedChannel).send(text);
}

/** Supprime le salon dédié d'une candidature (suppression côté site). */
export async function deleteApplicationChannel(client: Client, channelId: string | null): Promise<void> {
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.isDMBased()) return;
  if ('delete' in channel && typeof channel.delete === 'function') {
    await channel.delete('Candidature supprimée depuis le site');
  }
}
