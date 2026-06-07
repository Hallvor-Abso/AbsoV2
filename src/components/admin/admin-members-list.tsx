'use client';

import { useMemo, useState } from 'react';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { MemberDiscordRoles } from './member-discord-roles';
import { updateMember, deleteMember } from '@/app/admin/actions';
import { formatDate, cn } from '@/lib/utils';

const ROLE_LABEL: Record<string, string> = {
  VISITEUR: 'Visiteur',
  MEMBRE: 'Membre',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_BADGE: Record<string, string> = {
  VISITEUR: 'border-border text-muted',
  MEMBRE: 'border-border text-foreground',
  ADMIN: 'border-accent/40 bg-accent/10 text-accent',
  SUPER_ADMIN: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
};

export type AdminMember = {
  id: string;
  name: string;
  email: string | null;
  discord: string | null;
  discordId: string | null;
  role: string;
  createdAt: string; // ISO
  adminGameIds: string[];
};

/** Liste des membres : recherche + lignes compactes dépliables. */
export function AdminMembersList({
  members,
  games,
  isSuper,
  myId,
}: {
  members: AdminMember[];
  games: { id: string; name: string }[];
  isSuper: boolean;
  myId: string;
}) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.email, m.discord].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [members, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un membre (pseudo, email, Discord)…"
          className="field max-w-sm py-2 text-sm"
        />
        <span className="text-sm text-muted">{filtered.length} membre(s)</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted">Aucun membre trouvé.</p>
      ) : (
        <div className="card divide-y divide-border">
          {filtered.map((u) => {
            const open = openId === u.id;
            return (
              <div key={u.id}>
                {/* Ligne compacte */}
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : u.id)}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-title">{u.name}</p>
                    <p className="truncate text-xs text-muted">
                      {u.email || '—'}
                      {u.discord ? ` · Discord : ${u.discord}` : ' · Discord non lié'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {u.adminGameIds.length > 0 && (
                      <span className="hidden rounded-full border border-accent/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent sm:inline">
                        Admin jeu
                      </span>
                    )}
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', ROLE_BADGE[u.role])}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={cn('text-muted transition-transform', open && 'rotate-180')}
                    >
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {/* Détails dépliables */}
                {open && (
                  <div className="border-t border-border bg-ink-soft/30 p-4">
                    <p className="mb-3 text-xs text-muted">Inscrit le {formatDate(u.createdAt)}</p>

                    <ActionForm action={updateMember} success="Membre enregistré" className="space-y-3">
                      <input type="hidden" name="id" value={u.id} />
                      <div className="flex flex-wrap items-end gap-4">
                        <div>
                          <label className="mb-1 block text-xs text-muted">Rôle</label>
                          <select name="role" defaultValue={u.role} className="field py-1.5 text-sm">
                            <option value="VISITEUR">Visiteur</option>
                            <option value="MEMBRE">Membre</option>
                            <option value="ADMIN">Admin</option>
                            {isSuper && <option value="SUPER_ADMIN">Super Admin</option>}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-xs text-muted">
                            Admin de jeu (accès panel limité à ces jeux)
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {games.length === 0 && <span className="text-sm text-muted">Aucun jeu.</span>}
                            {games.map((g) => (
                              <label key={g.id} className="flex items-center gap-1.5 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  name="gameIds"
                                  value={g.id}
                                  defaultChecked={u.adminGameIds.includes(g.id)}
                                  className="h-4 w-4 accent-[#4A9EFF]"
                                />
                                {g.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                      </div>
                    </ActionForm>

                    {u.discordId ? (
                      <MemberDiscordRoles discordId={u.discordId} />
                    ) : (
                      <p className="mt-3 border-t border-border pt-3 text-xs text-muted">
                        Compte non lié à Discord — la « Connexion Discord » est requise pour gérer ses rôles.
                      </p>
                    )}

                    {myId !== u.id && (
                      <ActionForm action={deleteMember.bind(null, u.id)} success="Compte supprimé" className="mt-3">
                        <ConfirmButton message="Supprimer définitivement ce compte ?">
                          Supprimer le compte
                        </ConfirmButton>
                      </ActionForm>
                    )}
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
