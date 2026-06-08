'use client';

import { useState } from 'react';
import { ActionForm } from './action-form';
import { ConfirmButton } from './confirm-button';
import {
  createTwitchCommand,
  updateTwitchCommand,
  toggleTwitchCommand,
  deleteTwitchCommand,
} from '@/app/admin/actions';

export type TwitchCmd = {
  id: string;
  name: string;
  response: string;
  enabled: boolean;
  cooldownSeconds: number;
  userLevel: string;
};

const LEVELS = [
  { value: 'EVERYONE', label: 'Tout le monde' },
  { value: 'SUB', label: 'Abonnés' },
  { value: 'MOD', label: 'Modérateurs' },
];

const BUILTIN = [
  '!uptime', '!jeu', '!titre', '!so @pseudo', '!recrutement', '!progress [jeu]', '!roster', '!site', '!discord', '!commandes',
];

export function AdminTwitchCommands({ commands }: { commands: TwitchCmd[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card p-4 text-sm text-muted">
        <p className="mb-1 font-medium text-foreground">Commandes intégrées :</p>
        <p className="text-xs">{BUILTIN.join(' · ')}</p>
        <p className="mt-2 text-xs">
          Pour <strong>modifier le texte</strong> d'une commande intégrée (ex. <code className="text-foreground">!recrutement</code>),
          crée une commande du <strong>même nom</strong> : ta version remplacera celle par défaut.
          La désactiver coupe aussi l'intégrée.
        </p>
        <p className="mt-2 text-xs">
          Variables dans tes réponses : <code className="text-foreground">$(user)</code>,{' '}
          <code className="text-foreground">$(touser)</code>, <code className="text-foreground">$(channel)</code>.
        </p>
      </div>

      <div>
        <button onClick={() => setAdding((v) => !v)} className="btn-primary py-2 text-sm">+ Nouvelle commande</button>
      </div>

      {adding && (
        <div className="card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Nouvelle commande</p>
          <ActionForm action={createTwitchCommand} success="Commande créée" onDone={() => setAdding(false)} className="space-y-3">
            <CmdFields />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-2 text-sm">Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary py-2 text-sm">Annuler</button>
            </div>
          </ActionForm>
        </div>
      )}

      {commands.length === 0 ? (
        <p className="text-muted">Aucune commande personnalisée.</p>
      ) : (
        <div className="space-y-3">
          {commands.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-title">!{c.name}</span>
                <div className="flex items-center gap-2">
                  <ActionForm action={toggleTwitchCommand.bind(null, c.id, !c.enabled)} success={c.enabled ? 'Désactivée' : 'Activée'}>
                    <button type="submit" className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-border text-muted'}`}>
                      {c.enabled ? 'Activée' : 'Désactivée'}
                    </button>
                  </ActionForm>
                </div>
              </div>

              <ActionForm action={updateTwitchCommand} success="Commande enregistrée" className="space-y-3">
                <input type="hidden" name="id" value={c.id} />
                <CmdFields cmd={c} hideName />
                <div className="flex items-center justify-between">
                  <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                </div>
              </ActionForm>

              <div className="mt-2 border-t border-border pt-3">
                <ActionForm action={deleteTwitchCommand.bind(null, c.id)} success="Commande supprimée">
                  <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message={`Supprimer !${c.name} ?`}>
                    Supprimer
                  </ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CmdFields({ cmd, hideName }: { cmd?: TwitchCmd; hideName?: boolean }) {
  return (
    <>
      {!hideName && (
        <div>
          <label className="label">Nom (sans le « ! »)</label>
          <input name="name" required placeholder="discord" className="field py-2 text-sm" />
        </div>
      )}
      <div>
        <label className="label">Réponse</label>
        <textarea name="response" required rows={2} defaultValue={cmd?.response} placeholder="Rejoins notre Discord : https://discord.gg/…" className="field text-sm" />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="label">Accès</label>
          <select name="userLevel" defaultValue={cmd?.userLevel ?? 'EVERYONE'} className="field py-1.5 text-sm">
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cooldown (s)</label>
          <input name="cooldownSeconds" type="number" min={0} max={3600} defaultValue={cmd?.cooldownSeconds ?? 5} className="field max-w-[6rem] py-1.5 text-sm" />
        </div>
      </div>
    </>
  );
}
