'use client';

import { useState } from 'react';

/**
 * Formulaire public de candidature, propre à UN jeu.
 * Le jeu n'est pas demandé au joueur : il est déterminé par l'onglet/la page
 * sur laquelle il se trouve (transmis en champ caché `gameId`).
 */
export function ApplicationForm({
  gameId,
  gameName,
  auth,
}: {
  gameId: string;
  gameName: string;
  auth: { loggedIn: boolean; discordLinked: boolean; discord: string | null };
}) {
  // Connexion + Discord lié obligatoires pour postuler (suivi de candidature).
  if (!auth.loggedIn) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold text-title">Connecte-toi pour postuler</h3>
        <p className="mt-2 text-muted">
          La candidature est liée à ton compte pour que tu puisses en suivre le statut.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/connexion" className="btn-primary">Se connecter</a>
          <a href="/inscription" className="btn-secondary">S'inscrire</a>
        </div>
      </div>
    );
  }
  if (!auth.discordLinked) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-xl font-semibold text-title">Lie ton compte Discord</h3>
        <p className="mt-2 text-muted">
          Pour postuler, relie ton compte Discord (une seule fois) : c'est ainsi qu'on te
          recontacte et que tu suis ta candidature.
        </p>
        <a href="/api/discord/link" className="btn-primary mt-6 inline-flex">
          Lier mon compte Discord
        </a>
      </div>
    );
  }
  return <ApplicationFormFields gameId={gameId} gameName={gameName} discord={auth.discord} />;
}

function ApplicationFormFields({
  gameId,
  gameName,
  discord,
}: {
  gameId: string;
  gameName: string;
  discord: string | null;
}) {
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
      {/* Le jeu est imposé par la page : aucun choix demandé au joueur. */}
      <input type="hidden" name="gameId" value={gameId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Pseudo *" name="pseudo" required placeholder="Ton pseudo en jeu" />
        <Field
          label="Discord *"
          name="discord"
          required
          placeholder="ton_pseudo_discord"
          defaultValue={discord ?? ''}
          readOnly={Boolean(discord)}
        />
      </div>

      <Field label="BattleTag / ID" name="characterId" placeholder="Pseudo#1234" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Serveur *" name="server" required placeholder="Hyjal, Tarren Mill..." />
        <Field label="Classe *" name="className" required placeholder="Mage, Prêtre..." />
      </div>

      <Field label="Rôle *" name="role" required placeholder="DPS, Heal, Tank" />

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
        {status === 'sending' ? 'Envoi...' : `Postuler pour ${gameName}`}
      </button>
    </form>
  );
}

function Field({
  label, name, type = 'text', required, placeholder, defaultValue, readOnly,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={type} required={required}
        placeholder={placeholder} className="field"
        defaultValue={defaultValue} readOnly={readOnly}
      />
    </div>
  );
}
