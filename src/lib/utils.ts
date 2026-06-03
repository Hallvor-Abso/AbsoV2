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

/** Formate une date en français lisible (ex : "12 mars 2025"). */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
