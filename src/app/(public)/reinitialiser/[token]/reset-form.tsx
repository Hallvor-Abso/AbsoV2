'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../../auth-actions';

/** Formulaire de choix d'un nouveau mot de passe (jeton dans l'URL). */
export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('token', token);
    const res = await resetPassword(fd);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push('/connexion'), 1800);
    } else {
      setError(res.message);
    }
  }

  if (done) {
    return (
      <div className="card w-full max-w-sm p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-title">C'est fait ✅</h1>
        <p className="mt-2 text-sm text-muted">
          Ton mot de passe a été mis à jour. Redirection vers la connexion…
        </p>
        <Link href="/connexion" className="mt-4 inline-block font-medium text-accent hover:text-accent-deep">
          Se connecter maintenant
        </Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-center font-display text-2xl font-bold text-title">Nouveau mot de passe</h1>
      <p className="mb-6 mt-1 text-center text-sm text-muted">Choisis un nouveau mot de passe (8 caractères min).</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">Nouveau mot de passe</label>
          <input id="password" name="password" type="password" required minLength={8} autoFocus className="field" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirmer</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} className="field" />
        </div>
        {error && (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Enregistrement...' : 'Valider'}
        </button>
      </form>
    </div>
  );
}
