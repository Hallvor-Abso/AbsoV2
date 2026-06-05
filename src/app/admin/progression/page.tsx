import { PageHeader } from '@/components/admin/page-header';
import {
  AdminProgressionManager,
  type AdminProgGame,
} from '@/components/admin/admin-progression-manager';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/** Convertit une date en valeur d'input "date" (YYYY-MM-DD). */
function toDateInput(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default async function AdminProgressionPage() {
  // Tous les jeux (actifs ET à venir) ont leur onglet ; un nouveau jeu apparaît seul.
  const scope = allowedGameIds(await getAppUser());
  const games = await prisma.game.findMany({
    where: scope !== 'all' ? { id: { in: scope } } : {},
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
    include: {
      raidTiers: {
        // Chronologique : plus récent (dernier ajouté) en premier.
        orderBy: { createdAt: 'desc' },
        include: { bosses: { orderBy: { order: 'asc' } } },
      },
    },
  });

  const data: AdminProgGame[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    color: g.color,
    logoUrl: g.logoUrl,
    status: g.status,
    tiers: g.raidTiers.map((t) => ({
      id: t.id,
      name: t.name,
      expansion: t.expansion,
      zoneId: t.zoneId,
      timerDone: t.timerDone,
      bosses: t.bosses.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.status,
        firstKillDate: toDateInput(b.firstKillDate),
        imageUrl: b.imageUrl,
        encounterId: b.encounterId,
      })),
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Progression"
        description="Gère les tiers de raid et les boss, séparés par jeu (onglets)."
      />
      {data.length === 0 ? (
        <p className="text-muted">Crée d'abord un jeu dans l'onglet « Jeux ».</p>
      ) : (
        <AdminProgressionManager games={data} />
      )}
    </div>
  );
}
