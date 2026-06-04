import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { ActionForm } from '@/components/admin/action-form';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { canManageGlobally, ROLE_LABELS } from '@/lib/permissions';
import { formatDate } from '@/lib/utils';
import { updateMember, deleteMember } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  const me = await getAppUser();
  if (!canManageGlobally(me)) redirect('/admin');
  const isSuper = me!.role === 'SUPER_ADMIN';

  const [users, games] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { adminGames: { select: { id: true } } },
    }),
    prisma.game.findMany({ orderBy: { order: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Membres"
        description="Gère les rôles des comptes. « Admin de jeu » donne accès au panel pour les jeux cochés uniquement."
      />

      <div className="space-y-4">
        {users.map((u) => {
          const adminGameIds = u.adminGames.map((g) => g.id);
          return (
            <div key={u.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-title">
                    {u.displayName || u.username || u.email || 'Compte'}
                  </p>
                  <p className="text-xs text-muted">
                    {u.email || u.username} · {u.discord ? `Discord : ${u.discord} · ` : ''}
                    Inscrit le {formatDate(u.createdAt)}
                  </p>
                </div>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {ROLE_LABELS[u.role]}
                </span>
              </div>

              <ActionForm action={updateMember} success="Membre enregistré" className="space-y-3 border-t border-border pt-4">
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
                            defaultChecked={adminGameIds.includes(g.id)}
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

              {me!.id !== u.id && (
                <ActionForm action={deleteMember.bind(null, u.id)} success="Compte supprimé" className="mt-2">
                  <ConfirmButton message="Supprimer définitivement ce compte ?">
                    Supprimer le compte
                  </ConfirmButton>
                </ActionForm>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
