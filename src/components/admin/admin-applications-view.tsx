'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { updateApplication, deleteApplication } from '@/app/admin/actions';
import { APPLICATION_STATUS } from '@/lib/labels';
import { formatDate, cn } from '@/lib/utils';

export type AdminApplication = {
  id: string;
  pseudo: string;
  discord: string | null;
  // Réponses au formulaire personnalisé (candidatures récentes).
  answers: { label: string; value: string }[] | null;
  // Colonnes historiques (candidatures antérieures au constructeur).
  characterId: string | null;
  className: string | null;
  role: string | null;
  server: string | null;
  experience: string | null;
  availability: string | null;
  logsUrl: string | null;
  motivation: string | null;
  status: keyof typeof APPLICATION_STATUS;
  internalNotes: string | null;
  createdAt: string;
  gameId: string | null;
};

const isUrl = (v: string) => /^https?:\/\//i.test(v.trim());

/** Réponses à afficher : formulaire personnalisé, ou repli sur les colonnes historiques. */
function answersOf(app: AdminApplication): { label: string; value: string }[] {
  if (app.answers?.length) return app.answers;
  const legacy: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null) => {
    if (value) legacy.push({ label, value });
  };
  push('BattleTag / ID', app.characterId);
  push('Serveur', app.server);
  push('Classe', app.className);
  push('Rôle', app.role);
  push('Expérience', app.experience);
  push('Disponibilités', app.availability);
  push('Logs / Armory', app.logsUrl);
  push('Motivation', app.motivation);
  return legacy;
}

const STATUS_TABS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'DISCUSSING', label: 'En discussion' },
  { key: 'ACCEPTED', label: 'Acceptées' },
  { key: 'REJECTED', label: 'Refusées' },
] as const;

/** Candidatures séparées par jeu, avec les onglets de statut. */
export function AdminApplicationsView({
  games,
  applications,
}: {
  games: GameTabInfo[];
  applications: AdminApplication[];
}) {
  const [activeGame, setActiveGame] = useState(games[0]?.id);
  const [status, setStatus] = useState<string>('ALL');

  if (!activeGame) return <p className="text-muted">Aucun jeu.</p>;

  const list = applications.filter(
    (a) => a.gameId === activeGame && (status === 'ALL' || a.status === status)
  );

  return (
    <div>
      <GameTabBar games={games} activeId={activeGame} onSelect={setActiveGame} />

      {/* Onglets de statut */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatus(t.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              status === t.key
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-border text-muted hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-muted">Aucune candidature pour ce filtre.</p>
      ) : (
        <div className="space-y-4">
          {list.map((app) => {
            const answers = answersOf(app);
            const subtitle = answers.slice(0, 3).map((a) => a.value).join(' · ');
            return (
            <div key={app.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${APPLICATION_STATUS[app.status].badge}`}>
                    {APPLICATION_STATUS[app.status].label}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-title">{app.pseudo}</h3>
                  {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
                  {app.discord && (
                    <p className="mt-1 text-sm text-foreground">
                      <span className="text-muted">Discord :</span> {app.discord}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted">{formatDate(app.createdAt)}</span>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-accent">Voir les détails</summary>
                <dl className="mt-3 space-y-3 text-sm">
                  {answers.length === 0 ? (
                    <p className="text-muted">Aucune réponse enregistrée.</p>
                  ) : (
                    answers.map((a, idx) => (
                      <div key={`${a.label}-${idx}`}>
                        <dt className="text-xs uppercase tracking-wider text-muted">{a.label}</dt>
                        <dd className="mt-1">
                          {isUrl(a.value) ? (
                            <a href={a.value} target="_blank" rel="noopener noreferrer" className="break-all text-accent hover:underline">{a.value}</a>
                          ) : (
                            <span className="whitespace-pre-wrap text-foreground">{a.value}</span>
                          )}
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
              </details>

              <ActionForm action={updateApplication} success="Candidature mise à jour" className="mt-4 space-y-3 border-t border-border pt-4">
                <input type="hidden" name="id" value={app.id} />
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Statut</label>
                    <select name="status" defaultValue={app.status} className="field py-1.5 text-sm">
                      <option value="PENDING">En attente</option>
                      <option value="DISCUSSING">En discussion</option>
                      <option value="ACCEPTED">Acceptée</option>
                      <option value="REJECTED">Refusée</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-muted">Notes internes</label>
                    <input name="internalNotes" defaultValue={app.internalNotes ?? ''} className="field py-1.5 text-sm" placeholder="Notes de l'équipe..." />
                  </div>
                  <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                </div>
              </ActionForm>

              <ActionForm action={deleteApplication.bind(null, app.id)} success="Candidature supprimée" className="mt-2">
                <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer cette candidature ?">
                  Supprimer la candidature
                </ConfirmButton>
              </ActionForm>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
