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
