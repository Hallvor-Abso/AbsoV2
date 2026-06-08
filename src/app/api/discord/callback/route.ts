import { type NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { exchangeCode, fetchDiscordUser, verifyState } from '@/lib/discord-oauth';
import { getMemberDiscordRoles } from '@/lib/bot';
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
  if (!code || !state || !verifyState(state)) return back('err_state');

  const redirectUri = `${base}/api/discord/callback`;

  // Étape 1 : échanger le code contre un token (échoue si secret ou redirect_uri faux).
  let accessToken: string;
  try {
    const token = await exchangeCode(code, redirectUri);
    accessToken = token.access_token;
  } catch (err) {
    console.error('Discord token exchange:', err);
    return back('err_token');
  }

  // Étape 2 : lire le profil Discord.
  let dUser: { id: string; username: string; global_name: string | null };
  try {
    dUser = await fetchDiscordUser(accessToken);
  } catch (err) {
    console.error('Discord user fetch:', err);
    return back('err_user');
  }

  // Étape 3 : enregistrer l'ID sur le compte courant. Le pseudo affiché du
  // site devient le pseudo Discord (global_name si dispo, sinon username).
  const discordName = dUser.global_name || dUser.username;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { discordId: dUser.id, discord: discordName, displayName: discordName },
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
      return back('taken'); // cet ID Discord est déjà relié à un autre compte
    }
    console.error('Discord link save:', err);
    return back('error');
  }

  // Récupère les grades Discord du membre pour piloter la visibilité par jeu.
  try {
    const res = await getMemberDiscordRoles(dUser.id);
    if (res?.ok && res.found) {
      const keys = res.roles.filter((r) => r.assigned).map((r) => r.key);
      await prisma.user.update({ where: { id: user.id }, data: { discordRoles: keys } });
    }
  } catch (err) {
    console.error('Discord roles sync on link:', err);
  }

  return back('ok');
}
