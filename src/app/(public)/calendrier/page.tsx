import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { CalendarView, type CalendarEvent } from '@/components/calendar-view';
import { getVisibleGames, getEvents } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Calendrier',
  description: 'Les raids et événements à venir de la guilde Absolution.',
};

export default async function CalendarPage() {
  const [games, events] = await Promise.all([getVisibleGames(), getEvents()]);

  const calendarEvents: CalendarEvent[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    description: ev.description,
    startDate: ev.startDate.toISOString(),
    endDate: ev.endDate ? ev.endDate.toISOString() : null,
    type: ev.type,
    gameId: ev.gameId,
    gameName: ev.game.name,
    gameColor: ev.game.color,
  }));

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Planning"
        title="Calendrier"
        subtitle="Raids, soirées et événements de la guilde. Choisis un jeu, puis clique sur un événement pour les détails."
        className="mb-12"
      />
      {games.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible pour le moment.</p>
      ) : (
        <CalendarView
          events={calendarEvents}
          games={games.map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            logoUrl: g.logoUrl,
            status: g.status,
          }))}
        />
      )}
    </div>
  );
}
