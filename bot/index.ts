import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { env } from './env';
import { handleInteraction } from './commands';
import { prisma } from './prisma';

/**
 * Point d'entrée du bot Discord d'Absolution.
 * Process long-running (passerelle Discord) → à héberger hors Vercel
 * (Railway / Fly.io / VPS). Voir bot/README.md.
 */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot connecté en tant que ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
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

async function shutdown() {
  await prisma.$disconnect().catch(() => {});
  client.destroy();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

client.login(env.DISCORD_BOT_TOKEN);
