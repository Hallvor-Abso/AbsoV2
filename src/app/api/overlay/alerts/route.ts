import { getAlertsAfter, getLatestAlertId } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * File d'alertes consommée par l'overlay `/overlay/alert`.
 *
 *  - `GET /api/overlay/alerts`            → { lastId } (curseur initial, sans rejouer l'historique)
 *  - `GET /api/overlay/alerts?after=<id>` → { alerts: [...], lastId }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const afterRaw = url.searchParams.get('after');

  // Sans curseur : on renvoie seulement le dernier id pour s'initialiser.
  if (afterRaw === null) {
    const lastId = await getLatestAlertId();
    return Response.json({ alerts: [], lastId });
  }

  const after = Number(afterRaw);
  const cursor = Number.isFinite(after) ? after : 0;
  const alerts = await getAlertsAfter(cursor);
  const lastId = alerts.length ? alerts[alerts.length - 1].id : cursor;
  return Response.json({ alerts, lastId });
}
