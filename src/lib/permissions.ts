import type { Role } from '@prisma/client';

/**
 * Droits & permissions — logique centrale des rôles.
 *
 * Rôles de base : VISITEUR < MEMBRE < ADMIN < SUPER_ADMIN.
 * En plus, un utilisateur peut être « admin d'un ou plusieurs jeux »
 * (adminGameIds) : c'est ce qui définit « Admin WoW », « Admin SWTOR », etc.
 * Ce système gère automatiquement tout futur jeu, sans changer le code.
 */

export type SessionUser = {
  id: string;
  name?: string | null;
  role: Role;
  adminGameIds: string[];
};

export const ROLE_LABELS: Record<Role, string> = {
  VISITEUR: 'Visiteur',
  MEMBRE: 'Membre',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

/** Est-ce un admin scopé à des jeux précis (et pas un admin global) ? */
export function isGameAdmin(u?: SessionUser | null): boolean {
  return !!u && u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN' && u.adminGameIds.length > 0;
}

/** Accès au panel d'administration (admin global OU admin d'au moins un jeu). */
export function canAccessAdmin(u?: SessionUser | null): boolean {
  return !!u && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' || u.adminGameIds.length > 0);
}

/** Membre ou plus (accès au Calendrier public, réservé aux membres). */
export function isMemberOrAbove(u?: SessionUser | null): boolean {
  return !!u && (u.role !== 'VISITEUR' || u.adminGameIds.length > 0);
}

export function canAccessCalendar(u?: SessionUser | null): boolean {
  return isMemberOrAbove(u);
}

/** Seul le Super Admin gère « Contenu du site ». */
export function canAccessContenu(u?: SessionUser | null): boolean {
  return !!u && u.role === 'SUPER_ADMIN';
}

/** Gestion globale (liste des jeux, gestion des membres) : Admin & Super Admin. */
export function canManageGlobally(u?: SessionUser | null): boolean {
  return !!u && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
}

/**
 * Jeux que l'utilisateur peut gérer :
 *  - 'all' pour un admin global / super admin
 *  - sinon la liste de ses jeux (admin de jeu)
 */
export function allowedGameIds(u?: SessionUser | null): 'all' | string[] {
  if (!u) return [];
  if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') return 'all';
  return u.adminGameIds;
}

/** Construit un filtre Prisma `{ gameId: { in: [...] } }` selon le périmètre. */
export function gameScopeFilter(u?: SessionUser | null): Record<string, unknown> {
  const scope = allowedGameIds(u);
  if (scope === 'all') return {};
  return { gameId: { in: scope } };
}
