import { prisma } from './prisma';

/**
 * Client Twitch (Helix + EventSub) pour les alertes de stream.
 *
 * - Authentification applicative (client_credentials) pour gérer les
 *   abonnements EventSub par webhook.
 * - La chaîne diffuseur (broadcaster) est mémorisée dans SiteContent après la
 *   connexion OAuth de l'admin (qui accorde aussi les scopes requis :
 *   `moderator:read:followers` pour les follows, `channel:read:subscriptions`
 *   pour les abonnements).
 */

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const AUTHORIZE_URL = 'https://id.twitch.tv/oauth2/authorize';
const HELIX = 'https://api.twitch.tv/helix';

/** Scopes demandés à la connexion (follows + abonnements ; raid n'en requiert pas). */
export const TWITCH_SCOPES = 'moderator:read:followers channel:read:subscriptions';

export function twitchConfigured(): boolean {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

/** Base publique du site (pour les redirections OAuth et le callback EventSub). */
export function publicBase(): string {
  return (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
}

export function eventSubCallbackUrl(): string {
  return `${publicBase()}/api/twitch/eventsub`;
}
export function oauthRedirectUri(): string {
  return `${publicBase()}/api/twitch/callback`;
}

export function authorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID || '',
    redirect_uri: oauthRedirectUri(),
    response_type: 'code',
    scope: TWITCH_SCOPES,
    state,
    force_verify: 'true',
  });
  return `${AUTHORIZE_URL}?${p.toString()}`;
}

// --- Jeton applicatif (mis en cache en mémoire) -----------------------------
let appToken: { value: string; exp: number } | null = null;

export async function getAppToken(): Promise<string> {
  if (appToken && appToken.exp > Date.now() + 30_000) return appToken.value;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID || '',
      client_secret: process.env.TWITCH_CLIENT_SECRET || '',
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error('Twitch : échec de récupération du jeton application');
  const json = await res.json();
  appToken = { value: json.access_token, exp: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return appToken.value;
}

async function helix(path: string, init: RequestInit = {}) {
  const token = await getAppToken();
  return fetch(`${HELIX}${path}`, {
    ...init,
    headers: {
      'Client-Id': process.env.TWITCH_CLIENT_ID || '',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

/** Échange le code OAuth contre un jeton utilisateur (pour identifier la chaîne). */
export async function exchangeCode(code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID || '',
      client_secret: process.env.TWITCH_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: oauthRedirectUri(),
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { access_token: string };
}

/** Récupère l'utilisateur Twitch associé à un jeton utilisateur. */
export async function getOwnUser(userToken: string) {
  const res = await fetch(`${HELIX}/users`, {
    headers: { 'Client-Id': process.env.TWITCH_CLIENT_ID || '', Authorization: `Bearer ${userToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] as { id: string; login: string; display_name: string } | undefined;
}

// --- Chaîne diffuseur mémorisée ---------------------------------------------
export async function getBroadcaster() {
  const rows = await prisma.siteContent.findMany({
    where: { key: { in: ['twitch.broadcasterId', 'twitch.broadcasterLogin'] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { id: map['twitch.broadcasterId'] || '', login: map['twitch.broadcasterLogin'] || '' };
}

export type StreamStatus = {
  live: boolean;
  login: string;
  title?: string;
  game?: string;
  viewers?: number;
  startedAt?: string;
};

/** Statut en direct de la chaîne diffuseur (live + titre + jeu + viewers). */
export async function getStreamStatus(): Promise<StreamStatus> {
  if (!twitchConfigured()) return { live: false, login: '' };
  const { id, login } = await getBroadcaster();
  if (!id) return { live: false, login };
  try {
    const res = await helix(`/streams?user_id=${id}`);
    if (!res.ok) return { live: false, login };
    const json = (await res.json()) as {
      data?: { title: string; game_name: string; viewer_count: number; started_at: string }[];
    };
    const s = json.data?.[0];
    if (!s) return { live: false, login };
    return {
      live: true,
      login,
      title: s.title,
      game: s.game_name,
      viewers: s.viewer_count,
      startedAt: s.started_at,
    };
  } catch {
    return { live: false, login };
  }
}

export async function setBroadcaster(id: string, login: string) {
  for (const [key, value] of [
    ['twitch.broadcasterId', id],
    ['twitch.broadcasterLogin', login],
  ] as const) {
    await prisma.siteContent.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

export async function clearBroadcaster() {
  await prisma.siteContent.deleteMany({
    where: { key: { in: ['twitch.broadcasterId', 'twitch.broadcasterLogin'] } },
  });
}

// --- EventSub ----------------------------------------------------------------
type EventSubItem = { id: string; type: string; status: string };

export async function listSubscriptions(): Promise<EventSubItem[]> {
  const res = await helix('/eventsub/subscriptions');
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []).map((s: EventSubItem) => ({ id: s.id, type: s.type, status: s.status }));
}

export async function deleteSubscription(id: string): Promise<boolean> {
  const res = await helix(`/eventsub/subscriptions?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  return res.ok;
}

async function createSubscription(type: string, version: string, condition: Record<string, string>) {
  const res = await helix('/eventsub/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      type,
      version,
      condition,
      transport: {
        method: 'webhook',
        callback: eventSubCallbackUrl(),
        secret: process.env.TWITCH_EVENTSUB_SECRET || '',
      },
    }),
  });
  const ok = res.status === 202;
  let detail = '';
  if (!ok) {
    try {
      const j = await res.json();
      detail = j.message || JSON.stringify(j);
    } catch {
      detail = `HTTP ${res.status}`;
    }
  }
  return { ok, detail };
}

/**
 * (Re)crée les abonnements EventSub pour la chaîne connectée : follows, abos,
 * ré-abos, abos offerts et raids. Renvoie un résumé par type.
 */
export async function setupSubscriptions(): Promise<{ type: string; ok: boolean; detail: string }[]> {
  const { id } = await getBroadcaster();
  if (!id) throw new Error('Aucune chaîne Twitch connectée.');

  const plan: { label: string; type: string; version: string; condition: Record<string, string> }[] = [
    { label: 'Follows', type: 'channel.follow', version: '2', condition: { broadcaster_user_id: id, moderator_user_id: id } },
    { label: 'Abonnements', type: 'channel.subscribe', version: '1', condition: { broadcaster_user_id: id } },
    { label: 'Ré-abonnements', type: 'channel.subscription.message', version: '1', condition: { broadcaster_user_id: id } },
    { label: 'Abos offerts', type: 'channel.subscription.gift', version: '1', condition: { broadcaster_user_id: id } },
    { label: 'Raids', type: 'channel.raid', version: '1', condition: { to_broadcaster_user_id: id } },
  ];

  // On repart propre : on supprime les abonnements existants avant de recréer.
  const existing = await listSubscriptions();
  await Promise.all(existing.map((s) => deleteSubscription(s.id)));

  const results: { type: string; ok: boolean; detail: string }[] = [];
  for (const s of plan) {
    const r = await createSubscription(s.type, s.version, s.condition);
    results.push({ type: s.label, ok: r.ok, detail: r.detail });
  }
  return results;
}
