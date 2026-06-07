'use client';

import { useState } from 'react';
import type { FormFieldDef } from '@/lib/recruitment-fields';

/**
 * Formulaire public de candidature, propre à UN jeu.
 * Le jeu n'est pas demandé au joueur : il est déterminé par l'onglet/la page
 * sur laquelle il se trouve (transmis en champ caché `gameId`).
 *
 * Les champs (hors Pseudo + Discord, toujours présents) sont définis par jeu
 * dans l'admin (constructeur de formulaire) et rendus dynamiquement ici.
 */
export function ApplicationForm({
  gameId,
  gameName,
  fields,
  auth,
}: {
  gameId: string;
  gameName: string;
  fields: FormFieldDef[];
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
  return (
    <ApplicationFormFields gameId={gameId} gameName={gameName} fields={fields} discord={auth.discord} />
  );
}

function ApplicationFormFields({
  gameId,
  gameName,
  fields,
  discord,
}: {
  gameId: string;
  gameName: string;
  fields: FormFieldDef[];
  discord: string | null;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError('');

    const fd = new FormData(e.currentTarget);
    // Les réponses aux champs personnalisés sont collectées par clé.
    const values: Record<string, string> = {};
    for (const f of fields) values[f.key] = String(fd.get(`field_${f.key}`) ?? '');

    const payload = {
      gameId,
      pseudo: String(fd.get('pseudo') ?? ''),
      discord: String(fd.get('discord') ?? ''),
      values,
    };

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

      {/* Champs fixes : identité + contact (liés à la connexion). */}
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

      {/* Champs personnalisés du jeu. */}
      {fields.map((f) => (
        <DynamicField key={f.key} field={f} />
      ))}

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

/** Rend un champ du formulaire selon son type. */
function DynamicField({ field }: { field: FormFieldDef }) {
  const name = `field_${field.key}`;
  const label = `${field.label}${field.required ? ' *' : ''}`;

  if (field.type === 'TEXTAREA') {
    return (
      <div>
        <label className="label" htmlFor={name}>{label}</label>
        <textarea
          id={name} name={name} required={field.required} rows={4} className="field"
          placeholder={field.placeholder ?? ''}
        />
        {field.helpText && <p className="mt-1 text-xs text-muted">{field.helpText}</p>}
      </div>
    );
  }

  if (field.type === 'SELECT') {
    return (
      <div>
        <label className="label" htmlFor={name}>{label}</label>
        <select id={name} name={name} required={field.required} className="field" defaultValue="">
          <option value="" disabled>Choisir…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {field.helpText && <p className="mt-1 text-xs text-muted">{field.helpText}</p>}
      </div>
    );
  }

  const inputType = field.type === 'URL' ? 'url' : field.type === 'NUMBER' ? 'number' : 'text';
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input
        id={name} name={name} type={inputType} required={field.required}
        placeholder={field.placeholder ?? ''} className="field"
      />
      {field.helpText && <p className="mt-1 text-xs text-muted">{field.helpText}</p>}
    </div>
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
