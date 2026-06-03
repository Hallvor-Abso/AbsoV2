import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { saveEvent, deleteEvent } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

/** Formate une date pour un champ <input type="datetime-local"> (heure locale). */
function toDateTimeInput(d: Date | null): string {
  if (!d) return '';
  const date = new Date(d);
  const off = date.getTimezoneOffset();
  const local = new Date(date.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminCalendarPage() {
  const [events, games] = await Promise.all([
    prisma.event.findMany({ orderBy: { startDate: 'desc' }, include: { game: true } }),
    prisma.game.findMany({ where: { status: 'ACTIVE' }, orderBy: { order: 'asc' } }),
  ]);

  const gameOptions = games.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div>
      <PageHeader title="Calendrier" description="Planifie les raids et événements." />

      {games.length === 0 && (
        <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>
      )}

      {games.length > 0 && (
        <>
          {/* Nouvel événement */}
          <div className="card mb-8 p-5">
            <p className="mb-4 text-sm font-medium text-foreground">Ajouter un événement</p>
            <EventForm games={gameOptions} />
          </div>

          {/* Événements existants */}
          <div className="space-y-4">
            {events.length === 0 && <p className="text-muted">Aucun événement.</p>}
            {events.map((ev) => (
              <div key={ev.id} className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-title">{ev.title}</h3>
                  <form action={deleteEvent.bind(null, ev.id)}>
                    <ConfirmButton message="Supprimer cet événement ?">Supprimer</ConfirmButton>
                  </form>
                </div>
                <EventForm
                  games={gameOptions}
                  event={{
                    id: ev.id,
                    title: ev.title,
                    description: ev.description,
                    type: ev.type,
                    gameId: ev.gameId,
                    startDate: toDateTimeInput(ev.startDate),
                    endDate: toDateTimeInput(ev.endDate),
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EventForm({
  games,
  event,
}: {
  games: { id: string; name: string }[];
  event?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    gameId: string;
    startDate: string;
    endDate: string;
  };
}) {
  return (
    <form action={saveEvent} className="space-y-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Titre</label>
          <input name="title" required defaultValue={event?.title} className="field" placeholder="Raid Mythique" />
        </div>
        <div>
          <label className="label">Jeu</label>
          <select name="gameId" required defaultValue={event?.gameId ?? ''} className="field">
            <option value="" disabled>Choisis un jeu</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Début</label>
          <input type="datetime-local" name="startDate" required defaultValue={event?.startDate} className="field" />
        </div>
        <div>
          <label className="label">Fin (optionnel)</label>
          <input type="datetime-local" name="endDate" defaultValue={event?.endDate} className="field" />
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" defaultValue={event?.type ?? 'RAID'} className="field">
            <option value="RAID">Raid</option>
            <option value="EVENT">Événement</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Description (optionnelle)</label>
        <textarea name="description" rows={2} defaultValue={event?.description ?? ''} className="field" placeholder="Détails de l'événement..." />
      </div>

      <button type="submit" className="btn-primary">
        {event ? 'Enregistrer' : "Ajouter l'événement"}
      </button>
    </form>
  );
}
