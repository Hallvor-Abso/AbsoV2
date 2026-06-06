import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';
import { authorizeUrl, twitchConfigured } from '@/lib/twitch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Démarre la connexion OAuth Twitch (réservée au Super Admin). */
export async function GET(req: Request) {
  const user = await getAppUser();
  if (!canAccessOverlays(user)) return NextResponse.redirect(new URL('/admin', req.url));
  if (!twitchConfigured()) {
    return NextResponse.redirect(new URL('/admin/overlays?twitch=notconfigured', req.url));
  }

  const state = randomUUID();
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set('twitch_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
