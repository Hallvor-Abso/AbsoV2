'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Limite d'erreur globale : remplace le crash brut par un écran soigné si une
 * page lève une exception (ex. coupure de la base de données).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center text-center">
      <p className="text-6xl">⚡</p>
      <h1 className="mt-4 text-2xl font-bold text-title">Une erreur est survenue</h1>
      <p className="mt-2 max-w-md text-muted">
        Quelque chose s’est mal passé de notre côté. Réessaie dans un instant.
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Réessayer
        </button>
        <Link href="/" className="btn-secondary">
          Accueil
        </Link>
      </div>
    </div>
  );
}
