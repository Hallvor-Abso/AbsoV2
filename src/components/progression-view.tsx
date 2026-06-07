'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BOSS_STATUS } from '@/lib/labels';
import { formatDate, cn, expansionColor } from '@/lib/utils';
import { GameTabBar } from './game-tab-bar';
import { GameChooser } from './game-chooser';

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
  coverImageUrl: string | null;
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
  const [activeId, setActiveId] = useState<string | null>(
    games.find((g) => g.slug === initialSlug)?.id ?? null
  );
  const activeGame = activeId ? games.find((g) => g.id === activeId) ?? null : null;

  // Aucun jeu sélectionné → écran de choix neutre (pas de jeu imposé).
  if (!activeGame) {
    if (games.length === 0) return null;
    return (
      <GameChooser
        games={games.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          logoUrl: g.logoUrl,
          coverImageUrl: g.coverImageUrl,
          status: g.status,
        }))}
        onSelect={setActiveId}
        title="Pour quel jeu veux-tu voir la progression ?"
        cta="Voir la progression →"
      />
    );
  }

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

      {activeGame.tiers.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">
            {activeGame.status === 'UPCOMING'
              ? `La progression sur ${activeGame.name} sera affichée dès le lancement.`
              : 'Aucune donnée de progression pour le moment.'}
          </p>
        </div>
      ) : (
        <ProgressionTiers key={activeGame.id} game={activeGame} />
      )}
    </div>
  );
}

/** Au-delà de ce nombre d'extensions, on passe en sous-onglets pour rester compact. */
const EXPANSION_TAB_THRESHOLD = 3;

/** Liste des tiers regroupés par extension (récent → ancien). */
function ProgressionTiers({ game }: { game: ProgressionGame }) {
  const groups = groupByExpansion(game.tiers);
  const showTimer = game.slug === 'swtor';

  // Beaucoup d'extensions → sous-onglets (n'affiche qu'une extension à la fois).
  if (groups.length > EXPANSION_TAB_THRESHOLD) {
    return <ExpansionTabs game={game} groups={groups} showTimer={showTimer} />;
  }

  let first = true; // ouvre le tout premier tier par défaut

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const grouped = group.expansion != null && group.tiers.length > 1;
        // Couleur propre à l'extension (à défaut, la couleur du jeu).
        const color = group.expansion ? expansionColor(group.expansion) : game.color;
        const body = (
          <div className={grouped ? 'space-y-4 border-l-2 pl-4' : 'space-y-4'} style={grouped ? { borderColor: `${color}55` } : undefined}>
            {group.tiers.map((tier) => {
              const open = first;
              first = false;
              return (
                <TierBlock
                  key={tier.id}
                  tier={tier}
                  color={color}
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
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color }}>
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

type ExpGroup = { expansion: string | null; tiers: Tier[] };

/** Sélecteur d'extension (pastilles) + affichage d'une seule extension à la fois. */
function ExpansionTabs({
  game,
  groups,
  showTimer,
}: {
  game: ProgressionGame;
  groups: ExpGroup[];
  showTimer: boolean;
}) {
  const [activeKey, setActiveKey] = useState(groups[0]?.expansion ?? '—');
  const active = groups.find((g) => (g.expansion ?? '—') === activeKey) ?? groups[0];
  const activeColor = active.expansion ? expansionColor(active.expansion) : game.color;

  return (
    <div className="space-y-6">
      {/* Pastilles d'extension */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const key = g.expansion ?? '—';
          const c = g.expansion ? expansionColor(g.expansion) : game.color;
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                !isActive && 'border-border text-muted hover:text-foreground'
              )}
              style={isActive ? { borderColor: `${c}80`, color: c, backgroundColor: `${c}1a` } : undefined}
            >
              {g.expansion ?? 'Autres'}
              <span className="ml-1.5 text-xs opacity-70">{g.tiers.length}</span>
            </button>
          );
        })}
      </div>

      {/* Tiers de l'extension sélectionnée */}
      <div className="space-y-4">
        {active.tiers.map((tier, i) => (
          <TierBlock
            key={tier.id}
            tier={tier}
            color={activeColor}
            defaultOpen={i === 0}
            showTimer={showTimer}
            hideExpansion={Boolean(active.expansion)}
          />
        ))}
      </div>
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
                <span className="shrink-0 text-sm font-normal" style={{ color }}>{tier.expansion}</span>
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
