import { getAlertsAfter, getLatestAlertId } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * File d'alertes consommée par l'overlay `/overlay/alert`.
 *
 *  - `GET /api/overlay/alerts`            → { lastId } (curseur initial, sans rejouer l'historique)
 *  - `GET /api/overlay/alerts?after=<id>` → { alerts: [...], lastId }
 */
// En-têtes anti-cache : la source navigateur d'OBS (CEF) mettrait sinon en cache
// ces réponses GET et ne verrait jamais les nouvelles alertes en temps réel.
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const afterRaw = url.searchParams.get('after');

  // Sans curseur : on renvoie seulement le dernier id pour s'initialiser.
  if (afterRaw === null) {
    const lastId = await getLatestAlertId();
    return Response.json({ alerts: [], lastId }, { headers: NO_STORE });
  }

  const after = Number(afterRaw);
  const cursor = Number.isFinite(after) ? after : 0;
  const alerts = await getAlertsAfter(cursor);
  const lastId = alerts.length ? alerts[alerts.length - 1].id : cursor;
  return Response.json({ alerts, lastId }, { headers: NO_STORE });
}
