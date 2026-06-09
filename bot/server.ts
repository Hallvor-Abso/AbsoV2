import { createServer } from 'node:http';
import type { Client } from 'discord.js';
import { env } from './env';
import { syncEvent, removeEventMessage } from './features/calendar';
import { postApplication, postApplicationStatus, deleteApplicationChannel } from './features/recruitment';
import { getMemberRoles, setMemberRoles } from './features/members';
import { syncNews, removeNews } from './features/news';
import { postRaidRoster } from './features/raid-roster';
import { syncProgression } from './features/progression';

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

    // Sonde de santé (Railway / vérifs). « features » permet de confirmer que
    // CE déploiement du bot contient bien la gestion des rôles membres.
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      return json(200, { ok: true, features: ['member-roles'] });
    }
    if (req.method !== 'POST') return json(404, { error: 'not found' });

    // Authentification par secret partagé.
    if (!env.BOT_HTTP_SECRET || req.headers['authorization'] !== `Bearer ${env.BOT_HTTP_SECRET}`) {
      return json(401, { error: 'unauthorized' });
    }

    let raw = '';
    for await (const chunk of req) raw += chunk;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: Record<string, any> = {};
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
        case '/sync/progression':
          void syncProgression(client, body.gameId).catch((e) =>
            console.error('syncProgression (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/application':
          void postApplication(client, body.applicationId).catch((e) =>
            console.error('postApplication (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/application-status':
          void postApplicationStatus(client, body.applicationId).catch((e) =>
            console.error('postApplicationStatus (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/application-deleted':
          void deleteApplicationChannel(client, body.channelId ?? null).catch((e) =>
            console.error('deleteApplicationChannel (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/news':
          void syncNews(client, body.newsId).catch((e) => console.error('syncNews (bg) :', e));
          return json(200, { ok: true });
        case '/sync/news-deleted':
          void removeNews(client, body.channelId ?? null, body.messageId ?? null).catch((e) =>
            console.error('removeNews (bg) :', e),
          );
          return json(200, { ok: true });
        case '/sync/roster':
          void postRaidRoster(client, body.eventId).catch((e) => console.error('postRaidRoster (bg) :', e));
          return json(200, { ok: true });
        // Rôles Discord d'un membre (lecture/écriture synchrones : on attend
        // la réponse pour la renvoyer au site).
        case '/member/roles/get': {
          const t = Date.now();
          const data = await getMemberRoles(client, String(body.discordId));
          console.log(`✅ /member/roles/get (${body.discordId}) → ${Date.now() - t}ms`);
          return json(200, { ok: true, ...data });
        }
        case '/member/roles/set': {
          const t = Date.now();
          const keys = Array.isArray(body.assignedKeys) ? body.assignedKeys.map(String) : [];
          const data = await setMemberRoles(client, String(body.discordId), keys);
          console.log(`✅ /member/roles/set (${body.discordId}) → ${Date.now() - t}ms`);
          return json(200, data);
        }
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
