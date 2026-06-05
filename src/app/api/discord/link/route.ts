import { type NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { discordOauthConfigured, buildAuthorizeUrl, makeState } from '@/lib/discord-oauth';

function baseUrl(req: NextRequest): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '') || req.nextUrl.origin;
}

/** Démarre la liaison du compte courant avec Discord (redirige vers Discord). */
export async function GET(req: NextRequest) {
  const base = baseUrl(req);
  const user = await getAppUser();
  if (!user) return NextResponse.redirect(`${base}/connexion`);
  if (!discordOauthConfigured()) return NextResponse.redirect(`${base}/calendrier?discord=config`);

  const redirectUri = `${base}/api/discord/callback`;
  // State signé (aucun cookie nécessaire).
  return NextResponse.redirect(buildAuthorizeUrl(redirectUri, makeState()));
}
