import { Client, Events, GatewayIntentBits, MessageFlags, Routes } from 'discord.js';
import { env } from './env';
import { commands, handleInteraction } from './commands';
import { handleRsvp, handleRespec, handleClassSelect, handleSpecSelect, handleRoleSelect } from './features/calendar';
import { reconcileMember } from './features/members';
import { startHttpServer } from './server';
import { startReminderLoop } from './features/reminders';
import { prisma } from './prisma';

/**
 * Point d'entrée du bot Discord d'Absolution.
 * Process long-running (passerelle Discord) → à héberger hors Vercel
 * (Railway / Fly.io / VPS). Voir bot/README.md.
 *
 * NB : l'intent GuildMembers est PRIVILÉGIÉ → il faut activer « Server Members
 * Intent » dans le Discord Developer Portal (onglet Bot), sinon la connexion
 * échoue. Il sert à corriger automatiquement la hiérarchie des grades.
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot connecté en tant que ${c.user.tag}`);

  // Enregistrement automatique des commandes au démarrage : aucune étape
  // manuelle nécessaire (pratique pour un hébergement type Railway).
  try {
    const route = env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(c.application.id, env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(c.application.id);
    await c.rest.put(route, { body: commands });
    console.log(
      `✅ ${commands.length} commande(s) enregistrée(s) ${env.DISCORD_GUILD_ID ? '(guilde)' : '(global)'}.`,
    );
  } catch (err) {
    console.error('⚠️ Échec de l’enregistrement des commandes :', err);
  }

  // Serveur HTTP (site → bot) pour les notifications instantanées.
  startHttpServer(c);

  // Boucle de rappels de raid (MP aux inscrits).
  startReminderLoop(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Boutons (RSVP du calendrier, etc.)
  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('rsvp:')) await handleRsvp(interaction);
      else if (interaction.customId.startsWith('respec:')) await handleRespec(interaction);
    } catch (err) {
      console.error('Erreur bouton :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
    return;
  }

  // Menus déroulants (choix de classe / spé pour l'inscription).
  if (interaction.isStringSelectMenu()) {
    try {
      if (interaction.customId.startsWith('clsel:')) await handleClassSelect(interaction);
      else if (interaction.customId.startsWith('spsel:')) await handleSpecSelect(interaction);
      else if (interaction.customId.startsWith('rolsel:')) await handleRoleSelect(interaction);
    } catch (err) {
      console.error('Erreur menu déroulant :', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  try {
    await handleInteraction(interaction);
  } catch (err) {
    console.error('Erreur lors du traitement d’une commande :', err);
    const content = 'Une erreur est survenue. Réessaie dans un instant.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(content).catch(() => {});
    } else {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

// Message d'un officier dans un salon « candid-… » → on note la date pour
// afficher un badge de notification au candidat sur le site.
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return; // on ignore les messages du bot lui-même
  try {
    await prisma.application.updateMany({
      where: { discordChannelId: message.channelId },
      data: { lastOfficerMessageAt: new Date() },
    });
  } catch (err) {
    console.error('MessageCreate → notification candidat :', err);
  }
});

// Changement de rôles d'un membre sur Discord → on re-normalise la hiérarchie
// des grades (cumul + exclusions). Idempotent : aucun effet si déjà cohérent.
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  const before = new Set(oldMember.roles?.cache?.keys() ?? []);
  const after = new Set(newMember.roles.cache.keys());
  const sameRoles = before.size === after.size && [...after].every((id) => before.has(id));
  if (sameRoles) return; // ce n'est pas un changement de rôles (pseudo, etc.)
  try {
    await reconcileMember(newMember);
  } catch (err) {
    console.error('GuildMemberUpdate → reconcileMember :', err);
  }
});

// Suppression d'un salon Discord → on supprime la candidature associée (sync inverse).
client.on(Events.ChannelDelete, async (channel) => {
  try {
    const deleted = await prisma.application.deleteMany({ where: { discordChannelId: channel.id } });
    if (deleted.count > 0) {
      console.log(`🗑️  Salon ${channel.id} supprimé → ${deleted.count} candidature(s) retirée(s).`);
    }
  } catch (err) {
    console.error('ChannelDelete → suppression candidature :', err);
  }
});

async function shutdown() {
  await prisma.$disconnect().catch(() => {});
  client.destroy();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(env.DISCORD_BOT_TOKEN);
