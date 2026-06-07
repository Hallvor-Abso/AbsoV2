'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from './game-tab-bar';
import { GameChooser } from './game-chooser';
import { ROLE_EMOJI, ROLE_LABEL, ROLE_ORDER, type SpecRole } from '@/lib/classes';

export type RosterMember = { name: string; role: string; className: string; spec: string };

export function RosterView({
  games,
  members,
}: {
  games: GameTabInfo[];
  members: Record<string, RosterMember[]>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeGame = activeId ? games.find((g) => g.id === activeId) ?? null : null;

  if (!activeGame) {
    if (games.length === 0) return null;
    return (
      <GameChooser
        games={games}
        onSelect={setActiveId}
        title="Pour quel jeu veux-tu voir l'effectif ?"
        cta="Voir l'effectif →"
      />
    );
  }

  const list = members[activeGame.id] ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setActiveId(null)}
        className="mb-4 text-sm text-muted transition-colors hover:text-accent"
      >
        ← Choisir un autre jeu
      </button>
      <GameTabBar games={games} activeId={activeGame.id} onSelect={setActiveId} />

      {list.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Aucun membre n'a encore renseigné sa classe pour {activeGame.name}.
        </div>
      ) : (
        <div className="space-y-6">
          {ROLE_ORDER.map((role) => {
            const group = list.filter((m) => m.role === role);
            if (group.length === 0) return null;
            return (
              <div key={role}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                  <span>{ROLE_EMOJI[role]}</span>
                  {ROLE_LABEL[role]}
                  <span className="text-xs font-normal normal-case tracking-normal text-muted/70">
                    ({group.length})
                  </span>
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((m, i) => (
                    <div
                      key={`${m.name}-${i}`}
                      className="card flex items-center gap-3 p-3"
                      style={{ borderLeft: `3px solid ${activeGame.color}` }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-title">{m.name}</p>
                        <p className="truncate text-xs text-muted">
                          {m.className}
                          {m.spec ? ` · ${m.spec}` : ` · ${ROLE_LABEL[m.role as SpecRole] ?? m.role}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="pt-2 text-xs text-muted">{list.length} membre(s) au total.</p>
        </div>
      )}
    </div>
  );
}
