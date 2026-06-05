import { type NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getAppUser } from '@/lib/auth';
import { discordOauthConfigured, buildAuthorizeUrl } from '@/lib/discord-oauth';

/** Démarre la liaison du compte courant avec Discord (redirige vers Discord). */
function baseUrl(req: NextRequest): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '') || req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const base = baseUrl(req);
  const user = await getAppUser();
  if (!user) return NextResponse.redirect(`${base}/connexion`);
  if (!discordOauthConfigured()) return NextResponse.redirect(`${base}/calendrier?discord=config`);

  const state = randomBytes(16).toString('hex');
  const redirectUri = `${base}/api/discord/callback`;
  const res = NextResponse.redirect(buildAuthorizeUrl(redirectUri, state));
  // State anti-CSRF, relu au retour.
  res.cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
