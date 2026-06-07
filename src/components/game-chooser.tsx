'use client';

import Image from 'next/image';
import type { GameTabInfo } from './game-tab-bar';

/**
 * Écran de choix du jeu : aucune préférence imposée, une carte par jeu (avec
 * son art de couverture). Réutilisé par Recrutement et Progression.
 */
export function GameChooser({
  games,
  onSelect,
  title,
  cta = 'Voir →',
}: {
  games: GameTabInfo[];
  onSelect: (id: string) => void;
  title: string;
  cta?: string;
}) {
  return (
    <div className="py-4">
      <p className="mb-6 text-center text-lg font-medium text-foreground">{title}</p>
      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.id)}
            className="group relative flex min-h-[170px] flex-col justify-end overflow-hidden rounded-2xl border text-left transition-all duration-300 hover:border-accent/60 hover:shadow-glow"
            style={{ borderColor: `${g.color}55` }}
          >
            {g.coverImageUrl ? (
              <Image
                src={g.coverImageUrl}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 360px"
                className="object-cover opacity-45 transition-all duration-500 group-hover:scale-105 group-hover:opacity-60"
              />
            ) : (
              <span className="absolute inset-0" style={{ backgroundColor: `${g.color}22` }} />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/20" />

            <div className="relative flex items-center gap-3 p-5">
              {g.logoUrl ? (
                <span className="relative h-9 w-9 shrink-0">
                  <Image src={g.logoUrl} alt="" fill unoptimized className="object-contain" />
                </span>
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: g.color }} />
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-title transition-colors group-hover:text-accent">
                  {g.name}
                </p>
                {g.status === 'UPCOMING' ? (
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-300">Bientôt</span>
                ) : (
                  <span className="text-sm text-muted">{cta}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
