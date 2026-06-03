/**
 * Libellés français et couleurs associés aux statuts (enums Prisma).
 * Centralisés ici pour rester cohérents entre le site public et l'admin.
 */

export const BOSS_STATUS = {
  KILLED: { label: 'Tué', color: 'text-accent', dot: 'bg-accent' },
  PROGRESSING: { label: 'En progression', color: 'text-amber-300', dot: 'bg-amber-400' },
  UNTESTED: { label: 'Non tenté', color: 'text-muted', dot: 'bg-muted' },
} as const;

export const SLOT_STATUS = {
  OPEN: { label: 'Ouvert', badge: 'bg-accent/15 text-accent border-accent/40' },
  LIMITED: { label: 'Limité', badge: 'bg-amber-400/10 text-amber-300 border-amber-400/30' },
  CLOSED: { label: 'Fermé', badge: 'bg-white/5 text-muted border-border' },
} as const;

export const APPLICATION_STATUS = {
  PENDING: { label: 'En attente', badge: 'bg-white/5 text-muted border-border' },
  DISCUSSING: { label: 'En discussion', badge: 'bg-accent/15 text-accent border-accent/40' },
  ACCEPTED: { label: 'Acceptée', badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' },
  REJECTED: { label: 'Refusée', badge: 'bg-red-400/10 text-red-300 border-red-400/30' },
} as const;

export const NEWS_STATUS = {
  DRAFT: { label: 'Brouillon' },
  PUBLISHED: { label: 'Publié' },
} as const;

export const GAME_STATUS = {
  ACTIVE: { label: 'Actif' },
  UPCOMING: { label: 'À venir' },
} as const;

export const EVENT_TYPE = {
  RAID: { label: 'Raid' },
  EVENT: { label: 'Événement' },
  OTHER: { label: 'Autre' },
} as const;
