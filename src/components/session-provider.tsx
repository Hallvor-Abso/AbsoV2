'use client';

import { SessionProvider } from 'next-auth/react';

/** Fournit le contexte de session NextAuth aux composants client de l'admin. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
