'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '../auth-actions';

/** Formulaire de demande de réinitialisation (saisie de l'email). */
export function ForgotForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await requestPasswordReset(new FormData(e.currentTarget));
    setLoading(false);
    setMsg({ ok: res.ok, text: res.message });
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-center font-display text-2xl font-bold text-title">Mot de passe oublié</h1>
      <p className="mb-6 mt-1 text-center text-sm text-muted">
        Entre ton email : on t'envoie un lien pour choisir un nouveau mot de passe.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoFocus className="field" />
        </div>
        {msg && (
          <p
            className={
              msg.ok
                ? 'rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300'
                : 'rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300'
            }
          >
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/connexion" className="font-medium text-accent hover:text-accent-deep">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
