import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Logique d'initialisation de la base (compte admin + données de départ).
 *
 * Utilisée à DEUX endroits :
 *  - le script en ligne de commande `npm run db:seed` (prisma/seed.ts)
 *  - la page web d'initialisation `/api/setup` (pour configurer sans terminal)
 *
 * Idempotente : on peut la relancer sans créer de doublons.
 */
export async function seedDatabase(prisma: PrismaClient) {
  // --- 1. Compte administrateur ------------------------------------------
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'change-moi-immédiatement';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: 'SUPER_ADMIN' },
    create: { username, passwordHash, role: 'SUPER_ADMIN' },
  });

  // --- 2. Jeux ------------------------------------------------------------
  const wow = await prisma.game.upsert({
    where: { slug: 'wow' },
    update: {},
    create: {
      name: 'World of Warcraft',
      slug: 'wow',
      color: '#4A9EFF',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/World_of_Warcraft_logo.svg/512px-World_of_Warcraft_logo.svg.png',
      coverImageUrl:
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1600&auto=format&fit=crop',
      isActive: true,
      status: 'ACTIVE',
      order: 0,
    },
  });

  const swtor = await prisma.game.upsert({
    where: { slug: 'swtor' },
    update: {},
    create: {
      name: 'Star Wars: The Old Republic',
      slug: 'swtor',
      color: '#4A9EFF',
      logoUrl: '',
      coverImageUrl:
        'https://images.unsplash.com/photo-1547036967-23d11aacaee0?q=80&w=1600&auto=format&fit=crop',
      isActive: true,
      status: 'UPCOMING',
      order: 1,
    },
  });

  // --- 3. Progression WoW (tier + boss) -----------------------------------
  await prisma.raidTier.deleteMany({
    where: { gameId: wow.id, name: 'Liberation of Undermine' },
  });
  await prisma.raidTier.create({
    data: {
      name: 'Liberation of Undermine',
      order: 0,
      gameId: wow.id,
      bosses: {
        create: [
          { name: 'Vexie and the Geargrinders', status: 'KILLED', firstKillDate: new Date('2025-03-10'), order: 0 },
          { name: 'Cauldron of Carnage', status: 'KILLED', firstKillDate: new Date('2025-03-12'), order: 1 },
          { name: 'Rik Reverb', status: 'KILLED', firstKillDate: new Date('2025-03-18'), order: 2 },
          { name: 'Stix Bunkjunker', status: 'KILLED', firstKillDate: new Date('2025-03-25'), order: 3 },
          { name: 'Sprocketmonger Lockenstock', status: 'PROGRESSING', order: 4 },
          { name: 'One-Armed Bandit', status: 'UNTESTED', order: 5 },
          { name: 'Mug’Zee', status: 'UNTESTED', order: 6 },
          { name: 'Chrome King Gallywix', status: 'UNTESTED', order: 7 },
        ],
      },
    },
  });

  // --- 4. Postes de recrutement ------------------------------------------
  await prisma.recruitmentSlot.deleteMany({ where: { gameId: wow.id } });
  await prisma.recruitmentSlot.createMany({
    data: [
      { gameId: wow.id, role: 'Tank', className: 'Chevalier de la mort', status: 'CLOSED', order: 0 },
      { gameId: wow.id, role: 'Heal', className: 'Prêtre Discipline', status: 'OPEN', order: 1 },
      { gameId: wow.id, role: 'Heal', className: 'Chaman Restauration', status: 'LIMITED', order: 2 },
      { gameId: wow.id, role: 'DPS Distance', className: 'Mage', status: 'OPEN', order: 3 },
      { gameId: wow.id, role: 'DPS Mêlée', className: 'Chasseur de démons', status: 'LIMITED', order: 4 },
      { gameId: wow.id, role: 'DPS Mêlée', className: 'Voleur', status: 'CLOSED', order: 5 },
    ],
  });

  // --- 5. News d'exemple --------------------------------------------------
  await prisma.news.upsert({
    where: { slug: 'bienvenue-sur-le-nouveau-site' },
    update: {},
    create: {
      title: 'Bienvenue sur le nouveau site d’Absolution',
      slug: 'bienvenue-sur-le-nouveau-site',
      excerpt: 'Un nouvel espace pour suivre notre progression, nos recrutements et l’actualité de la guilde.',
      content:
        '<p>Nous sommes fiers de vous présenter le nouveau site officiel d’<strong>Absolution</strong>. Vous y retrouverez notre progression en temps réel, nos postes de recrutement ouverts et toute l’actualité de la guilde.</p><p>Notre objectif reste inchangé : viser l’excellence dans le contenu haut-niveau, tout en cultivant une communauté mature et soudée.</p>',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
      featured: true,
      status: 'PUBLISHED',
      publishedAt: new Date('2025-03-01'),
      gameId: wow.id,
    },
  });
  await prisma.news.upsert({
    where: { slug: 'absolution-arrive-sur-swtor' },
    update: {},
    create: {
      title: 'Absolution prépare son arrivée sur SWTOR',
      slug: 'absolution-arrive-sur-swtor',
      excerpt: 'La guilde étend ses horizons : un roster SWTOR est en préparation pour le contenu opérationnel haut-niveau.',
      content:
        '<p>Forte de son expérience sur World of Warcraft, la guilde <strong>Absolution</strong> annonce le lancement d’un projet sur <em>Star Wars: The Old Republic</em>.</p><p>Nous recherchons des joueurs motivés pour bâtir un roster compétitif dès l’ouverture. Les candidatures ouvriront prochainement.</p>',
      imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1600&auto=format&fit=crop',
      status: 'PUBLISHED',
      publishedAt: new Date('2025-03-20'),
      gameId: swtor.id,
    },
  });

  // --- 6. Événements de calendrier ---------------------------------------
  await prisma.event.deleteMany({ where: { gameId: wow.id } });
  const now = new Date();
  const at = (day: number, hour: number) =>
    new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0);
  await prisma.event.createMany({
    data: [
      { gameId: wow.id, title: 'Raid Mythique', description: 'Progression sur Sprocketmonger Lockenstock.', startDate: at(now.getDate() + 1, 20), endDate: at(now.getDate() + 1, 23), type: 'RAID' },
      { gameId: wow.id, title: 'Raid Mythique', description: 'Suite de la progression.', startDate: at(now.getDate() + 3, 20), endDate: at(now.getDate() + 3, 23), type: 'RAID' },
      { gameId: wow.id, title: 'Soirée Mythique+', description: 'Clés haut-niveau en groupes.', startDate: at(now.getDate() + 5, 21), type: 'EVENT' },
    ],
  });

  return { username };
}

/** Vrai si la base ne contient encore aucun compte admin (jamais initialisée). */
export async function isDatabaseInitialized(prisma: PrismaClient): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}
