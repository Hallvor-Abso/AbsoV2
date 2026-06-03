'use server';

import { prisma } from '@/lib/prisma';
import { seedDatabase, isDatabaseInitialized } from '@/lib/setup';
import { IS_DEMO } from '@/lib/env';

export type SetupResult = {
  status: 'done' | 'already' | 'demo' | 'error';
  message: string;
  username?: string;
};

/**
 * Initialise le site : crée le compte admin + les données de départ.
 * Sécurité : ne fait rien si la base contient déjà un compte (évite tout abus
 * et toute réinitialisation accidentelle des données).
 */
export async function runSetup(): Promise<SetupResult> {
  if (IS_DEMO) {
    return {
      status: 'demo',
      message:
        "Aucune base de données n'est configurée (mode démo). Ajoute d'abord les variables DATABASE_URL et DIRECT_URL dans Vercel.",
    };
  }

  try {
    if (await isDatabaseInitialized(prisma)) {
      return {
        status: 'already',
        message: 'Le site est déjà initialisé. Tu peux te connecter à l’espace admin.',
      };
    }

    const { username } = await seedDatabase(prisma);
    return {
      status: 'done',
      username,
      message: 'Initialisation réussie ! Ton compte admin et les données de départ ont été créés.',
    };
  } catch (e) {
    return {
      status: 'error',
      message:
        "La base de données n'est pas joignable ou pas encore prête. Vérifie DATABASE_URL/DIRECT_URL dans Vercel, attends la fin du déploiement, puis réessaie. Détail : " +
        (e instanceof Error ? e.message : 'erreur inconnue'),
    };
  }
}
