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
  /** Grades Discord synchronisés : « gm », « membre:<gameId> », « recrue:<gameId> »… */
  discordRoles: string[];
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

/** Seul le Super Admin accède au hub des overlays de stream. */
export function canAccessOverlays(u?: SessionUser | null): boolean {
  return !!u && u.role === 'SUPER_ADMIN';
}

/** Page « Effectif » : réservée au Super Admin pour l'instant. */
export function canAccessRoster(u?: SessionUser | null): boolean {
  return !!u && u.role === 'SUPER_ADMIN';
}

// --- Visibilité pilotée par les GRADES DISCORD (par jeu) ---------------------

/** « Membre » et au-dessus d'un jeu (donc déjà dans la guilde). */
const MEMBER_KINDS = new Set(['membre', 'roster', 'officier']);
/** « Recrue » et au-dessus : donne accès au calendrier du jeu concerné. */
const CALENDAR_KINDS = new Set(['recrue', 'membre', 'roster', 'officier']);

function parseRoleKey(key: string): { kind: string; gameId: string | null } {
  const [kind, gameId] = key.split(':');
  return { kind, gameId: gameId ?? null };
}

/** A-t-il un grade « Membre+ » (ou GM) sur au moins un jeu ? (= membre de la guilde) */
export function isGuildMemberDiscord(u?: SessionUser | null): boolean {
  if (!u) return false;
  return (u.discordRoles ?? []).some((k) => {
    const { kind } = parseRoleKey(k);
    return kind === 'gm' || MEMBER_KINDS.has(kind);
  });
}

/** A-t-il accès au calendrier d'AU MOINS un jeu ? (pour afficher le lien de nav) */
export function hasAnyCalendarAccess(u?: SessionUser | null): boolean {
  if (!u) return false;
  if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.adminGameIds.length > 0) return true;
  return (u.discordRoles ?? []).some((k) => {
    const { kind, gameId } = parseRoleKey(k);
    return kind === 'gm' || (!!gameId && CALENDAR_KINDS.has(kind));
  });
}

/** Liste des jeux dont l'utilisateur voit le calendrier (parmi `allGameIds`). */
export function calendarGameIds(u: SessionUser | null | undefined, allGameIds: string[]): string[] {
  if (!u) return [];
  const roles = u.discordRoles ?? [];
  // Admins (globaux ou de jeu) et GM voient tout.
  if (u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || roles.includes('gm')) {
    return [...allGameIds];
  }
  const out = new Set(u.adminGameIds.filter((id) => allGameIds.includes(id)));
  for (const k of roles) {
    const { kind, gameId } = parseRoleKey(k);
    if (gameId && CALENDAR_KINDS.has(kind) && allGameIds.includes(gameId)) out.add(gameId);
  }
  return [...out];
}

/**
 * « Mes candidatures » : réservé à ceux qui ne sont PAS encore membres de la
 * guilde (d'après leurs grades Discord). Le Super Admin garde l'accès.
 */
export function canAccessApplications(u?: SessionUser | null): boolean {
  return !!u && (u.role === 'SUPER_ADMIN' || !isGuildMemberDiscord(u));
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
