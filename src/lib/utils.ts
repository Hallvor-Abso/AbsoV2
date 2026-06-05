import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine des classes Tailwind intelligemment (fusionne les conflits).
 * Exemple : cn('px-2', condition && 'px-4') => 'px-4' si condition vraie.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforme un texte en "slug" utilisable dans une URL.
 * Ex : "Mon Super Article !" => "mon-super-article"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // sépare les accents des lettres
    .replace(/[̀-ͯ]/g, '') // supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // garde lettres, chiffres, espaces, tirets
    .replace(/\s+/g, '-') // espaces -> tirets
    .replace(/-+/g, '-'); // tirets multiples -> simple
}

/**
 * Palette de couleurs distinctes (lisibles sur fond sombre) pour différencier
 * visuellement les extensions de progression.
 */
const EXPANSION_PALETTE = [
  '#4A9EFF', // bleu
  '#A78BFA', // violet
  '#F472B6', // rose
  '#FB923C', // orange
  '#34D399', // émeraude
  '#FBBF24', // ambre
  '#22D3EE', // cyan
  '#F87171', // rouge
  '#A3E635', // lime
  '#E879F9', // fuchsia
  '#60A5FA', // bleu clair
  '#2DD4BF', // turquoise
];

/**
 * Couleur stable dérivée du nom d'une extension : même nom → même couleur,
 * noms différents → couleurs (quasi toujours) différentes. Insensible à la
 * casse et aux espaces de bord.
 */
export function expansionColor(name: string): string {
  const key = name.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return EXPANSION_PALETTE[Math.abs(hash) % EXPANSION_PALETTE.length];
}

/** Formate une date en français lisible (ex : "12 mars 2025"). */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
