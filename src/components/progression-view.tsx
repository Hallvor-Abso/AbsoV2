'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BOSS_STATUS } from '@/lib/labels';
import { formatDate, cn } from '@/lib/utils';
import { GameTabBar } from './game-tab-bar';

type Boss = {
  id: string;
  name: string;
  status: keyof typeof BOSS_STATUS;
  firstKillDate: string | null;
  imageUrl: string | null;
  pulls: number | null; // nb de pulls (synchro Warcraft Logs)
  bestPercent: number | null; // meilleur % de vie restante atteint
};
type Tier = { id: string; name: string; expansion: string | null; timerDone: boolean; bosses: Boss[] };

/** Regroupe les tiers par extension, en conservant l'ordre (récent → ancien). */
function groupByExpansion(tiers: Tier[]) {
  const groups: { expansion: string | null; tiers: Tier[] }[] = [];
  for (const t of tiers) {
    const key = t.expansion?.trim() || null;
    const existing = key ? groups.find((g) => g.expansion === key) : null;
    if (existing) existing.tiers.push(t);
    else groups.push({ expansion: key, tiers: [t] });
  }
  return groups;
}
export type ProgressionGame = {
  id: string;
  name: string;
  slug: string;
  color: string;
  logoUrl: string | null;
  status: 'ACTIVE' | 'UPCOMING';
  tiers: Tier[];
};

/**
 * Vue de la progression :
 * - onglets par jeu (distinction claire WoW / SWTOR)
 * - pour chaque tier : barre de progression + piste LINÉAIRE de boss avec images
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
      <GameTabBar games={games} activeId={activeGame.id} onSelect={setActiveId} />

      {activeGame.tiers.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">
            {activeGame.status === 'UPCOMING'
              ? `La progression sur ${activeGame.name} sera affichée dès le lancement.`
              : 'Aucune donnée de progression pour le moment.'}
          </p>
        </div>
      ) : (
        <ProgressionTiers game={activeGame} />
      )}
    </div>
  );
}

/** Liste des tiers regroupés par extension (récent → ancien). */
function ProgressionTiers({ game }: { game: ProgressionGame }) {
  const groups = groupByExpansion(game.tiers);
  const showTimer = game.slug === 'swtor';
  let first = true; // ouvre le tout premier tier par défaut

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const grouped = group.expansion != null && group.tiers.length > 1;
        const body = (
          <div className={grouped ? 'space-y-4 border-l-2 pl-4' : 'space-y-4'} style={grouped ? { borderColor: `${game.color}55` } : undefined}>
            {group.tiers.map((tier) => {
              const open = first;
              first = false;
              return (
                <TierBlock
                  key={tier.id}
                  tier={tier}
                  color={game.color}
                  defaultOpen={open}
                  showTimer={showTimer}
                  hideExpansion={grouped}
                />
              );
            })}
          </div>
        );

        if (!grouped) return <div key={group.expansion ?? '—'}>{body}</div>;
        return (
          <section key={group.expansion} className="space-y-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: game.color }}>
                {group.expansion}
              </h2>
              <span className="text-xs text-muted">{group.tiers.length} tiers</span>
            </div>
            {body}
          </section>
        );
      })}
    </div>
  );
}

function TierBlock({
  tier,
  color,
  defaultOpen,
  showTimer,
  hideExpansion,
}: {
  tier: Tier;
  color: string;
  defaultOpen: boolean;
  showTimer: boolean;
  hideExpansion: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const total = tier.bosses.length;
  const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;
  const percent = total > 0 ? Math.round((killed / total) * 100) : 0;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="flex min-w-0 items-baseline gap-2 text-lg font-semibold text-title">
              <span className="truncate">{tier.name}</span>
              {!hideExpansion && tier.expansion && (
                <span className="shrink-0 text-sm font-normal text-muted">{tier.expansion}</span>
              )}
            </h3>
            <div className="flex shrink-0 items-center gap-2">
              {showTimer && tier.timerDone && (
                <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                  ⏱️ Timer
                </span>
              )}
              <span className="whitespace-nowrap text-sm font-semibold" style={{ color }}>
                {killed}/{total}
              </span>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-soft">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
            />
          </div>
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={cn('shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-border p-5">
          {/* Piste linéaire de boss (défilement horizontal sur mobile) */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tier.bosses.map((boss) => (
              <BossCard key={boss.id} boss={boss} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BossCard({ boss, color }: { boss: Boss; color: string }) {
  const meta = BOSS_STATUS[boss.status];
  const killed = boss.status === 'KILLED';
  const progressing = boss.status === 'PROGRESSING';

  return (
    <div
      className={cn(
        'relative w-44 shrink-0 overflow-hidden rounded-lg border bg-ink-soft transition-all duration-200',
        killed ? '' : 'border-border'
      )}
      style={killed ? { borderColor: `${color}80` } : undefined}
    >
      {/* Visuel du boss */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink">
        {boss.imageUrl ? (
          <Image
            src={boss.imageUrl}
            alt={boss.name}
            fill
            unoptimized
            sizes="180px"
            className={cn('object-cover transition', !killed && 'opacity-40 grayscale')}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: killed
                ? `radial-gradient(circle at 50% 30%, ${color}40, #0C0E13)`
                : 'radial-gradient(circle at 50% 30%, #2A2F39, #0C0E13)',
            }}
          />
        )}
        {/* Pastille de statut */}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          <span className={meta.color}>{meta.label}</span>
        </span>
        {killed && (
          <span
            className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-ink"
            style={{ backgroundColor: color }}
          >
            ✓
          </span>
        )}
        {progressing && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse" style={{ backgroundColor: color }} />
        )}
      </div>

      {/* Nom + infos */}
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-title" title={boss.name}>
          {boss.name}
        </p>
        {killed ? (
          <p className="mt-0.5 text-xs text-muted">
            {boss.firstKillDate ? formatDate(boss.firstKillDate) : 'Tué'}
          </p>
        ) : progressing && (boss.pulls || boss.bestPercent != null) ? (
          // Données live Warcraft Logs sur le boss en cours de progression.
          <p className="mt-0.5 text-xs" style={{ color }}>
            {boss.pulls ? `${boss.pulls} pulls` : ''}
            {boss.pulls && boss.bestPercent != null ? ' · ' : ''}
            {boss.bestPercent != null ? `meilleur ${boss.bestPercent.toFixed(1)}%` : ''}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted">—</p>
        )}
      </div>
    </div>
  );
}
