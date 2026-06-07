import tmi from 'tmi.js';
import { env } from '../../env';
import { prisma } from '../../prisma';
import { getStreamStart, getUserByLogin } from './helix';
import { resolveCommand } from './commands';
import { checkMessage, getModConfig, grantPermit, modActive } from './moderation';

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
    const ctx = {
      login: (tags.username ?? '').toLowerCase(),
      display: tags['display-name'] ?? tags.username ?? '',
      isMod: Boolean(tags.mod) || tags.badges?.broadcaster === '1',
      isSub: Boolean(tags.subscriber),
      broadcasterId,
      channel,
    };

    // --- Modération (avant tout) ---
    try {
      const cfg = await getModConfig();
      // !permit @user : un mod autorise un viewer à poster un lien.
      if (ctx.isMod && /^!permit\b/i.test(text)) {
        const target = text.split(/\s+/)[1]?.replace(/^@/, '');
        if (target) {
          grantPermit(target, cfg.permitSeconds);
          await client.say(ch, `@${target} peut poster un lien (${cfg.permitSeconds}s).`).catch(() => {});
        }
        return;
      }
      if (modActive(cfg)) {
        const reason = checkMessage(cfg, text, ctx);
        if (reason) {
          if (tags.id) await client.deletemessage(ch, tags.id).catch(() => {});
          await client.timeout(ch, ctx.login, cfg.timeoutSeconds, reason).catch(() => {});
          if (cfg.warnMessage) await client.say(ch, `@${ctx.display} ${cfg.warnMessage}`).catch(() => {});
          return;
        }
      }
    } catch (e) {
      console.error('Modération Twitch :', e);
    }

    // --- Commandes ---
    if (!text.startsWith('!')) return;
    const parts = text.slice(1).split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    try {
      const now = Date.now();
      if (now - (cooldowns.get(name) ?? 0) < 4000) return;
      const reply = await resolveCommand(name, args, ctx);
      if (reply == null) return;
      cooldowns.set(name, now);
      await client.say(ch, reply);
    } catch (e) {
      console.error('Commande Twitch :', e);
    }
  });

  client.connect().catch((e) => console.error('Connexion Twitch :', e));

  startTimers(client, channel, broadcasterId);
}

/** Timers : messages périodiques (uniquement quand le live est en cours). */
function startTimers(client: tmi.Client, channel: string, broadcasterId: string | null): void {
  const lastPosted = new Map<string, number>();

  const tick = async () => {
    try {
      // On ne poste que si le stream est en live (évite de spammer hors-ligne).
      if (broadcasterId) {
        const start = await getStreamStart(broadcasterId);
        if (!start) return;
      }
      const timers = await prisma.twitchTimer.findMany({ where: { enabled: true } });
      const now = Date.now();
      for (const t of timers) {
        if (!lastPosted.has(t.id)) {
          lastPosted.set(t.id, now); // attend un intervalle avant le 1er envoi
          continue;
        }
        if (now - (lastPosted.get(t.id) ?? 0) >= t.intervalMinutes * 60_000) {
          await client.say(`#${channel}`, t.message).catch(() => {});
          lastPosted.set(t.id, now);
        }
      }
    } catch (e) {
      console.error('Timers Twitch :', e);
    }
  };

  setInterval(tick, 60_000);
}
