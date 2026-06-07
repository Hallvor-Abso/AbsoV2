import { z } from 'zod';

/**
 * Schémas de validation (zod).
 * Ils garantissent que les données reçues par l'API sont complètes et correctes
 * avant d'être enregistrées en base.
 */

// Inscription d'un compte visiteur
export const registerSchema = z.object({
  displayName: z.string().min(2, 'Pseudo trop court').max(40),
  email: z.string().email('Email invalide').max(120),
  discord: z.string().min(2, 'Identifiant Discord requis').max(60),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum').max(200),
});

// Formulaire public de candidature — partie fixe (identité + contact + jeu).
// Les autres champs sont dynamiques (constructeur par jeu) et validés à part
// d'après les définitions de `RecruitmentField` (voir lib/recruitment-fields).
export const applicationSchema = z.object({
  pseudo: z.string().min(2, 'Pseudo trop court').max(60),
  discord: z.string().min(2, 'Pseudo Discord requis').max(60),
  gameId: z.string().min(1, 'Jeu requis'),
  values: z.record(z.string(), z.string()).default({}),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

// Article de news (admin)
export const newsSchema = z.object({
  title: z.string().min(2).max(180),
  excerpt: z.string().max(400).optional().or(z.literal('')),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  gameId: z.string().optional().or(z.literal('')),
});

// Jeu (admin)
export const gameSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(60),
  logoUrl: z.string().url().optional().or(z.literal('')),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale attendue'),
  isActive: z.boolean(),
  status: z.enum(['ACTIVE', 'UPCOMING']),
  order: z.number().int().default(0),
});

// Événement du calendrier (admin)
export const eventSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().max(2000).optional().or(z.literal('')),
  startDate: z.string().min(1),
  endDate: z.string().optional().or(z.literal('')),
  type: z.string().default('RAID'),
  gameId: z.string().min(1),
});
