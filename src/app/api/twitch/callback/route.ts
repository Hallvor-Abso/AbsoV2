import { NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';
import { exchangeCode, getOwnUser, setBroadcaster } from '@/lib/twitch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Retour OAuth Twitch : identifie la chaîne et la mémorise. */
export async function GET(req: Request) {
  const user = await getAppUser();
  if (!canAccessOverlays(user)) return NextResponse.redirect(new URL('/admin', req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = req.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('twitch_oauth_state='))
    ?.split('=')[1];

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/admin/overlays?twitch=${reason}`, req.url));

  if (!code || !state || !cookieState || state !== cookieState) return fail('state');

  const token = await exchangeCode(code);
  if (!token?.access_token) return fail('error');

  const me = await getOwnUser(token.access_token);
  if (!me) return fail('error');

  await setBroadcaster(me.id, me.login);

  const res = NextResponse.redirect(new URL('/admin/overlays?twitch=connected', req.url));
  res.cookies.set('twitch_oauth_state', '', { maxAge: 0, path: '/' });
  return res;
}
