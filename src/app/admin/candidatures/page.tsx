import { PageHeader } from '@/components/admin/page-header';
import { AdminApplicationsView, type AdminApplication } from '@/components/admin/admin-applications-view';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminApplicationsPage() {
  const scope = allowedGameIds(await getAppUser());

  const [applications, games] = await Promise.all([
    prisma.application.findMany({
      where: scope !== 'all' ? { gameId: { in: scope } } : {},
      orderBy: { createdAt: 'desc' },
    }),
    prisma.game.findMany({
      where: scope !== 'all' ? { id: { in: scope } } : {},
      orderBy: { order: 'asc' },
    }),
  ]);

  const apps: AdminApplication[] = applications.map((a) => ({
    id: a.id,
    pseudo: a.pseudo,
    discord: a.discord,
    answers: Array.isArray(a.answers)
      ? (a.answers as { label: string; value: string }[])
      : null,
    characterId: a.characterId,
    className: a.className,
    role: a.role,
    server: a.server,
    experience: a.experience,
    availability: a.availability,
    logsUrl: a.logsUrl,
    motivation: a.motivation,
    status: a.status,
    internalNotes: a.internalNotes,
    createdAt: a.createdAt.toISOString(),
    gameId: a.gameId,
  }));

  return (
    <div>
      <PageHeader
        title="Candidatures"
        description="Candidatures séparées par jeu. Filtre par statut et traite chaque candidature."
      />
      {games.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible.</p>
      ) : (
        <AdminApplicationsView
          games={games.map((g) => ({ id: g.id, name: g.name, color: g.color, logoUrl: g.logoUrl, status: g.status }))}
          applications={apps}
        />
      )}
    </div>
  );
}
