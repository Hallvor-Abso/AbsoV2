import {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { prisma } from './prisma';
import { setupServer } from './features/server-setup';
import { postPresentation } from './features/presentation';
import { CLASS_EMOJI_URLS } from './features/classes';

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
  new SlashCommandBuilder()
    .setName('setup-serveur')
    .setDescription('Construit/complète la structure du serveur (catégories, salons, permissions).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('presentation')
    .setDescription('Publie/actualise l’embed de présentation de la guilde dans #présentation.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName('setup-class-emojis')
    .setDescription('Crée les emojis d’icônes de classe (depuis les URLs configurées).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((c) => c.toJSON());

// --- Aiguillage --------------------------------------------------------------
export async function handleInteraction(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case 'recrutement':
      return recrutement(interaction);
    case 'progression':
      return progression(interaction);
    case 'setup-serveur':
      return setupServeur(interaction);
    case 'presentation':
      return presentation(interaction);
    case 'setup-class-emojis':
      return setupClassEmojis(interaction);
    default:
      return;
  }
}

async function setupClassEmojis(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('Cette commande doit être utilisée sur un serveur.');
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.editReply('Réservé aux administrateurs du serveur.');
    return;
  }

  await guild.emojis.fetch().catch(() => {});
  const created: string[] = [];
  const skipped: string[] = [];
  const missingUrl: string[] = [];
  const failed: string[] = [];

  for (const [name, url] of Object.entries(CLASS_EMOJI_URLS)) {
    if (!url) { missingUrl.push(name); continue; }
    if (guild.emojis.cache.find((e) => e.name === name)) { skipped.push(name); continue; }
    try {
      await guild.emojis.create({ attachment: url, name });
      created.push(name);
    } catch {
      failed.push(name);
    }
  }

  const lines: string[] = [];
  lines.push(created.length ? `✅ Créés (${created.length}) : ${created.join(', ')}` : '✅ Aucun nouvel emoji à créer.');
  if (skipped.length) lines.push(`↩️ Déjà présents (${skipped.length}).`);
  if (failed.length) lines.push(`⚠️ Échecs (${failed.length}) : ${failed.join(', ')} — limite d’emojis atteinte ou URL invalide ?`);
  if (missingUrl.length) lines.push(`ℹ️ URL manquante (${missingUrl.length}) : à renseigner dans le code (CLASS_EMOJI_URLS).`);

  const text = lines.join('\n');
  await interaction.editReply(text.length > 1990 ? `${text.slice(0, 1989)}…` : text);
}

async function presentation(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  if (!interaction.guild) {
    await interaction.editReply('Cette commande doit être utilisée sur un serveur.');
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.editReply('Réservé aux administrateurs du serveur.');
    return;
  }

  const result = await postPresentation(interaction.guild);
  if (!result.ok) {
    await interaction.editReply(`❌ ${result.reason}`);
    return;
  }
  await interaction.editReply(
    result.updated
      ? '✅ Embed de présentation mis à jour dans #présentation.'
      : '✅ Embed de présentation publié dans #présentation.',
  );
}

async function setupServeur(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.guild) {
    await interaction.editReply('Cette commande doit être utilisée sur un serveur.');
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.editReply('Réservé aux administrateurs du serveur.');
    return;
  }

  const { created, warnings } = await setupServer(interaction.guild);

  const lines: string[] = [];
  lines.push(
    created.length === 0
      ? '✅ Structure déjà en place — rien à créer.'
      : `✅ ${created.length} élément(s) créé(s) :\n${created.join('\n')}`,
  );
  if (warnings.length > 0) {
    lines.push(`\n⚠️ Avertissements :\n${warnings.join('\n')}`);
  }
  lines.push(
    '\nℹ️ Commande relançable à tout moment : seuls les éléments manquants sont créés.',
  );

  // Discord limite un message à 2000 caractères.
  const text = lines.join('\n');
  await interaction.editReply(text.length > 1990 ? `${text.slice(0, 1989)}…` : text);
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
