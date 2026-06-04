'use client';

import { useState } from 'react';
import { SLOT_STATUS } from '@/lib/labels';
import { GameTabBar, type GameTabInfo } from './game-tab-bar';
import { ApplicationForm } from './application-form';
import { SectionHeading } from './section-heading';

export type RecruitSlot = {
  id: string;
  gameId: string;
  role: string;
  className: string;
  status: keyof typeof SLOT_STATUS;
};

export type RecruitRole = {
  id: string;
  gameId: string;
  name: string;
  description: string | null;
};

/**
 * Affichage du recrutement, lisible et par jeu :
 * - onglets pour distinguer les jeux
 * - postes regroupés par RÔLE, avec une pastille de statut claire par classe
 */
export function RecruitmentView({
  games,
  slots,
  roles: roleCategories = [],
}: {
  games: GameTabInfo[];
  slots: RecruitSlot[];
  roles?: RecruitRole[];
}) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const activeGame = games.find((g) => g.id === activeId) ?? games[0];
  if (!activeGame) return null;

  const gameSlots = slots.filter((s) => s.gameId === activeGame.id);
  const gameRoles = roleCategories.filter((r) => r.gameId === activeGame.id);

  // Ordre des rôles : catégories déclarées d'abord, puis d'éventuels rôles
  // orphelins issus d'anciens postes, dans leur ordre d'apparition.
  const roles: string[] = gameRoles.map((r) => r.name);
  for (const s of gameSlots) if (!roles.includes(s.role)) roles.push(s.role);
  const descriptionOf = (name: string) =>
    gameRoles.find((r) => r.name === name)?.description ?? null;

  return (
    <div>
      <GameTabBar games={games} activeId={activeGame.id} onSelect={setActiveId} />

      {/* ---- Postes recherchés pour le jeu sélectionné ---- */}
      {roles.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          {activeGame.status === 'UPCOMING'
            ? `Le recrutement sur ${activeGame.name} ouvrira prochainement.`
            : 'Aucun poste ouvert pour le moment.'}
        </div>
      ) : (
        <div className="space-y-5">
          {roles.map((role) => {
            const roleSlots = gameSlots.filter((s) => s.role === role);
            const description = descriptionOf(role);
            return (
              <div key={role} className="card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {role}
                </h3>
                {description && (
                  <p className="mt-1.5 mb-3 text-sm text-foreground/80">{description}</p>
                )}
                <div className={`flex flex-wrap gap-2.5 ${description ? '' : 'mt-4'}`}>
                  {roleSlots.map((slot) => {
                    const meta = SLOT_STATUS[slot.status];
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${meta.badge}`}
                      >
                        <span className="text-sm font-semibold text-title">{slot.className}</span>
                        <span className="text-xs font-medium uppercase tracking-wider opacity-90">
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                  {roleSlots.length === 0 && (
                    <span className="text-sm text-muted">Aucune classe ouverte pour le moment.</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Légende des statuts */}
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted">
            <Legend className="bg-accent" label="Ouvert" />
            <Legend className="bg-amber-400" label="Limité" />
            <Legend className="bg-muted" label="Fermé" />
          </div>
        </div>
      )}

      {/* ---- Formulaire de candidature, propre au jeu sélectionné ---- */}
      <div className="mt-16">
        <SectionHeading
          eyebrow="Postuler"
          title={`Candidature — ${activeGame.name}`}
          subtitle="Prends le temps de remplir chaque champ : une candidature soignée fait la différence."
          className="mb-8"
        />
        {activeGame.status === 'ACTIVE' ? (
          <ApplicationForm gameId={activeGame.id} gameName={activeGame.name} />
        ) : (
          <div className="card p-10 text-center text-muted">
            Les candidatures pour {activeGame.name} ouvriront au lancement du projet.
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
