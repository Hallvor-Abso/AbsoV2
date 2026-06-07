import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { AdminMembersList, type AdminMember } from '@/components/admin/admin-members-list';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { canManageGlobally } from '@/lib/permissions';

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

  const members: AdminMember[] = users.map((u) => ({
    id: u.id,
    name: u.displayName || u.username || u.email || 'Compte',
    email: u.email,
    discord: u.discord,
    discordId: u.discordId,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    adminGameIds: u.adminGames.map((g) => g.id),
  }));

  return (
    <div>
      <PageHeader
        title="Membres"
        description="Gère les rôles des comptes. « Admin de jeu » donne accès au panel pour les jeux cochés uniquement."
      />
      <AdminMembersList
        members={members}
        games={games.map((g) => ({ id: g.id, name: g.name }))}
        isSuper={isSuper}
        myId={me!.id}
      />
    </div>
  );
}
