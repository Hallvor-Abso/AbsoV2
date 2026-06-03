import { prisma } from './prisma';

/**
 * Fonctions de lecture des données pour les pages PUBLIQUES.
 *
 * RÈGLE DE SÉCURITÉ CENTRALE : un jeu désactivé (isActive = false) ne doit
 * JAMAIS apparaître sur le site public. Tous les filtres ci-dessous excluent
 * donc systématiquement les jeux inactifs côté serveur.
 */

/** Jeux actifs sur lesquels la guilde évolue (isActive = true & ACTIVE). */
export function getActiveGames() {
  return prisma.game.findMany({
    where: { isActive: true, status: 'ACTIVE' },
    orderBy: { order: 'asc' },
  });
}

/** Jeux à venir visibles publiquement (isActive = true & UPCOMING). */
export function getUpcomingGames() {
  return prisma.game.findMany({
    where: { isActive: true, status: 'UPCOMING' },
    orderBy: { order: 'asc' },
  });
}

/** Tous les jeux visibles (actifs + à venir), pour la navigation. */
export function getVisibleGames() {
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
}

/** Récupère un jeu visible par son slug, ou null s'il est masqué/inexistant. */
export function getVisibleGameBySlug(slug: string) {
  return prisma.game.findFirst({
    where: { slug, isActive: true },
  });
}

/** Progression complète (tiers + boss) d'un jeu actif donné. */
export function getGameProgression(gameId: string) {
  return prisma.raidTier.findMany({
    where: { gameId },
    orderBy: { order: 'asc' },
    include: {
      bosses: { orderBy: { order: 'asc' } },
    },
  });
}

/** Derniers boss tués (toutes guildes actives confondues) pour la homepage. */
export function getRecentKills(limit = 5) {
  return prisma.boss.findMany({
    where: {
      status: 'KILLED',
      firstKillDate: { not: null },
      tier: { game: { isActive: true } },
    },
    orderBy: { firstKillDate: 'desc' },
    take: limit,
    include: { tier: { include: { game: true } } },
  });
}

/** Postes de recrutement ouverts/limités des jeux actifs. */
export function getRecruitmentSlots() {
  return prisma.recruitmentSlot.findMany({
    where: { game: { isActive: true } },
    orderBy: { order: 'asc' },
    include: { game: true },
  });
}

/** Liste des news publiées (optionnellement filtrées par jeu). */
export function getPublishedNews(gameSlug?: string) {
  return prisma.news.findMany({
    where: {
      status: 'PUBLISHED',
      ...(gameSlug ? { game: { slug: gameSlug, isActive: true } } : {}),
      // On exclut les news rattachées à un jeu désactivé.
      OR: [{ gameId: null }, { game: { isActive: true } }],
    },
    orderBy: { publishedAt: 'desc' },
    include: { game: true },
  });
}

/** Récupère un article publié par son slug. */
export function getPublishedNewsBySlug(slug: string) {
  return prisma.news.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { game: true },
  });
}

/** Événements de calendrier des jeux actifs. */
export function getEvents() {
  return prisma.event.findMany({
    where: { game: { isActive: true } },
    orderBy: { startDate: 'asc' },
    include: { game: true },
  });
}
