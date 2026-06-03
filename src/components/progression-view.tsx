'use client';

import { useState } from 'react';
import { BOSS_STATUS } from '@/lib/labels';
import { formatDate, cn } from '@/lib/utils';

// Types des données reçues depuis le serveur
type Boss = {
  id: string;
  name: string;
  status: keyof typeof BOSS_STATUS;
  firstKillDate: string | null;
};
type Tier = { id: string; name: string; bosses: Boss[] };
export type ProgressionGame = {
  id: string;
  name: string;
  slug: string;
  color: string;
  tiers: Tier[];
};

/**
 * Vue interactive de la progression :
 * - onglets par jeu actif
 * - pour chaque tier : barre de progression + liste des boss avec statut
 * - les tiers passés sont repliables (accordéon)
 */
export function ProgressionView({
  games,
  initialSlug,
}: {
  games: ProgressionGame[];
  initialSlug?: string;
}) {
  const [activeId, setActiveId] = useState(
    games.find((g) => g.slug === initialSlug)?.id ?? games[0]?.id
  );
  const activeGame = games.find((g) => g.id === activeId) ?? games[0];

  if (!activeGame) return null;

  return (
    <div>
      {/* Onglets jeux */}
      {games.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2 border-b border-border">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => setActiveId(game.id)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-colors duration-200',
                game.id === activeId
                  ? 'text-title'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {game.name}
              {game.id === activeId && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent shadow-glow" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tiers du jeu actif */}
      <div className="space-y-6">
        {activeGame.tiers.length === 0 && (
          <p className="text-muted">Aucune donnée de progression pour le moment.</p>
        )}
        {activeGame.tiers.map((tier, index) => (
          <TierBlock key={tier.id} tier={tier} defaultOpen={index === 0} />
        ))}
      </div>
    </div>
  );
}

function TierBlock({ tier, defaultOpen }: { tier: Tier; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const total = tier.bosses.length;
  const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;
  const percent = total > 0 ? Math.round((killed / total) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      {/* En-tête cliquable (accordéon) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-lg font-semibold text-title">{tier.name}</h3>
            <span className="whitespace-nowrap text-sm font-medium text-accent">
              {killed}/{total}
            </span>
          </div>
          {/* Barre de progression linéaire */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Liste des boss */}
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {tier.bosses.map((boss) => {
            const meta = BOSS_STATUS[boss.status];
            return (
              <li key={boss.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                  <span className="text-foreground">{boss.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={meta.color}>{meta.label}</span>
                  {boss.status === 'KILLED' && boss.firstKillDate && (
                    <span className="hidden text-muted sm:inline">
                      {formatDate(boss.firstKillDate)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
