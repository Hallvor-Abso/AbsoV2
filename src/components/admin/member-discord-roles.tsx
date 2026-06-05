'use client';

import { useState, useTransition } from 'react';
import { useToast } from './toast';
import { fetchMemberDiscordRoles, saveMemberDiscordRoles } from '@/app/admin/actions';
import type { DiscordRoleItem } from '@/lib/bot';

const KIND_LABEL: Record<DiscordRoleItem['kind'], string> = {
  gm: 'GM',
  visiteur: 'Visiteur',
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
    { status: 'unconfigured' | 'unreachable' | 'ok'; found: boolean; roles: DiscordRoleItem[] } | null
  >(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMemberDiscordRoles(discordId);
      if (data.status !== 'ok') setState({ status: data.status, found: false, roles: [] });
      else setState({ status: 'ok', found: data.found, roles: data.roles });
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
    // Changement optimiste, puis on reflète l'état NORMALISÉ renvoyé par le bot
    // (cumul des grades + exclusions Recrue/Visiteur).
    const optimistic = state.roles.map((r) => (r.key === key ? { ...r, assigned: value } : r));
    setState({ ...state, roles: optimistic });
    const assignedKeys = optimistic.filter((r) => r.assigned).map((r) => r.key);
    startTransition(async () => {
      try {
        const res = await saveMemberDiscordRoles(discordId, assignedKeys);
        if (res.assignedKeys) {
          const final = new Set(res.assignedKeys);
          setState((s) => (s ? { ...s, roles: s.roles.map((r) => ({ ...r, assigned: final.has(r.key) })) } : s));
        }
        if (res.warnings && res.warnings.length > 0) toast(res.warnings[0], 'error');
        else toast('Rôles Discord mis à jour');
      } catch {
        toast('Échec de la mise à jour, réessaie.', 'error');
        void load(); // resynchronise l'affichage avec l'état réel
      }
    });
  }

  // Regroupe : rôles globaux (GM, Visiteur) en premier, puis par jeu.
  const globals = state?.roles.filter((r) => !r.gameId) ?? [];
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

          {!loading && state?.status === 'unconfigured' && (
            <p className="text-sm text-muted">
              Canal site → bot non configuré : ajoute <code>BOT_URL</code> et{' '}
              <code>BOT_HTTP_SECRET</code> dans les variables d'environnement du site.
            </p>
          )}

          {!loading && state?.status === 'unreachable' && (
            <p className="text-sm text-amber-300">
              Bot injoignable en HTTP. Vérifie que le service bot expose une URL publique
              (<code>BOT_URL</code>), que le port HTTP est ouvert, et que{' '}
              <code>BOT_HTTP_SECRET</code> est identique côté site et côté bot.
            </p>
          )}

          {!loading && state?.status === 'ok' && !state.found && (
            <p className="text-sm text-amber-300">Ce membre n'est pas présent sur le serveur Discord.</p>
          )}

          {!loading && state?.status === 'ok' && state.found && (
            <div className={`space-y-4 ${pending ? 'opacity-70' : ''}`}>
              {globals.length > 0 && (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {globals.map((r) => (
                    <RoleCheckbox key={r.key} role={r} label={KIND_LABEL[r.kind]} onChange={setAssigned} />
                  ))}
                </div>
              )}
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
