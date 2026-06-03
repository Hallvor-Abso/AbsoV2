'use client';

import { useState } from 'react';
import { SLOT_STATUS } from '@/lib/labels';
import { GameTabBar, type GameTabInfo } from './game-tab-bar';

export type RecruitSlot = {
  id: string;
  gameId: string;
  role: string;
  className: string;
  status: keyof typeof SLOT_STATUS;
};

/**
 * Affichage du recrutement, lisible et par jeu :
 * - onglets pour distinguer les jeux
 * - postes regroupés par RÔLE, avec une pastille de statut claire par classe
 */
export function RecruitmentView({
  games,
  slots,
}: {
  games: GameTabInfo[];
  slots: RecruitSlot[];
}) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const activeGame = games.find((g) => g.id === activeId) ?? games[0];
  if (!activeGame) return null;

  const gameSlots = slots.filter((s) => s.gameId === activeGame.id);

  // Regroupement par rôle, en gardant l'ordre d'apparition.
  const roles: string[] = [];
  for (const s of gameSlots) if (!roles.includes(s.role)) roles.push(s.role);

  return (
    <div>
      <GameTabBar games={games} activeId={activeGame.id} onSelect={setActiveId} />

      {gameSlots.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          {activeGame.status === 'UPCOMING'
            ? `Le recrutement sur ${activeGame.name} ouvrira prochainement.`
            : 'Aucun poste pour le moment.'}
        </div>
      ) : (
        <div className="space-y-5">
          {roles.map((role) => {
            const roleSlots = gameSlots.filter((s) => s.role === role);
            return (
              <div key={role} className="card p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {role}
                </h3>
                <div className="flex flex-wrap gap-2.5">
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
