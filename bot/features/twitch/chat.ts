import tmi from 'tmi.js';
import { env } from '../../env';
import { getUserByLogin } from './helix';
import { resolveCommand } from './commands';

/** Le bot Twitch est-il configuré ? (pseudo + token + chaîne) */
export function twitchConfigured(): boolean {
  return Boolean(env.TWITCH_BOT_USERNAME && env.TWITCH_BOT_TOKEN && env.TWITCH_CHANNEL);
}

const cooldowns = new Map<string, number>(); // anti-spam global par commande

/** Démarre le bot de chat Twitch (no-op si non configuré). */
export async function startTwitchBot(): Promise<void> {
  if (!twitchConfigured()) {
    console.log('🟣 Bot Twitch : non configuré (variables manquantes) — ignoré.');
    return;
  }
  const channel = env.TWITCH_CHANNEL.toLowerCase().replace(/^#/, '');
  const broadcaster = await getUserByLogin(channel).catch(() => null);
  const broadcasterId = broadcaster?.id ?? null;

  const client = new tmi.Client({
    options: { skipUpdatingEmotesets: true },
    connection: { reconnect: true, secure: true },
    identity: { username: env.TWITCH_BOT_USERNAME, password: env.TWITCH_BOT_TOKEN },
    channels: [channel],
  });

  client.on('connected', () => console.log(`🟣 Bot Twitch connecté au chat de #${channel}`));

  client.on('message', async (ch, tags, message, self) => {
    if (self) return;
    const text = message.trim();
    if (!text.startsWith('!')) return; // (la modération s'ajoutera ici plus tard)

    const parts = text.slice(1).split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    const ctx = {
      login: (tags.username ?? '').toLowerCase(),
      display: tags['display-name'] ?? tags.username ?? '',
      isMod: Boolean(tags.mod) || tags.badges?.broadcaster === '1',
      isSub: Boolean(tags.subscriber),
      broadcasterId,
      channel,
    };

    try {
      const now = Date.now();
      if (now - (cooldowns.get(name) ?? 0) < 4000) return; // cooldown simple
      const reply = await resolveCommand(name, args, ctx);
      if (reply == null) return;
      cooldowns.set(name, now);
      await client.say(ch, reply);
    } catch (e) {
      console.error('Commande Twitch :', e);
    }
  });

  client.connect().catch((e) => console.error('Connexion Twitch :', e));
}
