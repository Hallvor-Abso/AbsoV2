import { PrismaClient } from '@prisma/client';

/**
 * Client Prisma du bot — lit la MÊME base que le site (architecture Option A,
 * cf. docs/BOT.md). Le client est généré par le site (`prisma generate`).
 */
export const prisma = new PrismaClient();
