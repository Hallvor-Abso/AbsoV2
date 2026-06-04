'use client';

import { useState, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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

// Couleurs des boutons de spécialisation selon le statut (cycle au clic).
const BTN: Record<Status, string> = {
  OPEN: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
  CLOSED: 'border-red-500/50 bg-red-500/15 text-red-300 hover:bg-red-500/25',
  LIMITED: 'border-amber-400/50 bg-amber-400/15 text-amber-300 hover:bg-amber-400/25',
};

/**
 * Gestion du recrutement par jeu, présentée comme un éditeur de rôles :
 * chaque rôle (catégorie) a un nom, des spécialisations en boutons cliquables
 * (cycle de statut) et une description.
 */
export function AdminRecruitmentManager({ games }: { games: AdminRecruitGame[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(games[0]?.id);
  const [creating, setCreating] = useState(false);
  const game = games.find((g) => g.id === activeId) ?? games[0];
  if (!game) return <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>;

  // Rôles : ceux créés + d'éventuels rôles orphelins issus d'anciens postes.
  const roleNames = [
    ...game.roles.map((r) => r.name),
    ...game.slots.map((s) => s.role).filter((n) => !game.roles.some((r) => r.name === n)),
  ];
  const uniqueRoles = Array.from(new Set(roleNames));

  return (
    <div>
      {/* Barre d'actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => setCreating((v) => !v)} className="btn-primary py-2 text-sm">
          + Nouveau rôle
        </button>
        <button onClick={() => router.refresh()} className="btn-secondary py-2 text-sm">
          ↻ Actualiser
        </button>
      </div>

      {/* Création d'une catégorie de rôle (repliable) */}
      {creating && (
        <div className="card mb-6 p-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted">
            Nouveau rôle
          </p>
          <form
            action={async (fd) => {
              await createRecruitRole(fd);
              setCreating(false);
            }}
            className="space-y-3"
          >
            <input type="hidden" name="gameId" value={game.id} />
            <div>
              <label className="label">Nom du rôle *</label>
              <input
                name="name"
                required
                placeholder="Tank, Heal, DPS Distance…"
                className="field py-2 text-sm"
              />
            </div>
            <div>
              <label className="label">Description (notes)</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Informations complémentaires sur la catégorie…"
                className="field text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary py-2 text-sm">Créer le rôle</button>
              <button type="button" onClick={() => setCreating(false)} className="btn-secondary py-2 text-sm">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <GameTabBar games={games} activeId={game.id} onSelect={setActiveId} />

      {/* Éditeurs de rôle */}
      {uniqueRoles.length === 0 ? (
        <p className="card p-8 text-center text-muted">
          Aucun rôle pour ce jeu. Clique sur « + Nouveau rôle » pour en créer un.
        </p>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {uniqueRoles.map((roleName) => {
            const role = game.roles.find((r) => r.name === roleName);
            const slots = game.slots.filter((s) => s.role === roleName);
            return (
              <div key={roleName} className="card p-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Modifier le rôle
                </p>

                {/* Nom + notes : un seul formulaire (les spés ont leurs propres
                    formulaires, donc placées en dehors pour éviter l'imbrication). */}
                {role ? (
                  <form action={updateRecruitRole} className="space-y-4">
                    <input type="hidden" name="id" value={role.id} />
                    <div>
                      <label className="label">Nom du rôle *</label>
                      <input name="name" required defaultValue={role.name} className="field py-2 text-sm" />
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={role.description ?? ''}
                        placeholder="Informations complémentaires…"
                        className="field text-sm"
                      />
                    </div>
                    <button type="submit" className="btn-primary py-2 text-sm">💾 Sauvegarder</button>
                  </form>
                ) : (
                  <div>
                    <label className="label">Nom du rôle</label>
                    <input disabled defaultValue={roleName} className="field py-2 text-sm opacity-70" />
                  </div>
                )}

                {/* Spécialisations (boutons cliquables) */}
                <div className="mt-4">
                  <SpecSection gameId={game.id} roleName={roleName} slots={slots} />
                </div>

                {/* Suppression du rôle */}
                {role && (
                  <div className="mt-5 border-t border-border pt-4">
                    <form action={deleteRecruitRole.bind(null, role.id)}>
                      <ConfirmButton
                        className="text-xs text-red-300 hover:text-red-200"
                        message={`Supprimer le rôle « ${roleName} » et ses spécialisations ?`}
                      >
                        Supprimer le rôle
                      </ConfirmButton>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Cycle de statut côté client (identique au serveur) : Ouvert → Fermé → Limité → …
const NEXT_STATUS: Record<Status, Status> = { OPEN: 'CLOSED', CLOSED: 'LIMITED', LIMITED: 'OPEN' };

/** Section « Spécialisations » : légende, boutons cliquables (cycle), ajout. */
function SpecSection({
  gameId,
  roleName,
  slots,
}: {
  gameId: string;
  roleName: string;
  slots: AdminSlot[];
}) {
  const [, startTransition] = useTransition();
  // Mise à jour optimiste : la couleur change instantanément, l'enregistrement
  // serveur se fait en arrière-plan (plus d'attente de 2-3 s).
  const [optimisticSlots, setOptimistic] = useOptimistic(
    slots,
    (state, next: { id: string; status: Status }) =>
      state.map((s) => (s.id === next.id ? { ...s, status: next.status } : s)),
  );

  const cycle = (slot: AdminSlot) => {
    const status = NEXT_STATUS[slot.status];
    startTransition(async () => {
      setOptimistic({ id: slot.id, status });
      await cycleSlotStatus(slot.id);
    });
  };

  return (
    <div>
      <label className="label">Spécialisations</label>
      <p className="mb-3 text-xs text-muted">
        1 clic = <span className="text-emerald-300">Ouvert</span> · 2 clics ={' '}
        <span className="text-red-300">Fermé</span> · 3 clics ={' '}
        <span className="text-amber-300">Limité</span>
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        {optimisticSlots.map((slot) => (
          <div key={slot.id} className="flex items-center">
            <button
              type="button"
              onClick={() => cycle(slot)}
              title="Cliquer pour changer le statut"
              className={`rounded-l-lg border py-2 pl-3.5 pr-2.5 text-sm font-semibold transition-colors ${BTN[slot.status]}`}
            >
              {slot.className}
            </button>
            <form action={deleteSlot.bind(null, slot.id)}>
              <button
                type="submit"
                title="Supprimer cette spécialisation"
                className={`rounded-r-lg border border-l-0 px-2 py-2 text-sm transition-colors ${BTN[slot.status]} opacity-70 hover:opacity-100`}
              >
                ✕
              </button>
            </form>
          </div>
        ))}
        {optimisticSlots.length === 0 && (
          <span className="text-sm text-muted">Aucune spécialisation pour le moment.</span>
        )}
      </div>

      {/* Ajouter une spécialisation */}
      <form action={addRecruitClass} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="gameId" value={gameId} />
        <input type="hidden" name="role" value={roleName} />
        <input
          name="className"
          required
          placeholder="Ajouter une spécialisation (ex : Mage Givre)"
          className="field max-w-xs py-1.5 text-sm"
        />
        <button type="submit" className="btn-secondary py-1.5 text-sm">+ Ajouter</button>
      </form>
    </div>
  );
}
