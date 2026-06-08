import { env } from '../../env';

/** Obtention du token de chat Twitch : via refresh token si dispo, sinon statique. */

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

function withPrefix(t: string): string {
  return t.startsWith('oauth:') ? t : `oauth:${t}`;
}

/** Un renouvellement automatique est-il configuré ? */
export function refreshConfigured(): boolean {
  return Boolean(env.TWITCH_BOT_REFRESH_TOKEN && env.TWITCH_CLIENT_ID && env.TWITCH_CLIENT_SECRET);
}

/**
 * Renvoie un token de chat utilisable (préfixé « oauth: »), ou null.
 * Si un refresh token est fourni, on échange contre un token frais (évite
 * l'expiration silencieuse) ; sinon on retombe sur le token statique.
 */
export async function getChatToken(): Promise<string | null> {
  if (refreshConfigured()) {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: env.TWITCH_BOT_REFRESH_TOKEN,
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
      });
      const res = await fetch(TOKEN_URL, { method: 'POST', body });
      if (res.ok) {
        const j = (await res.json()) as { access_token?: string };
        if (j.access_token) return withPrefix(j.access_token);
      } else {
        console.error(`Twitch : échec du refresh token (HTTP ${res.status}).`);
      }
    } catch (e) {
      console.error('Twitch : erreur lors du refresh token :', e);
    }
  }
  return env.TWITCH_BOT_TOKEN ? withPrefix(env.TWITCH_BOT_TOKEN) : null;
}
