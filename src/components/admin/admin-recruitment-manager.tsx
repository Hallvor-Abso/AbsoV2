'use client';

import { useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import {
  createRecruitRole,
  updateRecruitRole,
  deleteRecruitRole,
  addRecruitClass,
  cycleSlotStatus,
  deleteSlot,
} from '@/app/admin/actions';

type Status = 'OPEN' | 'LIMITED' | 'CLOSED';
export type AdminSlot = { id: string; role: string; className: string; status: Status };
export type AdminRole = { id: string; name: string; description: string | null };
export type AdminRecruitGame = GameTabInfo & { roles: AdminRole[]; slots: AdminSlot[] };

// Couleurs des boutons de classe selon le statut (cycle au clic).
const BTN: Record<Status, string> = {
  OPEN: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
  CLOSED: 'border-red-500/50 bg-red-500/15 text-red-300 hover:bg-red-500/25',
  LIMITED: 'border-amber-400/50 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25',
};

/** Recrutement par jeu : rôles libres + classes en boutons cliquables. */
export function AdminRecruitmentManager({ games }: { games: AdminRecruitGame[] }) {
  const [activeId, setActiveId] = useState(games[0]?.id);
  const game = games.find((g) => g.id === activeId) ?? games[0];
  if (!game) return <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>;

  // Liste des rôles : ceux créés + d'éventuels rôles orphelins issus d'anciens postes.
  const roleNames = [
    ...game.roles.map((r) => r.name),
    ...game.slots.map((s) => s.role).filter((n) => !game.roles.some((r) => r.name === n)),
  ];
  const uniqueRoles = Array.from(new Set(roleNames));

  return (
    <div>
      <GameTabBar games={games} activeId={game.id} onSelect={setActiveId} />

      <p className="mb-5 text-sm text-muted">
        Clique sur une classe pour faire défiler son statut :
        <span className="mx-1 text-emerald-300">Ouvert</span> →
        <span className="mx-1 text-red-300">Fermé</span> →
        <span className="mx-1 text-amber-300">Limité</span>.
      </p>

      {/* Rôles + classes */}
      <div className="space-y-4">
        {uniqueRoles.map((roleName) => {
          const role = game.roles.find((r) => r.name === roleName);
          const slots = game.slots.filter((s) => s.role === roleName);
          return (
            <div key={roleName} className="card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">{roleName}</h3>
                {role && (
                  <form action={deleteRecruitRole.bind(null, role.id)}>
                    <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message={`Supprimer le rôle « ${roleName} » et ses classes ?`}>
                      Supprimer le rôle
                    </ConfirmButton>
                  </form>
                )}
              </div>

              {/* Description de la catégorie (éditable) */}
              {role && (
                <form action={updateRecruitRole} className="mb-4">
                  <input type="hidden" name="id" value={role.id} />
                  <input type="hidden" name="name" value={role.name} />
                  <label className="label">Description de la catégorie</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={role.description ?? ''}
                    placeholder="Ex : Nous cherchons un tank principal fiable pour le roster mythique…"
                    className="field text-sm"
                  />
                  <button type="submit" className="btn-secondary mt-2 py-1.5 text-sm">
                    Enregistrer la description
                  </button>
                </form>
              )}

              {/* Classes en boutons cliquables */}
              <div className="flex flex-wrap items-center gap-2.5">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex items-center">
                    <form action={cycleSlotStatus.bind(null, slot.id)}>
                      <button
                        type="submit"
                        title="Cliquer pour changer le statut"
                        className={`rounded-l-lg border py-2 pl-3.5 pr-2.5 text-sm font-semibold transition-colors ${BTN[slot.status]}`}
                      >
                        {slot.className}
                      </button>
                    </form>
                    <form action={deleteSlot.bind(null, slot.id)}>
                      <button
                        type="submit"
                        title="Supprimer cette classe"
                        className={`rounded-r-lg border border-l-0 py-2 px-2 text-sm transition-colors ${BTN[slot.status]} opacity-70 hover:opacity-100`}
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              {/* Ajouter une classe au rôle */}
              <form action={addRecruitClass} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="role" value={roleName} />
                <input name="className" required placeholder="Ajouter une classe / spé (ex : Mage Givre)" className="field max-w-xs py-1.5 text-sm" />
                <button type="submit" className="btn-secondary py-2 text-sm">Ajouter</button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Créer une nouvelle catégorie de rôle */}
      <div className="card mt-6 p-5">
        <p className="mb-3 text-sm font-medium text-foreground">Créer une catégorie de rôle</p>
        <form action={createRecruitRole} className="space-y-2">
          <input type="hidden" name="gameId" value={game.id} />
          <input name="name" required placeholder="Nom de la catégorie (Tank, Heal, DPS Distance...)" className="field max-w-xs py-1.5 text-sm" />
          <textarea name="description" rows={2} placeholder="Description (optionnelle) de la catégorie" className="field text-sm" />
          <button type="submit" className="btn-primary py-2 text-sm">Créer la catégorie</button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Une fois créée, ajoute des classes/spés dans son cadre : ce sont des boutons cliquables qui font défiler le statut.
        </p>
      </div>
    </div>
  );
}
