'use client';

import { useState } from 'react';

type GameOption = { id: string; name: string };

/**
 * Formulaire public de candidature.
 * Envoie les données à l'API /api/applications (validation + rate limiting côté serveur).
 */
export function ApplicationForm({ games }: { games: GameOption[] }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError('');

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        setStatus('error');
        setError('Trop de candidatures envoyées. Réessaie dans quelques minutes.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setError(data?.error || 'Une erreur est survenue. Vérifie les champs.');
        return;
      }

      setStatus('success');
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus('error');
      setError('Impossible de contacter le serveur. Réessaie plus tard.');
    }
  }

  if (status === 'success') {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          ✓
        </div>
        <h3 className="text-xl font-semibold text-title">Candidature envoyée</h3>
        <p className="mt-2 text-muted">
          Merci ! Notre équipe de recrutement reviendra vers toi rapidement, généralement via Discord.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="btn-secondary mt-6"
        >
          Envoyer une autre candidature
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Pseudo *" name="pseudo" required placeholder="Ton pseudo en jeu" />
        <Field label="BattleTag / ID" name="characterId" placeholder="Pseudo#1234" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="gameId">Jeu *</label>
          <select id="gameId" name="gameId" required className="field" defaultValue="">
            <option value="" disabled>Choisis un jeu</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <Field label="Serveur *" name="server" required placeholder="Hyjal, Tarren Mill..." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Classe *" name="className" required placeholder="Mage, Prêtre..." />
        <Field label="Rôle *" name="role" required placeholder="DPS, Heal, Tank" />
      </div>

      <div>
        <label className="label" htmlFor="experience">Expérience PvE *</label>
        <textarea
          id="experience" name="experience" required rows={4} className="field"
          placeholder="Tes progress récents, guildes précédentes, ton niveau de jeu..."
        />
      </div>

      <Field
        label="Disponibilités *" name="availability" required
        placeholder="Ex : lun/mer/jeu 20h-23h"
      />

      <Field
        label="Logs / Armory" name="logsUrl" type="url"
        placeholder="https://www.warcraftlogs.com/character/..."
      />

      <div>
        <label className="label" htmlFor="motivation">Motivation *</label>
        <textarea
          id="motivation" name="motivation" required rows={4} className="field"
          placeholder="Pourquoi Absolution ? Qu'attends-tu de la guilde ?"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === 'sending'} className="btn-primary w-full sm:w-auto">
        {status === 'sending' ? 'Envoi...' : 'Envoyer ma candidature'}
      </button>
    </form>
  );
}

function Field({
  label, name, type = 'text', required, placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} required={required}
        placeholder={placeholder} className="field"
      />
    </div>
  );
}
