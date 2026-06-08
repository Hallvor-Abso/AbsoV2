/**
 * Appels site → bot Discord (endpoint HTTP du bot, authentifié par secret).
 *
 * No-op silencieux si `BOT_URL` / `BOT_HTTP_SECRET` ne sont pas configurés, et
 * un échec ne casse jamais l'action côté site (le bot resynchronisera plus tard).
 */
function botConfig() {
  let url = process.env.BOT_URL?.trim();
  const secret = process.env.BOT_HTTP_SECRET;
  if (!url || !secret) return null;
  // Tolérance : si on a oublié le schéma (ex : "xxx.up.railway.app"), on
  // préfixe en https. On retire aussi un éventuel "/" final.
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/$/, '');
  return { url, secret };
}

/** Le canal HTTP site → bot est-il configuré ? (BOT_URL + BOT_HTTP_SECRET) */
export function isBotConfigured() {
  return botConfig() !== null;
}

/** Variante qui ATTEND la réponse du bot et la renvoie (lecture/écriture synchrone). */
async function callBotJson<T>(path: string, payload: unknown): Promise<T | null> {
  const cfg = botConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.secret}` },
      body: JSON.stringify(payload),
      // Plus large que le fire-and-forget : ces appels attendent que le bot
      // termine son travail (lecture/écriture de rôles via l'API Discord).
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      // Visible dans les logs du site (Vercel) : 401 = secret différent,
      // 404 = mauvaise URL/chemin, 500 = erreur interne du bot.
      console.error(`Appel bot ${path} → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`Appel bot ${path} échoué :`, err);
    return null;
  }
}

export type DiscordRoleItem = {
  key: string;
  name: string;
  kind: 'gm' | 'visiteur' | 'officier' | 'roster' | 'membre' | 'recrue';
  gameId: string | null;
  gameName: string | null;
  roleId: string | null; // null = rôle pas encore créé sur le serveur Discord
  assigned: boolean;
};

/** Lit en direct les rôles Discord structurés d'un membre (via le bot). */
export function getMemberDiscordRoles(discordId: string) {
  return callBotJson<{ ok: boolean; found: boolean; roles: DiscordRoleItem[] }>(
    '/member/roles/get',
    { discordId },
  );
}

/** Applique l'état souhaité des rôles Discord structurés d'un membre (via le bot). */
export function setMemberDiscordRoles(discordId: string, assignedKeys: string[]) {
  return callBotJson<{ ok: boolean; warnings?: string[]; assignedKeys?: string[] }>(
    '/member/roles/set',
    { discordId, assignedKeys },
  );
}

async function callBot(path: string, payload: unknown): Promise<void> {
  const cfg = botConfig();
  if (!cfg) return;
  try {
    await fetch(`${cfg.url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.secret}` },
      body: JSON.stringify(payload),
      // on ne veut pas bloquer trop longtemps l'action admin
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error(`Appel bot ${path} échoué :`, err);
  }
}

/** Demande au bot de publier / mettre à jour le message Discord de l'événement. */
export function syncEventToBot(eventId: string) {
  return callBot('/sync/event', { eventId });
}

/** Demande au bot de supprimer le message Discord d'un événement supprimé. */
export function removeEventFromBot(channelId: string | null, messageId: string | null) {
  if (!channelId || !messageId) return Promise.resolve();
  return callBot('/sync/event-deleted', { channelId, messageId });
}

/** Demande au bot de poster / mettre à jour une news publiée dans le salon News. */
export function syncNewsToBot(newsId: string) {
  return callBot('/sync/news', { newsId });
}

/** Demande au bot de supprimer le message Discord d'une news. */
export function removeNewsFromBot(channelId: string | null, messageId: string | null) {
  if (!channelId || !messageId) return Promise.resolve();
  return callBot('/sync/news-deleted', { channelId, messageId });
}

/** Demande au bot de publier / mettre à jour l'embed de progression d'un jeu. */
export function syncProgressionToBot(gameId: string | null) {
  if (!gameId) return Promise.resolve();
  return callBot('/sync/progression', { gameId });
}

/** Demande au bot de publier une candidature dans le salon de candidatures du jeu. */
export function syncApplicationToBot(applicationId: string) {
  return callBot('/sync/application', { applicationId });
}

/** Demande au bot de poster un message de statut dans le salon dédié. */
export function syncApplicationStatusToBot(applicationId: string) {
  return callBot('/sync/application-status', { applicationId });
}

/** Demande au bot de supprimer le salon dédié d'une candidature supprimée. */
export function deleteApplicationChannelFromBot(channelId: string | null) {
  if (!channelId) return Promise.resolve();
  return callBot('/sync/application-deleted', { channelId });
}
