'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Fournit le contexte de session NextAuth.
 *
 * - refetchInterval : la session est revérifiée toutes les 60 s (le rôle est
 *   relu en base) → un changement de rôle se reflète vite, sans reconnexion.
 * - refetchOnWindowFocus : revérifie aussi dès qu'on revient sur l'onglet.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}
