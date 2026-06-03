'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ElectricArc } from '@/components/electric-arc';

/**
 * Page de connexion à l'espace admin.
 * En cas de succès, redirige vers le tableau de bord (/admin).
 */
export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError('Identifiant ou mot de passe incorrect.');
      return;
    }
    router.push(params.get('callbackUrl') || '/admin');
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <ElectricArc className="absolute inset-0 h-full w-full opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/60 to-ink" />

      <div className="card relative w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <Logo withGlow />
          <p className="mt-3 text-sm text-muted">Espace d'administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">Identifiant</label>
            <input id="username" name="username" required autoFocus className="field" />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" required className="field" />
          </div>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
