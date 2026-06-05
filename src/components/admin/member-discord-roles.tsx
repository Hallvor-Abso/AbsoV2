'use client';

import { useState, useTransition } from 'react';
import { useToast } from './toast';
import { fetchMemberDiscordRoles, saveMemberDiscordRoles } from '@/app/admin/actions';
import type { DiscordRoleItem } from '@/lib/bot';

const KIND_LABEL: Record<DiscordRoleItem['kind'], string> = {
  gm: 'GM',
  officier: 'Officier',
  roster: 'Roster',
  membre: 'Membre',
  recrue: 'Recrue',
};

/**
 * Gestion des rôles Discord d'un membre (lecture/écriture en direct via le bot).
 * Indépendant des grades du site : ne touche qu'aux rôles Discord structurés.
 */
export function MemberDiscordRoles({ discordId }: { discordId: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<
    { configured: boolean; found: boolean; roles: DiscordRoleItem[] } | null
  >(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMemberDiscordRoles(discordId);
      if (!data.configured) setState({ configured: false, found: false, roles: [] });
      else setState({ configured: true, found: data.found, roles: data.roles });
    } catch {
      toast('Impossible de charger les rôles Discord.', 'error');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) void load();
  }

  function setAssigned(key: string, value: boolean) {
    if (!state) return;
    const roles = state.roles.map((r) => (r.key === key ? { ...r, assigned: value } : r));
    setState({ ...state, roles });
    const assignedKeys = roles.filter((r) => r.assigned).map((r) => r.key);
    startTransition(async () => {
      try {
        const res = await saveMemberDiscordRoles(discordId, assignedKeys);
        if (res.warnings && res.warnings.length > 0) toast(res.warnings[0], 'error');
        else toast('Rôles Discord mis à jour');
      } catch {
        toast("Échec de la mise à jour, réessaie.", 'error');
        void load(); // resynchronise l'affichage avec l'état réel
      }
    });
  }

  // Regroupe : GM en premier, puis par jeu.
  const gm = state?.roles.filter((r) => r.kind === 'gm') ?? [];
  const byGame = new Map<string, { gameName: string; roles: DiscordRoleItem[] }>();
  for (const r of state?.roles ?? []) {
    if (!r.gameId) continue;
    const g = byGame.get(r.gameId) ?? { gameName: r.gameName ?? 'Jeu', roles: [] };
    g.roles.push(r);
    byGame.set(r.gameId, g);
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={toggle}
        className="text-sm font-medium text-accent hover:underline"
      >
        {open ? '▾' : '▸'} Rôles Discord
      </button>

      {open && (
        <div className="mt-3">
          {loading && <p className="text-sm text-muted">Chargement…</p>}

          {!loading && state && !state.configured && (
            <p className="text-sm text-muted">Bot Discord non configuré ou injoignable.</p>
          )}

          {!loading && state?.configured && !state.found && (
            <p className="text-sm text-amber-300">Ce membre n'est pas présent sur le serveur Discord.</p>
          )}

          {!loading && state?.configured && state.found && (
            <div className={`space-y-4 ${pending ? 'opacity-70' : ''}`}>
              {gm.map((r) => (
                <RoleCheckbox key={r.key} role={r} label="GM" onChange={setAssigned} />
              ))}
              {[...byGame.entries()].map(([gameId, g]) => (
                <div key={gameId}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{g.gameName}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {g.roles.map((r) => (
                      <RoleCheckbox key={r.key} role={r} label={KIND_LABEL[r.kind]} onChange={setAssigned} />
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted">
                Les modifications sont appliquées directement sur Discord. Un rôle grisé n'existe pas
                encore sur le serveur — crée-le sur Discord pour pouvoir l'attribuer.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleCheckbox({
  role,
  label,
  onChange,
}: {
  role: DiscordRoleItem;
  label: string;
  onChange: (key: string, value: boolean) => void;
}) {
  const missing = role.roleId == null;
  return (
    <label
      className={`flex items-center gap-1.5 text-sm ${missing ? 'cursor-not-allowed text-muted/60' : 'text-foreground'}`}
      title={missing ? `Rôle « ${role.name} » à créer sur Discord` : role.name}
    >
      <input
        type="checkbox"
        checked={role.assigned}
        disabled={missing}
        onChange={(e) => onChange(role.key, e.target.checked)}
        className="h-4 w-4 accent-[#4A9EFF]"
      />
      {label}
    </label>
  );
}
