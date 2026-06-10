/**
 * DONNÉES DE DÉMONSTRATION (mode design).
 *
 * Ces données servent UNIQUEMENT quand aucune base de données n'est configurée
 * (variable d'environnement DATABASE_URL absente). Elles permettent de
 * prévisualiser le design du site sans installer Supabase.
 *
 * Dès qu'une vraie base est branchée, ce fichier n'est plus utilisé : les
 * données proviennent alors de la base (via src/lib/data.ts).
 */

// On reproduit les formes d'objets renvoyées par Prisma (dates incluses).
const now = new Date();
const d = (offsetDays: number) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, 20, 0, 0);

// Image d'exemple pour les boss vaincus (en mode démo uniquement).
const bossImg =
  'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=600&auto=format&fit=crop';

const wow = {
  id: 'demo-wow',
  name: 'World of Warcraft',
  slug: 'wow',
  // Pas de logo en démo : l'ancienne URL Wikimedia renvoie 403 (hotlink bloqué).
  // Sans logo, l'onglet retombe proprement sur la pastille de couleur.
  logoUrl: '',
  coverImageUrl:
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1600&auto=format&fit=crop',
  color: '#4A9EFF',
  isActive: true,
  status: 'ACTIVE' as const,
  order: 0,
  createdAt: now,
  updatedAt: now,
};

const swtor = {
  id: 'demo-swtor',
  name: 'Star Wars: The Old Republic',
  slug: 'swtor',
  logoUrl: '',
  coverImageUrl:
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?q=80&w=1600&auto=format&fit=crop',
  color: '#4A9EFF',
  isActive: true,
  status: 'UPCOMING' as const,
  order: 1,
  createdAt: now,
  updatedAt: now,
};

const wowTier = {
  id: 'demo-tier-1',
  name: 'Liberation of Undermine',
  order: 0,
  expansion: 'The War Within',
  zoneId: null,
  timerDone: false,
  gameId: wow.id,
  createdAt: now,
  updatedAt: now,
  bosses: [
    { id: 'b1', name: 'Vexie and the Geargrinders', status: 'KILLED' as const, firstKillDate: d(-60), order: 0, imageUrl: bossImg },
    { id: 'b2', name: 'Cauldron of Carnage', status: 'KILLED' as const, firstKillDate: d(-58), order: 1, imageUrl: bossImg },
    { id: 'b3', name: 'Rik Reverb', status: 'KILLED' as const, firstKillDate: d(-52), order: 2, imageUrl: bossImg },
    { id: 'b4', name: 'Stix Bunkjunker', status: 'KILLED' as const, firstKillDate: d(-45), order: 3, imageUrl: bossImg },
    { id: 'b5', name: 'Sprocketmonger Lockenstock', status: 'PROGRESSING' as const, firstKillDate: null, order: 4, imageUrl: null },
    { id: 'b6', name: 'One-Armed Bandit', status: 'UNTESTED' as const, firstKillDate: null, order: 5, imageUrl: null },
    { id: 'b7', name: 'Mug’Zee', status: 'UNTESTED' as const, firstKillDate: null, order: 6, imageUrl: null },
    { id: 'b8', name: 'Chrome King Gallywix', status: 'UNTESTED' as const, firstKillDate: null, order: 7, imageUrl: null },
  ].map((b) => ({ ...b, encounterId: null, tierId: 'demo-tier-1', createdAt: now, updatedAt: now })),
};

const slots = [
  { id: 's1', role: 'Tank', className: 'Chevalier de la mort', status: 'CLOSED' as const, note: null, order: 0, gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 's2', role: 'Heal', className: 'Prêtre Discipline', status: 'OPEN' as const, note: null, order: 1, gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 's3', role: 'Heal', className: 'Chaman Restauration', status: 'LIMITED' as const, note: null, order: 2, gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 's4', role: 'DPS Distance', className: 'Mage', status: 'OPEN' as const, note: null, order: 3, gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 's5', role: 'DPS Mêlée', className: 'Chasseur de démons', status: 'LIMITED' as const, note: null, order: 4, gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
];

const roles = [
  { id: 'r1', name: 'Tank', description: 'Roster complet — nous gardons les candidatures d’exception.', order: 0, gameId: wow.id },
  { id: 'r2', name: 'Heal', description: 'Une place à pourvoir pour compléter le pool de soigneurs mythique.', order: 1, gameId: wow.id },
  { id: 'r3', name: 'DPS Distance', description: null, order: 2, gameId: wow.id },
  { id: 'r4', name: 'DPS Mêlée', description: null, order: 3, gameId: wow.id },
];

const news = [
  {
    id: 'n1',
    title: 'Bienvenue sur le nouveau site d’Absolution',
    slug: 'bienvenue-sur-le-nouveau-site',
    excerpt: 'Un nouvel espace pour suivre notre progression, nos recrutements et l’actualité de la guilde.',
    content:
      '<p>Nous sommes fiers de vous présenter le nouveau site officiel d’<strong>Absolution</strong>. Vous y retrouverez notre progression en temps réel, nos postes de recrutement ouverts et toute l’actualité de la guilde.</p><p>Notre objectif reste inchangé : viser l’excellence dans le contenu haut niveau, tout en cultivant une communauté mature et soudée.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
    imageFit: 'cover',
    featured: true,
    status: 'PUBLISHED' as const,
    publishedAt: d(-30),
    gameId: wow.id,
    game: wow,
    createdAt: d(-30),
    updatedAt: d(-30),
  },
  {
    id: 'n2',
    title: 'Absolution prépare son arrivée sur SWTOR',
    slug: 'absolution-arrive-sur-swtor',
    excerpt: 'La guilde étend ses horizons : un roster SWTOR est en préparation pour le contenu opérationnel haut niveau.',
    content:
      '<p>Forte de son expérience sur World of Warcraft, la guilde <strong>Absolution</strong> annonce le lancement d’un projet sur <em>Star Wars: The Old Republic</em>.</p><p>Nous recherchons des joueurs motivés pour bâtir un roster compétitif dès l’ouverture.</p>',
    imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=1600&auto=format&fit=crop',
    imageFit: 'cover',
    featured: false,
    status: 'PUBLISHED' as const,
    publishedAt: d(-10),
    gameId: swtor.id,
    game: swtor,
    createdAt: d(-10),
    updatedAt: d(-10),
  },
];

const events = [
  { id: 'e1', title: 'Raid Mythique', description: 'Progression sur Sprocketmonger Lockenstock.', startDate: d(1), endDate: d(1), type: 'RAID', gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 'e2', title: 'Raid Mythique', description: 'Suite de la progression.', startDate: d(3), endDate: d(3), type: 'RAID', gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
  { id: 'e3', title: 'Soirée Mythique+', description: 'Clés haut niveau en groupes.', startDate: d(5), endDate: null, type: 'EVENT', gameId: wow.id, game: wow, createdAt: now, updatedAt: now },
];

// --- "API" du mode démo : mêmes signatures que src/lib/data.ts -------------
export const demoActiveGames = () => [wow];
export const demoUpcomingGames = () => [swtor];
export const demoVisibleGames = () => [wow, swtor];
export const demoGameBySlug = (slug: string) => [wow, swtor].find((g) => g.slug === slug) ?? null;
export const demoProgression = (gameId: string) => (gameId === wow.id ? [wowTier] : []);
export const demoRecentKills = (limit: number) =>
  wowTier.bosses
    .filter((b) => b.status === 'KILLED' && b.firstKillDate)
    .sort((a, b) => (b.firstKillDate!.getTime() - a.firstKillDate!.getTime()))
    .slice(0, limit)
    .map((b) => ({ ...b, tier: { ...wowTier, game: wow } }));
export const demoSlots = () => slots;
export const demoRoles = () => roles;
export const demoNews = (gameSlug?: string) =>
  gameSlug ? news.filter((n) => n.game?.slug === gameSlug) : news;
export const demoNewsBySlug = (slug: string) => news.find((n) => n.slug === slug) ?? null;
export const demoEvents = () => events;
