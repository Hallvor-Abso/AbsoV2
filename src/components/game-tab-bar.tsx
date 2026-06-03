'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export type GameTabInfo = {
  id: string;
  name: string;
  color: string;
  logoUrl?: string | null;
  status?: 'ACTIVE' | 'UPCOMING';
};

/**
 * Barre d'onglets par jeu — réutilisée sur Progression, Recrutement et
 * Calendrier pour que les joueurs distinguent immédiatement WoW / SWTOR.
 *
 * L'onglet actif est mis en avant avec la COULEUR du jeu (bordure + fond léger),
 * et affiche son logo s'il est défini.
 */
export function GameTabBar({
  games,
  activeId,
  onSelect,
}: {
  games: GameTabInfo[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  if (games.length <= 1) return null;

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {games.map((game) => {
        const active = game.id === activeId;
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelect(game.id)}
            className={cn(
              'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200',
              active
                ? 'shadow-glow'
                : 'border-border bg-card/60 hover:border-border hover:bg-card'
            )}
            style={
              active
                ? {
                    borderColor: `${game.color}99`,
                    backgroundColor: `${game.color}1A`,
                  }
                : undefined
            }
          >
            {/* Logo ou pastille de couleur */}
            {game.logoUrl ? (
              <span className="relative h-6 w-10 shrink-0">
                <Image src={game.logoUrl} alt="" fill className="object-contain" />
              </span>
            ) : (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: game.color }}
              />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                active ? 'text-title' : 'text-foreground'
              )}
            >
              {game.name}
            </span>
            {game.status === 'UPCOMING' && (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                À venir
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
