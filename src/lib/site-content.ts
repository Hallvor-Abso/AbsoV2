import { prisma } from './prisma';
import { IS_DEMO } from './env';

/**
 * Contenu statique éditable de la homepage.
 *
 * Chaque entrée a une CLÉ (utilisée en base) et une valeur par défaut.
 * Si l'admin n'a rien personnalisé, c'est la valeur par défaut qui s'affiche.
 * Pour ajouter un nouveau texte éditable, ajoute simplement une ligne ici.
 */
export const SITE_CONTENT_DEFAULTS = {
  'site.logoUrl': '', // logo de la guilde (vide = logo texte par défaut)
  'site.discordUrl': 'https://discord.gg/', // lien d'invitation Discord
  'hero.tagline': 'Progression. Cohésion. Excellence.',
  'hero.subtitle':
    'Absolution est une guilde semi-hardcore dédiée au contenu haut-niveau. Nous visons l’excellence sans sacrifier le plaisir de jouer ensemble.',
  'about.title': 'Qui sommes-nous',
  'about.body':
    'Fondée par des joueurs vétérans, Absolution rassemble des passionnés du contenu PvE de haut niveau. Notre approche semi-hardcore conjugue exigence de performance et respect du temps de chacun : des raids structurés, une préparation sérieuse, une ambiance mature.',
  'philosophy.title': 'Notre philosophie',
  'philosophy.body':
    'Nous croyons qu’une progression durable repose sur trois piliers : la rigueur individuelle, la cohésion de groupe et une communication saine. Chaque membre est tenu de venir préparé, à l’écoute, et investi dans la réussite collective.',
} as const;

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS;

/**
 * Récupère TOUT le contenu statique sous forme d'objet, en complétant
 * avec les valeurs par défaut pour les clés non encore personnalisées.
 */
export async function getSiteContent(): Promise<Record<string, string>> {
  // En mode démo (pas de base), on renvoie simplement les textes par défaut.
  if (IS_DEMO) return { ...SITE_CONTENT_DEFAULTS };

  const rows = await prisma.siteContent.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...SITE_CONTENT_DEFAULTS, ...overrides };
}
