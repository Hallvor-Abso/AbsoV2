/**
 * SEED — Données de départ (version ligne de commande).
 *
 * Remplit la base avec un compte admin + des données d'exemple (jeux, news,
 * progression, recrutement, calendrier). La logique est partagée avec la page
 * web d'initialisation /api/setup (voir src/lib/setup.ts).
 *
 * Lancé par `npm run setup` ou `npm run db:seed`.
 */
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/lib/setup';

const prisma = new PrismaClient();

seedDatabase(prisma)
  .then(({ username }) => {
    console.log(`🎉 Seed terminé ! Compte admin : "${username}"`);
  })
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
