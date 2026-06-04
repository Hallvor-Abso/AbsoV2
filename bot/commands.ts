import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { prisma } from './prisma';

const ACCENT = 0x4a9eff;

const SLOT_LABEL = {
  OPEN: '🟢 Ouvert',
  LIMITED: '🟡 Limité',
  CLOSED: '🔴 Fermé',
} as const;

const BOSS_ICON = {
  KILLED: '✅',
  PROGRESSING: '🔶',
  UNTESTED: '⬜',
} as const;

/** Convertit une couleur hex (#RRGGBB) en entier pour les embeds. */
function toColor(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return Number.isNaN(n) ? ACCENT : n;
}

/** Retrouve un jeu actif par slug/nom ; à défaut, renvoie le premier. */
async function resolveGame(query?: string | null) {
  const games = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
  if (games.length === 0) return { games, game: null };
  if (!query) return { games, game: games[0] };
  const q = query.toLowerCase().trim();
  const game =
    games.find((g) => g.slug.toLowerCase() === q) ||
    games.find((g) => g.name.toLowerCase().includes(q)) ||
    null;
  return { games, game };
}

// --- Définitions des commandes (pour l'enregistrement Discord) ---------------
export const commands = [
  new SlashCommandBuilder()
    .setName('recrutement')
    .setDescription('Affiche les postes de recrutement et leur statut.')
    .addStringOption((o) =>
      o.setName('jeu').setDescription('Jeu concerné (ex : wow)').setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName('progression')
    .setDescription("Affiche l'avancement du raid en cours.")
    .addStringOption((o) =>
      o.setName('jeu').setDescription('Jeu concerné (ex : wow)').setRequired(false),
    ),
].map((c) => c.toJSON());

// --- Aiguillage --------------------------------------------------------------
export async function handleInteraction(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case 'recrutement':
      return recrutement(interaction);
    case 'progression':
      return progression(interaction);
    default:
      return;
  }
}

async function recrutement(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const { games, game } = await resolveGame(interaction.options.getString('jeu'));

  if (!game) {
    await interaction.editReply(
      games.length === 0 ? 'Aucun jeu configuré pour le moment.' : 'Jeu introuvable, réessaie avec un autre nom.',
    );
    return;
  }

  const slots = await prisma.recruitmentSlot.findMany({
    where: { gameId: game.id },
    orderBy: [{ order: 'asc' }],
  });

  const embed = new EmbedBuilder().setColor(toColor(game.color)).setTitle(`Recrutement — ${game.name}`);

  if (slots.length === 0) {
    embed.setDescription('Aucun poste publié pour le moment.');
  } else {
    const byRole = new Map<string, string[]>();
    for (const s of slots) {
      const line = `${SLOT_LABEL[s.status]} — ${s.className}${s.note ? ` *(${s.note})*` : ''}`;
      byRole.set(s.role, [...(byRole.get(s.role) ?? []), line]);
    }
    for (const [role, lines] of byRole) {
      embed.addFields({ name: role, value: lines.join('\n') });
    }
    embed.setFooter({ text: 'Intéressé ? Postule sur le site de la guilde.' });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function progression(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const { games, game } = await resolveGame(interaction.options.getString('jeu'));

  if (!game) {
    await interaction.editReply(
      games.length === 0 ? 'Aucun jeu configuré pour le moment.' : 'Jeu introuvable, réessaie avec un autre nom.',
    );
    return;
  }

  const tier = await prisma.raidTier.findFirst({
    where: { gameId: game.id },
    orderBy: { order: 'asc' },
    include: { bosses: { orderBy: { order: 'asc' } } },
  });

  if (!tier) {
    await interaction.editReply(`Aucun tier de raid pour ${game.name}.`);
    return;
  }

  const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;
  const total = tier.bosses.length;
  const body = tier.bosses.map((b) => `${BOSS_ICON[b.status]} ${b.name}`).join('\n') || '—';

  const embed = new EmbedBuilder()
    .setColor(toColor(game.color))
    .setTitle(`${tier.name} — ${game.name}`)
    .setDescription(body)
    .setFooter({ text: `${killed}/${total} boss vaincus` });

  await interaction.editReply({ embeds: [embed] });
}

// Réexporté pour un éventuel usage (réponses éphémères d'erreur).
export const EPHEMERAL = MessageFlags.Ephemeral;
