import { PageHeader } from '@/components/admin/page-header';
import {
  AdminRecruitmentManager,
  type AdminRecruitGame,
} from '@/components/admin/admin-recruitment-manager';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminRecruitmentPage() {
  // Tous les jeux ont leur onglet de recrutement (un nouveau jeu apparaît seul).
  const scope = allowedGameIds(await getAppUser());
  const games = await prisma.game.findMany({
    where: scope !== 'all' ? { id: { in: scope } } : {},
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
    include: {
      recruitmentRoles: { orderBy: { order: 'asc' } },
      recruitmentSlots: { orderBy: { order: 'asc' } },
    },
  });

  const data: AdminRecruitGame[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    logoUrl: g.logoUrl,
    status: g.status,
    roles: g.recruitmentRoles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
    slots: g.recruitmentSlots.map((s) => ({
      id: s.id,
      role: s.role,
      className: s.className,
      status: s.status,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Recrutement"
        description="Crée des rôles par jeu, ajoute les classes, et clique pour changer leur statut."
      />
      {data.length === 0 ? (
        <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>
      ) : (
        <AdminRecruitmentManager games={data} />
      )}
    </div>
  );
}
