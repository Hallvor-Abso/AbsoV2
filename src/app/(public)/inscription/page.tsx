'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/** Page d'inscription (création d'un compte visiteur). */
export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoading(false);
        setError(data?.error || 'Inscription impossible. Vérifie les champs.');
        return;
      }

      // Connexion automatique après inscription réussie.
      await signIn('credentials', {
        identifier: payload.email,
        password: payload.password,
        redirect: false,
      });
      router.push('/');
      router.refresh();
    } catch {
      setLoading(false);
      setError('Impossible de contacter le serveur. Réessaie plus tard.');
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-center font-display text-2xl font-bold text-title">Inscription</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">
          Crée ton compte pour rejoindre la communauté.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="displayName">Pseudo</label>
            <input id="displayName" name="displayName" required className="field" placeholder="Ton pseudo" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="field" placeholder="toi@exemple.com" />
          </div>
          <div>
            <label className="label" htmlFor="discord">Discord</label>
            <input id="discord" name="discord" required className="field" placeholder="ton_pseudo_discord" />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" required minLength={8} className="field" placeholder="8 caractères minimum" />
          </div>
          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="font-medium text-accent hover:text-accent-deep">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
