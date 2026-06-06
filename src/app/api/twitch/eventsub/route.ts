import { createHmac, timingSafeEqual } from 'crypto';
import { enqueueAlert } from '@/lib/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook Twitch EventSub.
 *  - vérifie la signature HMAC (anti-falsification) ;
 *  - répond au défi de vérification lors de la création d'un abonnement ;
 *  - transforme les notifications (follow/sub/resub/gift/raid) en alertes.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const secret = process.env.TWITCH_EVENTSUB_SECRET || '';
  const id = req.headers.get('twitch-eventsub-message-id') || '';
  const ts = req.headers.get('twitch-eventsub-message-timestamp') || '';
  const sig = req.headers.get('twitch-eventsub-message-signature') || '';
  if (!secret || !id || !ts || !sig) return new Response('bad request', { status: 400 });

  // Signature = HMAC-SHA256( id + timestamp + body ) avec le secret de l'abonnement.
  const expected = 'sha256=' + createHmac('sha256', secret).update(id + ts + body).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response('forbidden', { status: 403 });

  let payload: { subscription?: { type?: string }; event?: Record<string, unknown>; challenge?: string };
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const messageType = req.headers.get('twitch-eventsub-message-type');
  if (messageType === 'webhook_callback_verification') {
    return new Response(payload.challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  if (messageType === 'notification') {
    await handleNotification(payload.subscription?.type ?? '', payload.event ?? {});
  }
  return new Response('', { status: 204 });
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' ? v : 0);

async function handleNotification(subType: string, e: Record<string, unknown>) {
  switch (subType) {
    case 'channel.follow':
      await enqueueAlert({ type: 'FOLLOW', username: str(e.user_name) });
      break;
    case 'channel.subscribe':
      // Un abo offert déclenche aussi channel.subscribe (is_gift=true) : on
      // l'ignore ici, il est traité par channel.subscription.gift.
      if (e.is_gift !== true) await enqueueAlert({ type: 'SUB', username: str(e.user_name), tier: str(e.tier) });
      break;
    case 'channel.subscription.message':
      await enqueueAlert({
        type: 'RESUB',
        username: str(e.user_name),
        tier: str(e.tier),
        amount: num(e.cumulative_months) || num(e.duration_months),
        message: str((e.message as Record<string, unknown> | undefined)?.text),
      });
      break;
    case 'channel.subscription.gift':
      await enqueueAlert({
        type: 'SUBGIFT',
        username: e.is_anonymous === true ? 'Anonyme' : str(e.user_name),
        tier: str(e.tier),
        amount: num(e.total) || 1,
      });
      break;
    case 'channel.raid':
      await enqueueAlert({
        type: 'RAID',
        username: str(e.from_broadcaster_user_name),
        amount: num(e.viewers),
      });
      break;
  }
}
