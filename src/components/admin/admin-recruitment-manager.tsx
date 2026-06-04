'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { SLOT_STATUS } from '@/lib/labels';
import { saveSlot, deleteSlot } from '@/app/admin/actions';

export type AdminSlot = {
  id: string;
  role: string;
  className: string;
  status: keyof typeof SLOT_STATUS;
  order: number;
};
export type AdminRecruitGame = GameTabInfo & { slots: AdminSlot[] };

/** Gestion du recrutement, séparée par jeu (un onglet par jeu). */
export function AdminRecruitmentManager({ games }: { games: AdminRecruitGame[] }) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const game = games.find((g) => g.id === activeId) ?? games[0];
  if (!game) return <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>;

  return (
    <div>
      <GameTabBar games={games} activeId={game.id} onSelect={setActiveId} />

      {/* Postes existants */}
      <div className="mb-6 space-y-3">
        {game.slots.length === 0 && <p className="text-muted">Aucun poste pour ce jeu.</p>}
        {game.slots.map((slot) => (
          <div key={slot.id} className="card p-4">
            <form action={saveSlot} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={slot.id} />
              <input type="hidden" name="gameId" value={game.id} />
              <div>
                <label className="mb-1 block text-xs text-muted">Rôle</label>
                <input name="role" defaultValue={slot.role} className="field py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Classe</label>
                <input name="className" defaultValue={slot.className} className="field py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Statut</label>
                <select name="status" defaultValue={slot.status} className="field py-1.5 text-sm">
                  <option value="OPEN">Ouvert</option>
                  <option value="LIMITED">Limité</option>
                  <option value="CLOSED">Fermé</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Ordre</label>
                <input name="order" type="number" defaultValue={slot.order} className="field w-20 py-1.5 text-sm" />
              </div>
              <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
              <span className={`ml-auto inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SLOT_STATUS[slot.status].badge}`}>
                {SLOT_STATUS[slot.status].label}
              </span>
            </form>
            <form action={deleteSlot.bind(null, slot.id)} className="mt-2">
              <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce poste ?">
                Supprimer le poste
              </ConfirmButton>
            </form>
          </div>
        ))}
      </div>

      {/* Nouveau poste */}
      <div className="card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Ajouter un poste</p>
        <form action={saveSlot} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="gameId" value={game.id} />
          <div>
            <label className="mb-1 block text-xs text-muted">Rôle</label>
            <input name="role" required placeholder="DPS, Heal, Tank" className="field py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Classe</label>
            <input name="className" required placeholder="Mage, Prêtre..." className="field py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Statut</label>
            <select name="status" defaultValue="OPEN" className="field py-1.5 text-sm">
              <option value="OPEN">Ouvert</option>
              <option value="LIMITED">Limité</option>
              <option value="CLOSED">Fermé</option>
            </select>
          </div>
          <button type="submit" className="btn-primary py-2 text-sm">Ajouter</button>
        </form>
      </div>
    </div>
  );
}
