'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { AutoSaveForm } from './auto-save-form';
import { ImageInput } from './image-input';
import { Modal } from './modal';
import { BOSS_STATUS } from '@/lib/labels';
import { cn, expansionColor } from '@/lib/utils';
import {
  createTier,
  updateTier,
  deleteTier,
  toggleTierTimer,
  createBoss,
  updateBoss,
  deleteBoss,
} from '@/app/admin/actions';

export type AdminBoss = {
  id: string;
  name: string;
  status: keyof typeof BOSS_STATUS;
  firstKillDate: string; // YYYY-MM-DD ('' si vide)
  imageUrl: string | null;
  encounterId: number | null;
};
export type AdminTier = {
  id: string;
  name: string;
  expansion: string | null;
  zoneId: number | null;
  timerDone: boolean;
  bosses: AdminBoss[];
};
export type AdminProgGame = GameTabInfo & { slug: string; tiers: AdminTier[] };

/** Au-delà de ce nombre d'extensions, on passe en sous-onglets pour rester compact. */
const EXPANSION_TAB_THRESHOLD = 3;

/** Regroupe les tiers par extension, en conservant l'ordre (récent → ancien). */
function groupByExpansion(tiers: AdminTier[]) {
  const groups: { expansion: string | null; tiers: AdminTier[] }[] = [];
  for (const t of tiers) {
    const key = t.expansion?.trim() || null;
    const existing = key ? groups.find((g) => g.expansion === key) : null;
    if (existing) existing.tiers.push(t);
    else groups.push({ expansion: key, tiers: [t] });
  }
  return groups;
}

/** Gestion de la progression, séparée par jeu (un onglet par jeu). */
export function AdminProgressionManager({ games }: { games: AdminProgGame[] }) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const [addOpen, setAddOpen] = useState(false);
  const game = games.find((g) => g.id === activeId) ?? games[0];
  if (!game) return <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>;

  // Champs spécifiques au jeu : Warcraft Logs (WoW), Succès « timer » (SWTOR).
  const showWcl = game.slug === 'wow';
  const showTimer = game.slug === 'swtor';
  const groups = groupByExpansion(game.tiers);
  let firstTier = true; // pour ouvrir le tout premier tier par défaut

  return (
    <div>
      <GameTabBar games={games} activeId={game.id} onSelect={setActiveId} />

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={() => setAddOpen(true)} className="btn-secondary">
          + Ajouter un tier
        </button>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Ajouter un tier">
        <ActionForm action={createTier} success="Tier ajouté" className="mt-4 space-y-4" onDone={() => setAddOpen(false)}>
          <input type="hidden" name="gameId" value={game.id} />
          <div>
            <label className="label">Nom du tier</label>
            <input name="name" required placeholder="ex : Liberation of Undermine" className="field" />
          </div>
          <div>
            <label className="label">Extension / contenu</label>
            <input name="expansion" placeholder="ex : The War Within" className="field" />
          </div>
          <button type="submit" className="btn-primary">Ajouter le tier</button>
        </ActionForm>
      </Modal>

      {game.tiers.length === 0 ? (
        <p className="text-muted">Aucun tier pour ce jeu.</p>
      ) : groups.length > EXPANSION_TAB_THRESHOLD ? (
        // Beaucoup d'extensions → sous-onglets (une extension à la fois).
        <AdminExpansionTabs key={game.id} game={game} groups={groups} showWcl={showWcl} showTimer={showTimer} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const grouped = group.expansion != null && group.tiers.length > 1;
            // Couleur propre à l'extension (à défaut, la couleur du jeu).
            const color = group.expansion ? expansionColor(group.expansion) : game.color;
            const body = (
              <div className={grouped ? 'space-y-3 border-l-2 pl-4' : 'space-y-3'} style={grouped ? { borderColor: `${color}55` } : undefined}>
                {group.tiers.map((tier) => {
                  const open = firstTier;
                  firstTier = false;
                  return (
                    <TierEditor
                      key={tier.id}
                      tier={tier}
                      color={color}
                      showWcl={showWcl}
                      showTimer={showTimer}
                      hideExpansion={grouped}
                      defaultOpen={open}
                    />
                  );
                })}
              </div>
            );

            if (!grouped) return <div key={group.expansion ?? '—'}>{body}</div>;
            return (
              <section key={group.expansion} className="space-y-3">
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
      )}
    </div>
  );
}

type ExpGroup = { expansion: string | null; tiers: AdminTier[] };

/** Sélecteur d'extension (pastilles) + édition d'une seule extension à la fois. */
function AdminExpansionTabs({
  game,
  groups,
  showWcl,
  showTimer,
}: {
  game: AdminProgGame;
  groups: ExpGroup[];
  showWcl: boolean;
  showTimer: boolean;
}) {
  const [activeKey, setActiveKey] = useState(groups[0]?.expansion ?? '—');
  const active = groups.find((g) => (g.expansion ?? '—') === activeKey) ?? groups[0];
  const activeColor = active.expansion ? expansionColor(active.expansion) : game.color;

  return (
    <div className="space-y-5">
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

      <div className="space-y-3">
        {active.tiers.map((tier, i) => (
          <TierEditor
            key={tier.id}
            tier={tier}
            color={activeColor}
            showWcl={showWcl}
            showTimer={showTimer}
            hideExpansion={Boolean(active.expansion)}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

/** Un tier repliable (en-tête résumé, contenu d'édition au déploiement). */
function TierEditor({
  tier,
  color,
  showWcl,
  showTimer,
  hideExpansion,
  defaultOpen,
}: {
  tier: AdminTier;
  color: string;
  showWcl: boolean;
  showTimer: boolean;
  hideExpansion: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const total = tier.bosses.length;
  const killed = tier.bosses.filter((b) => b.status === 'KILLED').length;

  return (
    <div className="card overflow-hidden">
      {/* En-tête repliable (style proche du site) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <h3 className="flex min-w-0 items-baseline gap-2 font-semibold text-title">
          <span className="truncate">{tier.name}</span>
          {!hideExpansion && tier.expansion && (
            <span className="shrink-0 text-sm font-normal" style={{ color }}>· {tier.expansion}</span>
          )}
        </h3>
        <div className="flex shrink-0 items-center gap-3">
          {showTimer && tier.timerDone && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              ⏱️ Timer
            </span>
          )}
          <span className="text-sm font-semibold" style={{ color }}>
            {killed}/{total}
          </span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={cn('text-muted transition-transform duration-200', open && 'rotate-180')}
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          {/* Métadonnées du tier (sauvegarde automatique) */}
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <AutoSaveForm action={updateTier} success="Tier enregistré" className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={tier.id} />
              <div>
                <label className="mb-1 block text-xs text-muted">Nom du tier</label>
                <input name="name" defaultValue={tier.name} className="field py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Extension</label>
                <input name="expansion" defaultValue={tier.expansion ?? ''} placeholder="ex : The War Within" className="field py-1.5 text-sm" />
              </div>
              {showWcl ? (
                <div>
                  <label className="mb-1 block text-xs text-muted">Zone ID (Warcraft Logs)</label>
                  <input name="zoneId" type="number" defaultValue={tier.zoneId ?? ''} placeholder="ex : 38" className="field w-28 py-1.5 text-sm" />
                </div>
              ) : (
                <input type="hidden" name="zoneId" value={tier.zoneId ?? ''} />
              )}
            </AutoSaveForm>

            <div className="flex items-center gap-3">
              {showTimer && (
                <ActionForm action={toggleTierTimer.bind(null, tier.id, !tier.timerDone)} success="Timer mis à jour">
                  <button
                    type="submit"
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      tier.timerDone
                        ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                        : 'border-border bg-white/5 text-muted'
                    }`}
                  >
                    ⏱️ Timer {tier.timerDone ? 'validé' : 'non validé'}
                  </button>
                </ActionForm>
              )}
              <ActionForm action={deleteTier.bind(null, tier.id)} success="Tier supprimé">
                <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce tier et tous ses boss ?">
                  Supprimer le tier
                </ConfirmButton>
              </ActionForm>
            </div>
          </div>

          {/* Boss — lignes compactes, sauvegarde automatique */}
          <div className="space-y-2">
            {tier.bosses.map((boss) => (
              <div key={boss.id} className="flex items-end gap-3 rounded-lg border border-border bg-ink-soft/40 p-3">
                <AutoSaveForm action={updateBoss} success="Boss enregistré" className="flex flex-1 flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={boss.id} />
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-xs text-muted">
                      <span className={`h-2 w-2 rounded-full ${BOSS_STATUS[boss.status].dot}`} />
                      Boss
                    </label>
                    <input name="name" defaultValue={boss.name} className="field w-40 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Statut</label>
                    <select name="status" defaultValue={boss.status} className="field py-1.5 text-sm">
                      <option value="UNTESTED">Non tenté</option>
                      <option value="PROGRESSING">En progression</option>
                      <option value="KILLED">Tué</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">1er kill</label>
                    <input type="date" name="firstKillDate" defaultValue={boss.firstKillDate} className="field py-1.5 text-sm" />
                  </div>
                  {showWcl ? (
                    <div>
                      <label className="mb-1 block text-xs text-muted">Encounter ID</label>
                      <input name="encounterId" type="number" defaultValue={boss.encounterId ?? ''} placeholder="ex : 3009" className="field w-24 py-1.5 text-sm" />
                    </div>
                  ) : (
                    <input type="hidden" name="encounterId" value={boss.encounterId ?? ''} />
                  )}
                  <div className="min-w-[200px] flex-1">
                    <ImageInput name="imageUrl" defaultValue={boss.imageUrl ?? ''} label="Image du boss" compact />
                  </div>
                </AutoSaveForm>
                <ActionForm action={deleteBoss.bind(null, boss.id)} success="Boss supprimé">
                  <ConfirmButton
                    className="rounded-md px-2 py-1.5 text-sm text-red-300 hover:bg-red-400/10 hover:text-red-200"
                    message="Supprimer ce boss ?"
                  >
                    🗑
                  </ConfirmButton>
                </ActionForm>
              </div>
            ))}
          </div>

          <ActionForm action={createBoss} success="Boss ajouté" className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="tierId" value={tier.id} />
            <input name="name" required placeholder="Nom du boss" className="field max-w-xs py-1.5 text-sm" />
            <button type="submit" className="btn-secondary py-2 text-sm">Ajouter un boss</button>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
