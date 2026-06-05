import { type NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { exchangeCode, fetchDiscordUser } from '@/lib/discord-oauth';
import { prisma } from '@/lib/prisma';

function baseUrl(req: NextRequest): string {
  return process.env.NEXTAUTH_URL?.replace(/\/$/, '') || req.nextUrl.origin;
}

/** Retour de Discord : on enregistre l'ID Discord sur le compte courant. */
export async function GET(req: NextRequest) {
  const base = baseUrl(req);
  const back = (status: string) => NextResponse.redirect(`${base}/calendrier?discord=${status}`);

  const user = await getAppUser();
  if (!user) return NextResponse.redirect(`${base}/connexion`);

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const cookieState = req.cookies.get('discord_oauth_state')?.value;
  if (!code || !state || !cookieState || state !== cookieState) return back('error');

  try {
    const redirectUri = `${base}/api/discord/callback`;
    const token = await exchangeCode(code, redirectUri);
    const dUser = await fetchDiscordUser(token.access_token);

    await prisma.user.update({
      where: { id: user.id },
      data: { discordId: dUser.id, discord: dUser.global_name || dUser.username },
    });

    const res = back('ok');
    res.cookies.delete('discord_oauth_state');
    return res;
  } catch (err) {
    // P2002 = cet ID Discord est déjà relié à un autre compte.
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return back('taken');
    }
    console.error('Liaison Discord échouée :', err);
    return back('error');
  }
}
