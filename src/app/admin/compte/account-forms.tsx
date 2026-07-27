'use client';

import { useState } from 'react';
import { changePassword, updateEmail } from './actions';

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={
        msg.ok
          ? 'rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-300'
          : 'rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300'
      }
    >
      {msg.text}
    </p>
  );
}

/** Formulaire de changement de mot de passe (compte connecté). */
export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const form = e.currentTarget;
    const res = await changePassword(new FormData(form));
    setLoading(false);
    setMsg({ ok: res.ok, text: res.message });
    if (res.ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="current">Mot de passe actuel</label>
        <input id="current" name="current" type="password" required className="field" autoComplete="current-password" />
      </div>
      <div>
        <label className="label" htmlFor="password">Nouveau mot de passe</label>
        <input id="password" name="password" type="password" required minLength={8} className="field" autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Confirmer le nouveau</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} className="field" autoComplete="new-password" />
      </div>
      <Feedback msg={msg} />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}

/** Formulaire de définition / mise à jour de l'email du compte. */
export function EmailForm({ defaultEmail }: { defaultEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await updateEmail(new FormData(e.currentTarget));
    setLoading(false);
    setMsg({ ok: res.ok, text: res.message });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email de connexion & récupération</label>
        <input id="email" name="email" type="email" required defaultValue={defaultEmail} className="field" autoComplete="email" />
      </div>
      <Feedback msg={msg} />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Enregistrement...' : 'Enregistrer l’email'}
      </button>
    </form>
  );
}
