'use client';

import { useState } from 'react';
import Link from 'next/link';
import { runSetup, type SetupResult } from '@/app/setup/actions';

/**
 * Bouton d'initialisation du site (page /setup).
 * Lance la création du compte admin + des données de départ, puis affiche le
 * résultat. Aucun terminal nécessaire.
 */
export function SetupButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResult | null>(null);

  async function handleClick() {
    setLoading(true);
    const res = await runSetup();
    setResult(res);
    setLoading(false);
  }

  if (result && (result.status === 'done' || result.status === 'already')) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          ✓
        </div>
        <p className="text-foreground">{result.message}</p>
        <Link href="/admin/login" className="btn-primary">
          Aller à l’espace admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Initialisation…' : 'Initialiser le site'}
      </button>

      {result && (result.status === 'demo' || result.status === 'error') && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {result.message}
        </p>
      )}
    </div>
  );
}
