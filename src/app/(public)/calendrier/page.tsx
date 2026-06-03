import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/section-heading';
import { CalendarView, type CalendarEvent } from '@/components/calendar-view';
import { getVisibleGames, getEvents } from '@/lib/data';
import { getAppUser } from '@/lib/auth';
import { canAccessCalendar } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'Calendrier',
  description: 'Les raids et événements à venir de la guilde Absolution.',
};

export default async function CalendarPage() {
  // Le Calendrier est réservé aux membres (et plus).
  const user = await getAppUser();
  if (!canAccessCalendar(user)) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <SectionHeading
          eyebrow="Accès réservé"
          title="Calendrier réservé aux membres"
          subtitle="Le calendrier des raids et événements est accessible aux membres de la guilde."
          align="center"
          className="mb-8"
        />
        <div className="flex gap-3">
          {user ? (
            <Link href="/recrutement" className="btn-primary">Devenir membre</Link>
          ) : (
            <>
              <Link href="/connexion" className="btn-primary">Se connecter</Link>
              <Link href="/inscription" className="btn-secondary">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    );
  }

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
