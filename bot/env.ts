import 'dotenv/config';

/**
 * Variables d'environnement du bot.
 *
 * En local : place-les dans un fichier `.env` (chargé par dotenv).
 * En production (Railway/Fly/VPS) : injecte-les dans l'hébergeur.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variable d'environnement manquante : ${name}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  /** Token du bot (Discord Developer Portal → ton application → Bot). */
  DISCORD_BOT_TOKEN: required('DISCORD_BOT_TOKEN'),
  /** Application (client) ID — Discord Developer Portal → General Information. */
  DISCORD_CLIENT_ID: required('DISCORD_CLIENT_ID'),
  /**
   * ID du serveur Discord (optionnel). Si fourni, les commandes sont
   * enregistrées sur CE serveur (mise à jour instantanée, idéal en dev).
   * Vide = commandes globales (propagation jusqu'à 1 h).
   */
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  /** Base de données partagée avec le site (même valeur que DATABASE_URL du site). */
  DATABASE_URL: required('DATABASE_URL'),
  /**
   * Secret partagé avec le site pour authentifier les appels HTTP (site → bot).
   * Optionnel : sans lui, l'endpoint HTTP refuse tout (le bot fonctionne quand
   * même pour les commandes slash).
   */
  BOT_HTTP_SECRET: process.env.BOT_HTTP_SECRET || '',
  /** Salon Discord où le bot publie les événements du calendrier. */
  DISCORD_CALENDAR_CHANNEL_ID: process.env.DISCORD_CALENDAR_CHANNEL_ID || '',
};
