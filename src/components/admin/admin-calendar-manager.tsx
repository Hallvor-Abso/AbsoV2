'use client';

import { useMemo, useState } from 'react';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { ActionForm } from './action-form';
import { DateTimeInput } from './datetime-input';
import { saveEvent, deleteEvent } from '@/app/admin/actions';
import { RaidRosterPanel, type RosterSignup } from './raid-roster-panel';
import { cn } from '@/lib/utils';

export type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  gameId: string;
  startDate: string; // instant UTC au format ISO ('' si vide)
  endDate: string;
  signups: RosterSignup[];
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Modal = { mode: 'create'; date: Date } | { mode: 'edit'; event: AdminEvent } | null;

/** Calendrier mensuel de l'admin : clic sur un jour = créer, clic sur un event = éditer. */
export function AdminCalendarManager({
  games,
  events,
}: {
  games: GameTabInfo[];
  events: AdminEvent[];
}) {
  const today = new Date();
  const [activeGame, setActiveGame] = useState(games[0]?.id);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modal, setModal] = useState<Modal>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const gameEvents = useMemo(
    () => (activeGame ? events.filter((e) => e.gameId === activeGame) : []),
    [events, activeGame],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AdminEvent[]>();
    for (const ev of gameEvents) {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return map;
  }, [gameEvents]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [year, month]);

  if (!activeGame) return <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>;

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const openCreate = (day: number) => setModal({ mode: 'create', date: new Date(year, month, day, 21, 0) });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <GameTabBar games={games} activeId={activeGame} onSelect={setActiveGame} />
        <button onClick={() => setModal({ mode: 'create', date: new Date(year, month, today.getDate(), 21, 0) })} className="btn-primary py-2 text-sm">
          + Nouvel événement
        </button>
      </div>

      {/* En-tête de navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-title">{MONTHS[month]} {year}</h3>
        <div className="flex gap-2">
          <NavButton label="Mois précédent" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</NavButton>
          <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))} className="btn-secondary px-3 py-1.5 text-sm">Aujourd'hui</button>
          <NavButton label="Mois suivant" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</NavButton>
        </div>
      </div>

      {/* Grille */}
      <div className="card overflow-hidden p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted">{wd}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} className="min-h-[84px]" />;
            const dayEvents = eventsByDay.get(`${year}-${month}-${day}`) ?? [];
            return (
              <button
                key={day}
                type="button"
                onClick={() => openCreate(day)}
                title="Cliquer pour créer un événement ce jour"
                className={cn(
                  'group min-h-[84px] rounded-lg border border-border/60 bg-ink-soft/40 p-1.5 text-left transition-colors hover:border-accent/50 sm:min-h-[110px]',
                  isToday(day) && 'border-accent/50 ring-1 ring-accent/30'
                )}
              >
                <span className={cn('text-xs font-medium', isToday(day) ? 'text-accent' : 'text-muted')}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <span
                      key={ev.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit', event: ev }); }}
                      className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium text-accent transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${games.find((g) => g.id === activeGame)?.color ?? '#4A9EFF'}26` }}
                    >
                      {ev.title}
                    </span>
                  ))}
                  <span className="block text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">+ créer</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal création / édition */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-lg font-bold text-title">
                {modal.mode === 'create' ? 'Nouvel événement' : "Modifier l'événement"}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="rounded-md p-1 text-muted hover:text-title" aria-label="Fermer">✕</button>
            </div>

            <EventForm
              gameId={activeGame}
              event={modal.mode === 'edit' ? modal.event : undefined}
              defaultStart={modal.mode === 'create' ? modal.date.toISOString() : undefined}
              onDone={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({
  gameId,
  event,
  defaultStart,
  onDone,
}: {
  gameId: string;
  event?: AdminEvent;
  defaultStart?: string;
  onDone: () => void;
}) {
  return (
    <div className="space-y-3">
      <ActionForm action={saveEvent} success={event ? 'Événement enregistré' : 'Événement ajouté'} onDone={onDone} className="space-y-4">
        {event && <input type="hidden" name="id" value={event.id} />}
        <input type="hidden" name="gameId" value={gameId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Titre</label>
            <input name="title" required defaultValue={event?.title} className="field" placeholder="Raid Mythique" />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Début</label>
            <DateTimeInput name="startDate" defaultValue={event?.startDate ?? defaultStart ?? ''} />
          </div>
          <div>
            <label className="label">Fin (optionnel)</label>
            <DateTimeInput name="endDate" defaultValue={event?.endDate} />
          </div>
        </div>

        <div>
          <label className="label">Description (optionnelle)</label>
          <textarea name="description" rows={2} defaultValue={event?.description ?? ''} className="field" placeholder="Détails de l'événement..." />
        </div>

        <button type="submit" className="btn-primary">{event ? 'Enregistrer' : "Ajouter l'événement"}</button>
      </ActionForm>

      {event && event.type === 'RAID' && (
        <div className="border-t border-border pt-4">
          <RaidRosterPanel eventId={event.id} signups={event.signups} />
        </div>
      )}

      {event && (
        <ActionForm action={deleteEvent.bind(null, event.id)} success="Événement supprimé" onDone={onDone} className="border-t border-border pt-3">
          <ConfirmButton message="Supprimer cet événement ?">Supprimer l'événement</ConfirmButton>
        </ActionForm>
      )}
    </div>
  );
}

function NavButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg text-foreground transition-colors hover:border-accent/60 hover:text-accent">
      {children}
    </button>
  );
}
