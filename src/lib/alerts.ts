import { prisma } from './prisma';
import type { AlertType } from '@prisma/client';

/**
 * File d'attente des alertes de stream.
 *
 * Producteurs : webhook Twitch EventSub (`/api/twitch/eventsub`) et boutons de
 * test de l'admin. Consommateur : l'overlay `/overlay/alert`, qui interroge
 * régulièrement les nouvelles entrées via `/api/overlay/alerts`.
 */
export type AlertInput = {
  type: AlertType;
  username?: string;
  message?: string;
  amount?: number;
  tier?: string;
};

/** Ajoute une alerte à la file (et purge les alertes de plus de 10 minutes). */
export async function enqueueAlert(a: AlertInput) {
  const alert = await prisma.streamAlert.create({
    data: {
      type: a.type,
      username: (a.username ?? '').slice(0, 80),
      message: (a.message ?? '').slice(0, 300),
      amount: Number.isFinite(a.amount) ? Math.trunc(a.amount as number) : 0,
      tier: (a.tier ?? '').slice(0, 10),
    },
  });
  await prisma.streamAlert.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  return alert;
}

/** Alertes apparues après le curseur `after` (id strictement supérieur). */
export function getAlertsAfter(after: number) {
  return prisma.streamAlert.findMany({
    where: { id: { gt: after } },
    orderBy: { id: 'asc' },
    take: 20,
  });
}

/** Dernier id de la file (curseur initial : on ne rejoue pas l'historique). */
export async function getLatestAlertId(): Promise<number> {
  const last = await prisma.streamAlert.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
  return last?.id ?? 0;
}
