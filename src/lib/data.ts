import { prisma } from './prisma';
import { IS_DEMO } from './env';
import * as demo from './demo-data';

/**
 * Fonctions de lecture des données pour les pages PUBLIQUES.
 *
 * RÈGLE DE SÉCURITÉ CENTRALE : un jeu désactivé (isActive = false) ne doit
 * JAMAIS apparaître sur le site public. Tous les filtres ci-dessous excluent
 * donc systématiquement les jeux inactifs côté serveur.
 *
 * MODE DÉMO : si aucune base de données n'est configurée (IS_DEMO), on renvoie
 * des données d'exemple afin de pouvoir prévisualiser le design sans installer
 * de base. Dès qu'une vraie base est branchée, ce mode se désactive tout seul.
 */

/** Jeux actifs sur lesquels la guilde évolue (isActive = true & ACTIVE). */
export function getActiveGames() {
  if (IS_DEMO) return Promise.resolve(demo.demoActiveGames());
  return prisma.game.findMany({
    where: { isActive: true, status: 'ACTIVE' },
    orderBy: { order: 'asc' },
  });
}

/** Jeux à venir visibles publiquement (isActive = true & UPCOMING). */
export function getUpcomingGames() {
  if (IS_DEMO) return Promise.resolve(demo.demoUpcomingGames());
  return prisma.game.findMany({
    where: { isActive: true, status: 'UPCOMING' },
    orderBy: { order: 'asc' },
  });
}

/** Tous les jeux visibles (actifs + à venir), pour la navigation. */
export function getVisibleGames() {
  if (IS_DEMO) return Promise.resolve(demo.demoVisibleGames());
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
  });
}

/** Récupère un jeu visible par son slug, ou null s'il est masqué/inexistant. */
export function getVisibleGameBySlug(slug: string) {
  if (IS_DEMO) return Promise.resolve(demo.demoGameBySlug(slug));
  return prisma.game.findFirst({
    where: { slug, isActive: true },
  });
}

/** Progression complète (tiers + boss) d'un jeu actif donné. */
export function getGameProgression(gameId: string) {
  if (IS_DEMO) return Promise.resolve(demo.demoProgression(gameId));
  return prisma.raidTier.findMany({
    where: { gameId },
    // Chronologique : le contenu le plus récent (dernier ajouté) en premier.
    orderBy: { createdAt: 'desc' },
    include: {
      bosses: { orderBy: { order: 'asc' } },
    },
  });
}

/** Derniers boss tués (toutes guildes actives confondues) pour la homepage. */
export function getRecentKills(limit = 5) {
  if (IS_DEMO) return Promise.resolve(demo.demoRecentKills(limit));
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
  if (IS_DEMO) return Promise.resolve(demo.demoSlots());
  return prisma.recruitmentSlot.findMany({
    where: { game: { isActive: true } },
    orderBy: { order: 'asc' },
    include: { game: true },
  });
}

/** Catégories de rôle (avec description) des jeux actifs. */
export function getRecruitmentRoles() {
  if (IS_DEMO) return Promise.resolve(demo.demoRoles());
  return prisma.recruitmentRole.findMany({
    where: { game: { isActive: true } },
    orderBy: { order: 'asc' },
  });
}

/** Champs personnalisés des formulaires de candidature (jeux actifs). */
export function getRecruitmentFields() {
  if (IS_DEMO) return Promise.resolve([]);
  return prisma.recruitmentField.findMany({
    where: { game: { isActive: true } },
    orderBy: { order: 'asc' },
  });
}

/** Liste des news publiées (optionnellement filtrées par jeu). */
export function getPublishedNews(gameSlug?: string) {
  if (IS_DEMO) return Promise.resolve(demo.demoNews(gameSlug));
  return prisma.news.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() }, // exclut les articles programmés (futurs)
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
  if (IS_DEMO) return Promise.resolve(demo.demoNewsBySlug(slug));
  return prisma.news.findFirst({
    where: { slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    include: { game: true },
  });
}

/** Événements de calendrier des jeux actifs. */
export function getEvents() {
  if (IS_DEMO) return Promise.resolve(demo.demoEvents());
  return prisma.event.findMany({
    where: { game: { isActive: true } },
    orderBy: { startDate: 'asc' },
    include: {
      game: true,
      signups: {
        select: { discordId: true, displayName: true, status: true, role: true, className: true, spec: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}
