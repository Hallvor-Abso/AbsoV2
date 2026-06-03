/**
 * Limiteur de débit (rate limiting) simple, en mémoire.
 *
 * Empêche un même visiteur de spammer le formulaire de candidature.
 * Note : la mémoire est propre à chaque instance serverless ; pour un site
 * de guilde le volume est faible, cette protection légère suffit largement.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  /** Nombre maximum de requêtes autorisées dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number;
}

/**
 * Retourne `true` si la requête est autorisée, `false` si la limite est atteinte.
 * @param key  identifiant du visiteur (ex : son adresse IP)
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): boolean {
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

/** Extrait une adresse IP exploitable depuis les en-têtes de la requête. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
