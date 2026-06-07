'use client';

import { useState } from 'react';
import { ActionForm } from './action-form';
import { ConfirmButton } from './confirm-button';
import {
  createTwitchTimer,
  updateTwitchTimer,
  toggleTwitchTimer,
  deleteTwitchTimer,
} from '@/app/admin/actions';

export type TwitchTimerItem = {
  id: string;
  name: string;
  message: string;
  intervalMinutes: number;
  enabled: boolean;
};

export function AdminTwitchTimers({ timers }: { timers: TwitchTimerItem[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Messages postés automatiquement à intervalle régulier, <strong>uniquement quand le live est en cours</strong>.
      </p>
      <button onClick={() => setAdding((v) => !v)} className="btn-primary py-2 text-sm">+ Nouveau timer</button>

      {adding && (
        <div className="card p-5">
          <ActionForm action={createTwitchTimer} success="Timer créé" onDone={() => setAdding(false)} className="space-y-3">
            <Fields />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-2 text-sm">Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary py-2 text-sm">Annuler</button>
            </div>
          </ActionForm>
        </div>
      )}

      {timers.length === 0 ? (
        <p className="text-muted">Aucun timer.</p>
      ) : (
        <div className="space-y-3">
          {timers.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-title">{t.name || '(sans nom)'} · toutes les {t.intervalMinutes} min</span>
                <ActionForm action={toggleTwitchTimer.bind(null, t.id, !t.enabled)} success={t.enabled ? 'Désactivé' : 'Activé'}>
                  <button type="submit" className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${t.enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-border text-muted'}`}>
                    {t.enabled ? 'Activé' : 'Désactivé'}
                  </button>
                </ActionForm>
              </div>
              <ActionForm action={updateTwitchTimer} success="Timer enregistré" className="space-y-3">
                <input type="hidden" name="id" value={t.id} />
                <Fields timer={t} />
                <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
              </ActionForm>
              <div className="mt-2 border-t border-border pt-3">
                <ActionForm action={deleteTwitchTimer.bind(null, t.id)} success="Timer supprimé">
                  <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce timer ?">Supprimer</ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Fields({ timer }: { timer?: TwitchTimerItem }) {
  return (
    <>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1">
          <label className="label">Nom</label>
          <input name="name" defaultValue={timer?.name} placeholder="Discord" className="field py-2 text-sm" />
        </div>
        <div>
          <label className="label">Intervalle (min)</label>
          <input name="intervalMinutes" type="number" min={1} max={720} defaultValue={timer?.intervalMinutes ?? 15} className="field max-w-[6rem] py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea name="message" required rows={2} defaultValue={timer?.message} placeholder="Rejoins le Discord de la guilde : …" className="field text-sm" />
      </div>
    </>
  );
}
