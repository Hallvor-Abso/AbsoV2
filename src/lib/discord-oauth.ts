/**
 * Connexion Discord « légère » (OAuth2) — sert UNIQUEMENT à relier un compte
 * site existant à son identité Discord (on stocke l'ID Discord sur le compte).
 *
 * On n'utilise volontairement pas l'adaptateur NextAuth : ce flux est autonome
 * et ne touche pas à la connexion par mot de passe (admins, membres).
 */
const DISCORD_API = 'https://discord.com/api';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function stateSecret(): string {
  return process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
}

/**
 * State anti-CSRF **signé** (sans cookie) : robuste aux allers-retours
 * Discord ↔ Vercel. Contient un horodatage signé en HMAC.
 */
export function makeState(): string {
  const payload = `${Date.now()}_${randomBytes(8).toString('hex')}`;
  const sig = createHmac('sha256', stateSecret()).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyState(state: string, maxAgeMs = 10 * 60 * 1000): boolean {
  const [b64, sig] = state.split('.');
  if (!b64 || !sig) return false;
  const payload = Buffer.from(b64, 'base64url').toString();
  const expected = createHmac('sha256', stateSecret()).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const ts = Number(payload.split('_')[0]);
  return Number.isFinite(ts) && Date.now() - ts < maxAgeMs;
}


export function discordOauthConfigured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'consent',
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string }> {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? '',
    client_secret: process.env.DISCORD_CLIENT_SECRET ?? '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Échange de code Discord échoué (${res.status})`);
  return res.json();
}

export async function fetchDiscordUser(
  accessToken: string,
): Promise<{ id: string; username: string; global_name: string | null }> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Lecture du profil Discord échouée (${res.status})`);
  return res.json();
}
