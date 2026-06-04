/**
 * Limiteur de débit (rate limiting).
 *
 * Deux backends :
 *  - **Upstash Redis** (REST) si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *    sont définis → protection RÉELLE et partagée entre toutes les instances
 *    serverless (recommandé en production sur Vercel).
 *  - **Mémoire** sinon → suffisant en local/démo, mais propre à chaque instance.
 *
 * Aucune dépendance externe : Upstash est appelé via son API REST (fetch).
 */

interface RateLimitOptions {
  /** Nombre maximum de requêtes autorisées dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// --- Backend Upstash (compteur à fenêtre fixe : INCR + PEXPIRE) -------------
async function upstashCommand(parts: (string | number)[]): Promise<unknown> {
  const path = parts.map((p) => encodeURIComponent(String(p))).join('/');
  const res = await fetch(`${UPSTASH_URL}/${path}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  return (await res.json()).result;
}

async function rateLimitUpstash(key: string, limit: number, windowMs: number): Promise<boolean> {
  const k = `rl:${key}`;
  const count = (await upstashCommand(['INCR', k])) as number;
  if (count === 1) await upstashCommand(['PEXPIRE', k, windowMs]);
  return count <= limit;
}

// --- Backend mémoire (fallback) ---------------------------------------------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Retourne `true` si la requête est autorisée, `false` si la limite est atteinte.
 * @param key  identifiant du visiteur (ex : son adresse IP)
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<boolean> {
  if (useUpstash) {
    try {
      return await rateLimitUpstash(key, limit, windowMs);
    } catch {
      // Panne Upstash : on retombe sur la mémoire plutôt que de bloquer le site.
    }
  }
  return rateLimitMemory(key, limit, windowMs);
}

/** Extrait une adresse IP exploitable depuis des en-têtes (Headers ou objet). */
export function getClientIp(headers: Headers | Record<string, string | undefined>): string {
  const get = (name: string) =>
    headers instanceof Headers ? headers.get(name) : headers[name];
  return (
    get('x-forwarded-for')?.split(',')[0]?.trim() ||
    get('x-real-ip') ||
    'unknown'
  );
}
