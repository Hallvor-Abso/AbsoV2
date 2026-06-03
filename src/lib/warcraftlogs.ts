/**
 * Intégration Warcraft Logs (API v2) — récupération automatique du nombre de
 * pulls et du meilleur % de vie atteint sur les boss en progression.
 *
 * CONÇU POUR NE JAMAIS CASSER LE SITE :
 *  - si les identifiants API ne sont pas configurés → renvoie null (rien affiché)
 *  - en cas d'erreur réseau / réponse inattendue → renvoie null
 *
 * Configuration nécessaire :
 *  - Variables d'env : WCL_CLIENT_ID, WCL_CLIENT_SECRET
 *  - Identité de la guilde (région / royaume / nom) : éditable dans l'admin
 *  - Par tier : zoneId (WCL) ; par boss : encounterId (WCL)
 */

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token';
const API_URL = 'https://www.warcraftlogs.com/api/v2/client';

/** Les identifiants API sont-ils présents ? */
export function isWclConfigured(): boolean {
  return Boolean(process.env.WCL_CLIENT_ID && process.env.WCL_CLIENT_SECRET);
}

/** Récupère un jeton d'accès (mis en cache 1h via le cache fetch de Next). */
async function getToken(): Promise<string | null> {
  try {
    const id = process.env.WCL_CLIENT_ID!;
    const secret = process.env.WCL_CLIENT_SECRET!;
    const basic = Buffer.from(`${id}:${secret}`).toString('base64');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3600 }, // jeton réutilisé pendant 1h
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export type BossProgress = { pulls: number; bestPercent: number; killed: boolean };

export interface ZoneProgressParams {
  region: string; // ex : "eu"
  realm: string; // slug du royaume, ex : "hyjal"
  guild: string; // nom de la guilde
  zoneId: number; // ID de la zone WCL
  difficulty: number; // 5 = Mythique, 4 = Héroïque, 3 = Normal
}

/**
 * Récupère, pour une zone, la progression de chaque boss (pulls + meilleur %).
 * Renvoie une Map indexée par encounterID, ou null si indisponible.
 */
export async function getZoneProgress(
  params: ZoneProgressParams
): Promise<Map<number, BossProgress> | null> {
  if (!isWclConfigured()) return null;
  if (!params.region || !params.realm || !params.guild || !params.zoneId) return null;

  const token = await getToken();
  if (!token) return null;

  // On récupère les fights (pulls) des derniers rapports de la guilde sur la zone.
  const query = `
    query ($guild: String!, $realm: String!, $region: String!, $zoneId: Int!, $difficulty: Int!) {
      reportData {
        reports(guildName: $guild, guildServerSlug: $realm, guildServerRegion: $region, zoneID: $zoneId, limit: 40) {
          data {
            fights(difficulty: $difficulty) {
              encounterID
              kill
              bossPercentage
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          guild: params.guild,
          realm: params.realm,
          region: params.region,
          zoneId: params.zoneId,
          difficulty: params.difficulty,
        },
      }),
      next: { revalidate: 1800 }, // données mises en cache 30 min
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: {
        reportData?: {
          reports?: {
            data?: Array<{
              fights?: Array<{
                encounterID: number;
                kill: boolean | null;
                bossPercentage: number | null;
              }> | null;
            }>;
          };
        };
      };
    };

    const reports = json.data?.reportData?.reports?.data;
    if (!reports) return null;

    const map = new Map<number, BossProgress>();
    for (const report of reports) {
      for (const fight of report.fights ?? []) {
        if (!fight.encounterID) continue;
        const current = map.get(fight.encounterID) ?? {
          pulls: 0,
          bestPercent: 100,
          killed: false,
        };
        current.pulls += 1;
        if (fight.kill) current.killed = true;

        // bossPercentage = % de vie restante en fin de pull (plus bas = mieux).
        // WCL renvoie parfois une valeur ×100 (ex : 1234 = 12,34 %) : on normalise.
        let pct = fight.kill ? 0 : fight.bossPercentage ?? 100;
        if (pct > 100) pct = pct / 100;
        if (pct < current.bestPercent) current.bestPercent = pct;

        map.set(fight.encounterID, current);
      }
    }
    return map;
  } catch {
    return null;
  }
}
