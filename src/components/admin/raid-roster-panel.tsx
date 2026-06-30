'use client';

import { useState, useTransition } from 'react';
import { validateRaidRoster } from '@/app/admin/actions';
import { useToast } from './toast';

export type RosterSignup = {
  discordId: string;
  displayName: string;
  role: string | null;
  spec: string | null;
  selected: boolean;
};

const ROLE_GROUPS: { key: string; label: string; emoji: string }[] = [
  { key: 'TANK', label: 'Tank', emoji: '🛡️' },
  { key: 'HEAL', label: 'Heal', emoji: '💚' },
  { key: 'DPS', label: 'DPS', emoji: '⚔️' },
  { key: '', label: 'Sans rôle', emoji: '•' },
];

/** Sélection des joueurs retenus pour le raid + validation (ping Discord). */
export function RaidRosterPanel({
  eventId,
  signups,
  defaultMessage = '',
}: {
  eventId: string;
  signups: RosterSignup[];
  defaultMessage?: string;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(defaultMessage);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(signups.filter((s) => s.selected).map((s) => s.discordId)),
  );

  if (signups.length === 0) {
    return <p className="text-sm text-muted">Aucun joueur inscrit « Présent » pour le moment.</p>;
  }

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const setAll = (on: boolean) => setChecked(on ? new Set(signups.map((s) => s.discordId)) : new Set());

  const validate = () =>
    startTransition(async () => {
      try {
        await validateRaidRoster(eventId, [...checked], message);
        toast(`Groupe validé (${checked.size}) — ping envoyé sur Discord.`);
      } catch {
        toast('Échec de la validation.', 'error');
      }
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-title">Groupe du raid · {checked.size} retenu(s)</p>
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setAll(true)} className="text-accent hover:underline">Tout cocher</button>
          <span className="text-border">|</span>
          <button type="button" onClick={() => setAll(false)} className="text-muted hover:underline">Vider</button>
        </div>
      </div>

      <div className="space-y-2">
        {ROLE_GROUPS.map((g) => {
          const members = signups.filter((s) => (s.role ?? '') === g.key);
          if (members.length === 0) return null;
          return (
            <div key={g.key || 'none'}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {g.emoji} {g.label} ({members.length})
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {members.map((s) => (
                  <label
                    key={s.discordId}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm hover:border-accent/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(s.discordId)}
                      onChange={() => toggle(s.discordId)}
                      className="h-4 w-4 accent-[#4A9EFF]"
                    />
                    <span className="truncate text-foreground">
                      {s.displayName}
                      {s.spec ? <span className="text-muted"> · {s.spec}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="label">Message de validation (optionnel)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={1000}
          className="field"
          placeholder="Infos en plus : RDV 20h45 en vocal, consommables fournis…"
        />
        <p className="mt-1 text-xs text-muted">Ajouté à l'annonce du groupe sur Discord.</p>
      </div>

      <button type="button" onClick={validate} disabled={pending} className="btn-primary text-sm disabled:opacity-60">
        {pending ? 'Validation…' : 'Valider le groupe & notifier Discord'}
      </button>
      <p className="text-xs text-muted">
        Les joueurs retenus présents sur Discord sont mentionnés. Le message disparaît 30 min après le début.
      </p>
    </div>
  );
}
