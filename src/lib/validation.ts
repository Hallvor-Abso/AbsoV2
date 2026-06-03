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

// Formulaire public de candidature
export const applicationSchema = z.object({
  pseudo: z.string().min(2, 'Pseudo trop court').max(60),
  characterId: z.string().max(80).optional().or(z.literal('')),
  className: z.string().min(1, 'Classe requise').max(60),
  role: z.string().min(1, 'Rôle requis').max(60),
  server: z.string().min(1, 'Serveur requis').max(80),
  experience: z.string().min(5, 'Décris ton expérience').max(4000),
  availability: z.string().min(2, 'Indique tes disponibilités').max(1000),
  logsUrl: z.string().url('Lien invalide').max(500).optional().or(z.literal('')),
  motivation: z.string().min(10, 'Développe ta motivation').max(4000),
  gameId: z.string().min(1, 'Jeu requis'),
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
