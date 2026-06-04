/**
 * Appels site → bot Discord (endpoint HTTP du bot, authentifié par secret).
 *
 * No-op silencieux si `BOT_URL` / `BOT_HTTP_SECRET` ne sont pas configurés, et
 * un échec ne casse jamais l'action côté site (le bot resynchronisera plus tard).
 */
function botConfig() {
  const url = process.env.BOT_URL?.replace(/\/$/, '');
  const secret = process.env.BOT_HTTP_SECRET;
  if (!url || !secret) return null;
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
