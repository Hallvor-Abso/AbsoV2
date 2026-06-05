import { Client, Events, GatewayIntentBits, MessageFlags, Routes } from 'discord.js';
import { env } from './env';
import { commands, handleInteraction } from './commands';
import { handleRsvp } from './features/calendar';
import { startHttpServer } from './server';
import { prisma } from './prisma';

/**
 * Point d'entrée du bot Discord d'Absolution.
 * Process long-running (passerelle Discord) → à héberger hors Vercel
 * (Railway / Fly.io / VPS). Voir bot/README.md.
 */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Boutons (RSVP du calendrier, etc.)
  if (interaction.isButton()) {
    try {
      if (interaction.customId.startsWith('rsvp:')) await handleRsvp(interaction);
    } catch (err) {
      console.error('Erreur bouton :', err);
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
