import { env } from '../../env';

/** Petit client Helix (API Twitch) avec token d'application (client credentials). */

const HELIX = 'https://api.twitch.tv/helix';
const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

let appToken: { value: string; exp: number } | null = null;

async function getAppToken(): Promise<string | null> {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return null;
  if (appToken && appToken.exp > Date.now() + 60_000) return appToken.value;
  const body = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const res = await fetch(TOKEN_URL, { method: 'POST', body });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token: string; expires_in: number };
  appToken = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function helix<T>(path: string): Promise<T | null> {
  const token = await getAppToken();
  if (!token) return null;
  const res = await fetch(`${HELIX}${path}`, {
    headers: { 'Client-Id': env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export type HxUser = { id: string; login: string; display_name: string };

export async function getUserByLogin(login: string): Promise<HxUser | null> {
  const j = await helix<{ data: HxUser[] }>(`/users?login=${encodeURIComponent(login)}`);
  return j?.data?.[0] ?? null;
}

export async function getStreamStart(userId: string): Promise<Date | null> {
  const j = await helix<{ data: { started_at: string }[] }>(`/streams?user_id=${userId}`);
  const s = j?.data?.[0];
  return s ? new Date(s.started_at) : null;
}

export async function getChannelInfo(broadcasterId: string): Promise<{ game: string; title: string } | null> {
  const j = await helix<{ data: { game_name: string; title: string }[] }>(
    `/channels?broadcaster_id=${broadcasterId}`,
  );
  const c = j?.data?.[0];
  return c ? { game: c.game_name, title: c.title } : null;
}
