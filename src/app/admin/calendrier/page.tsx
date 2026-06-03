import { PageHeader } from '@/components/admin/page-header';
import { AdminCalendarManager, type AdminEvent } from '@/components/admin/admin-calendar-manager';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/** Formate une date pour un champ <input type="datetime-local"> (heure locale). */
function toDateTimeInput(d: Date | null): string {
  if (!d) return '';
  const date = new Date(d);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminCalendarPage() {
  const scope = allowedGameIds(await getAppUser());
  const gameWhere = scope !== 'all' ? { id: { in: scope } } : {};
  const eventWhere = scope !== 'all' ? { gameId: { in: scope } } : {};

  const [events, games] = await Promise.all([
    prisma.event.findMany({ where: eventWhere, orderBy: { startDate: 'desc' } }),
    // Tous les jeux (un nouveau jeu crée automatiquement son onglet calendrier).
    prisma.game.findMany({ where: gameWhere, orderBy: [{ status: 'asc' }, { order: 'asc' }] }),
  ]);

  const adminEvents: AdminEvent[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    type: ev.type,
    gameId: ev.gameId,
    startDate: toDateTimeInput(ev.startDate),
    endDate: toDateTimeInput(ev.endDate),
  }));

  return (
    <div>
      <PageHeader title="Calendrier" description="Crée et gère les événements, séparés par jeu." />
      {games.length === 0 ? (
        <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>
      ) : (
        <AdminCalendarManager
          games={games.map((g) => ({ id: g.id, name: g.name, color: g.color, logoUrl: g.logoUrl, status: g.status }))}
          events={adminEvents}
        />
      )}
    </div>
  );
}
