import { createServer } from 'node:http';
import type { Client } from 'discord.js';
import { env } from './env';
import { syncEvent, removeEventMessage } from './features/calendar';
import { postApplication } from './features/recruitment';

/**
 * Petit serveur HTTP du bot : reçoit les notifications du site (site → bot)
 * pour réagir immédiatement (publier/mettre à jour un événement, etc.).
 * Protégé par un secret partagé (`BOT_HTTP_SECRET`).
 *
 * Railway fournit `PORT` et expose le service via un domaine public.
 */
export function startHttpServer(client: Client): void {
  const port = Number(process.env.PORT) || 3001;

  const server = createServer(async (req, res) => {
    const json = (code: number, payload: unknown) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // Sonde de santé (Railway / vérifs).
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      return json(200, { ok: true });
    }
    if (req.method !== 'POST') return json(404, { error: 'not found' });

    // Authentification par secret partagé.
    if (!env.BOT_HTTP_SECRET || req.headers['authorization'] !== `Bearer ${env.BOT_HTTP_SECRET}`) {
      return json(401, { error: 'unauthorized' });
    }

    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body: Record<string, string> = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return json(400, { error: 'invalid json' });
    }

    try {
      switch (req.url) {
        case '/sync/event':
          // On répond TOUT DE SUITE : la mise à jour Discord (appels API,
          // édition du message) se fait en arrière-plan pour ne pas faire
          // attendre le site.
          void syncEvent(client, body.eventId).catch((e) => console.error('syncEvent (bg) :', e));
          return json(200, { ok: true });
        case '/sync/event-deleted':
          void removeEventMessage(client, body.channelId ?? null, body.messageId ?? null).catch((e) =>
            console.error('removeEventMessage (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/application':
          void postApplication(client, body.applicationId).catch((e) =>
            console.error('postApplication (bg) :', e),
          );
          return json(200, { ok: true });
        default:
          return json(404, { error: 'not found' });
      }
    } catch (err) {
      console.error('Erreur HTTP bot :', err);
      return json(500, { error: err instanceof Error ? err.message : 'error' });
    }
  });

  server.listen(port, () => console.log(`🌐 Serveur HTTP du bot à l'écoute sur le port ${port}`));
}
