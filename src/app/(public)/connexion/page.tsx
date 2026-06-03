'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Page de connexion (visiteurs, membres et admins). */
export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginForm() {
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
      identifier: formData.get('identifier'),
      password: formData.get('password'),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Identifiant ou mot de passe incorrect.');
      return;
    }
    router.push(params.get('callbackUrl') || '/');
    router.refresh();
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-center font-display text-2xl font-bold text-title">Connexion</h1>
      <p className="mb-6 mt-1 text-center text-sm text-muted">Content de te revoir.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="identifier">Email ou identifiant</label>
          <input id="identifier" name="identifier" required autoFocus className="field" />
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

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="font-medium text-accent hover:text-accent-deep">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
