import { EmbedBuilder, type Client, type GuildTextBasedChannel } from 'discord.js';
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

/** Publie une nouvelle candidature dans le salon de candidatures du jeu. */
export async function postApplication(client: Client, applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { game: true },
  });
  if (!application || !application.game) return;
  const { game } = application;

  const channelId = game.discordRecruitmentChannelId;
  if (!channelId) return; // aucun salon configuré pour ce jeu → on ne publie pas.

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error('Salon de candidatures introuvable ou non textuel.');
  }
  const textChannel = channel as GuildTextBasedChannel;

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

  await textChannel.send({ embeds: [embed] });
}
