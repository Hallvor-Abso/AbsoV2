import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma partagé (singleton).
 *
 * En développement, Next.js recharge le code à chaque modification, ce qui
 * créerait de nombreuses connexions à la base. On garde donc une seule
 * instance dans une variable globale pour éviter ce problème.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
