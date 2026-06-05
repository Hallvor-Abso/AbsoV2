import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma du bot — lit la MÊME base que le site (architecture Option A,
 * cf. docs/BOT.md). Le client est généré par le site (`prisma generate`).
 *
 * Postgres derrière un pooler (PgBouncer en mode « transaction ») ne supporte
 * pas les prepared statements que Prisma crée par défaut → erreur intermittente
 * « prepared statement "sX" does not exist » (code 26000). On ajoute donc
 * `pgbouncer=true` à l'URL : Prisma désactive alors les prepared statements.
 * Sans effet néfaste sur une connexion directe.
 */
function poolerSafeUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || /[?&]pgbouncer=true/.test(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
}

const url = poolerSafeUrl();
export const prisma = url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient();
