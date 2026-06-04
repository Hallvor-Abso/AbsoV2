import { REST, Routes } from 'discord.js';
import { env } from './env';
import { commands } from './commands';

/**
 * Enregistre les commandes slash auprès de Discord.
 * - DISCORD_GUILD_ID défini → enregistrement sur le serveur (instantané).
 * - sinon → enregistrement global (propagation jusqu'à 1 h).
 *
 * À relancer à chaque ajout/modification de commande : `npm run bot:register`.
 */
async function main() {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);
  const route = env.DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(
    `✅ ${commands.length} commande(s) enregistrée(s) ${
      env.DISCORD_GUILD_ID ? `sur la guilde ${env.DISCORD_GUILD_ID}` : 'globalement'
    }.`,
  );
}

main().catch((err) => {
  console.error('❌ Échec de l’enregistrement des commandes :', err);
  process.exit(1);
});
