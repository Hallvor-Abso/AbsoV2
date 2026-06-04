'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { ImageInput } from './image-input';
import { BOSS_STATUS } from '@/lib/labels';
import {
  createTier,
  updateTier,
  deleteTier,
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
export type AdminTier = { id: string; name: string; zoneId: number | null; bosses: AdminBoss[] };
export type AdminProgGame = GameTabInfo & { tiers: AdminTier[] };

/** Gestion de la progression, séparée par jeu (un onglet par jeu). */
export function AdminProgressionManager({ games }: { games: AdminProgGame[] }) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const game = games.find((g) => g.id === activeId) ?? games[0];
  if (!game) return <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>;

  return (
    <div>
      <GameTabBar games={games} activeId={game.id} onSelect={setActiveId} />

      {/* Ajout d'un tier */}
      <ActionForm action={createTier} success="Tier ajouté" className="mb-6 flex flex-wrap gap-3">
        <input type="hidden" name="gameId" value={game.id} />
        <input name="name" required placeholder="Nom du tier (ex : Liberation of Undermine)" className="field max-w-md" />
        <button type="submit" className="btn-secondary">Ajouter un tier</button>
      </ActionForm>

      <div className="space-y-6">
        {game.tiers.length === 0 && <p className="text-muted">Aucun tier pour ce jeu.</p>}
        {game.tiers.map((tier) => (
          <div key={tier.id} className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-title">{tier.name}</h3>
              <div className="flex items-center gap-4">
                <ActionForm action={updateTier} success="Tier enregistré" className="flex items-end gap-2">
                  <input type="hidden" name="id" value={tier.id} />
                  <div>
                    <label className="mb-1 block text-xs text-muted">Zone ID (Warcraft Logs)</label>
                    <input name="zoneId" type="number" defaultValue={tier.zoneId ?? ''} placeholder="ex : 38" className="field w-28 py-1.5 text-sm" />
                  </div>
                  <button type="submit" className="btn-secondary py-2 text-sm">OK</button>
                </ActionForm>
                <ActionForm action={deleteTier.bind(null, tier.id)} success="Tier supprimé">
                  <ConfirmButton message="Supprimer ce tier et tous ses boss ?">Supprimer le tier</ConfirmButton>
                </ActionForm>
              </div>
            </div>

            <div className="space-y-2">
              {tier.bosses.map((boss) => (
                <div key={boss.id} className="rounded-lg border border-border bg-ink-soft/40 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${BOSS_STATUS[boss.status].dot}`} />
                    <span className="font-medium text-foreground">{boss.name}</span>
                  </div>
                  <ActionForm action={updateBoss} success="Boss enregistré" className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={boss.id} />
                    <div>
                      <label className="mb-1 block text-xs text-muted">Statut</label>
                      <select name="status" defaultValue={boss.status} className="field py-1.5 text-sm">
                        <option value="UNTESTED">Non tenté</option>
                        <option value="PROGRESSING">En progression</option>
                        <option value="KILLED">Tué</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Date de premier kill</label>
                      <input type="date" name="firstKillDate" defaultValue={boss.firstKillDate} className="field py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Encounter ID (WCL)</label>
                      <input name="encounterId" type="number" defaultValue={boss.encounterId ?? ''} placeholder="ex : 3009" className="field w-28 py-1.5 text-sm" />
                    </div>
                    <div className="min-w-[240px] flex-1">
                      <ImageInput name="imageUrl" defaultValue={boss.imageUrl ?? ''} label="Image du boss" />
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                  </ActionForm>
                  <ActionForm action={deleteBoss.bind(null, boss.id)} success="Boss supprimé" className="mt-2">
                    <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce boss ?">
                      Supprimer le boss
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
        ))}
      </div>
    </div>
  );
}
