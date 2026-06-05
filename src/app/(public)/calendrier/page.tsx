import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/section-heading';
import { CalendarView, type CalendarEvent } from '@/components/calendar-view';
import { getVisibleGames, getEvents } from '@/lib/data';
import { getAppUser } from '@/lib/auth';
import { canAccessCalendar } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Calendrier',
  description: 'Les raids et événements à venir de la guilde Absolution.',
};

const DISCORD_NOTICE: Record<string, { ok: boolean; text: string }> = {
  ok: { ok: true, text: 'Compte Discord lié ! Tu peux maintenant t’inscrire aux événements depuis le site.' },
  taken: { ok: false, text: 'Ce compte Discord est déjà relié à un autre membre.' },
  config: { ok: false, text: 'La connexion Discord n’est pas encore configurée sur le site.' },
  error: { ok: false, text: 'La liaison Discord a échoué. Réessaie.' },
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { discord?: string };
}) {
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

  const [games, events, me] = await Promise.all([
    getVisibleGames(),
    getEvents(),
    user ? prisma.user.findUnique({ where: { id: user.id }, select: { discordId: true } }) : Promise.resolve(null),
  ]);

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
    signups: 'signups' in ev ? ev.signups.map((s) => ({ ...s })) : [],
  }));

  const notice = searchParams.discord ? DISCORD_NOTICE[searchParams.discord] : null;

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Planning"
        title="Calendrier"
        subtitle="Raids, soirées et événements de la guilde. Choisis un jeu, puis clique sur un événement pour t’inscrire."
        className="mb-8"
      />

      {notice && (
        <div
          className={
            'mb-8 rounded-lg border px-4 py-3 text-sm ' +
            (notice.ok
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-300')
          }
        >
          {notice.text}
        </div>
      )}

      {games.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible pour le moment.</p>
      ) : (
        <CalendarView
          events={calendarEvents}
          discordLinked={Boolean(me?.discordId)}
          myDiscordId={me?.discordId ?? null}
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
