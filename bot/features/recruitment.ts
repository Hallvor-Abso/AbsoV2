import {
  ChannelType,
  EmbedBuilder,
  type CategoryChannel,
  type Client,
  type Guild,
  type GuildTextBasedChannel,
} from 'discord.js';
import { prisma } from '../prisma';
import { resolveRoleMentions, applicationRoleNames } from './roles';

const ACCENT = 0x4a9eff;

function toColor(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

/** Tronque proprement un champ d'embed (limite Discord : 1024 caractères). */
function clamp(value: string, max = 1024): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

type StoredAnswer = { label: string; value: string };

/**
 * Construit les champs de l'embed à partir des réponses au formulaire
 * personnalisé (`answers`). Repli sur les anciennes colonnes fixes pour les
 * candidatures antérieures au constructeur de formulaire.
 */
function applicationAnswerFields(application: {
  answers: unknown;
  characterId: string | null;
  className: string | null;
  role: string | null;
  server: string | null;
  availability: string | null;
  experience: string | null;
  motivation: string | null;
  logsUrl: string | null;
}): { name: string; value: string }[] {
  const answers = Array.isArray(application.answers)
    ? (application.answers as StoredAnswer[])
    : [];
  if (answers.length > 0) {
    return answers
      .filter((a) => a && a.label && a.value)
      .map((a) => ({ name: clamp(a.label, 256), value: clamp(String(a.value)) }));
  }
  // Repli : anciennes candidatures (colonnes historiques).
  const legacy: { name: string; value: string }[] = [];
  const push = (name: string, value: string | null) => {
    if (value) legacy.push({ name, value: clamp(value) });
  };
  if (application.className || application.role) {
    legacy.push({ name: 'Classe / Rôle', value: clamp(`${application.className ?? ''} · ${application.role ?? ''}`, 256) });
  }
  push('Serveur', application.server);
  push('BattleTag / ID', application.characterId);
  push('Disponibilités', application.availability);
  push('Expérience', application.experience);
  push('Motivation', application.motivation);
  push('Logs / Armory', application.logsUrl);
  return legacy;
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
    include: { game: true, user: { select: { discordId: true } } },
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
      ...applicationAnswerFields(application),
    )
    .setFooter({ text: game.name })
    .setTimestamp(application.createdAt);

  // Ping : GM + Officier <TAG> du jeu visé, plus le candidat lui-même.
  const { content: roleContent, roleIds } = await resolveRoleMentions(
    target.guild,
    applicationRoleNames(game),
  );
  const candidateId = application.user?.discordId ?? null;
  const candidateMention = candidateId ? `<@${candidateId}>` : '';
  const content = [roleContent, candidateMention].filter(Boolean).join(' ');

  await target.send({
    content: content || undefined,
    embeds: [embed],
    allowedMentions: { roles: roleIds, users: candidateId ? [candidateId] : [] },
  });
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
