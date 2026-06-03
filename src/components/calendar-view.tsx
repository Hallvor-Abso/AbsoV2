'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { EVENT_TYPE } from '@/lib/labels';

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string; // ISO
  endDate: string | null;
  type: string;
  gameName: string;
  gameColor: string;
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * Calendrier mensuel interactif.
 * - Navigation mois précédent / suivant
 * - Chaque événement est coloré selon son jeu
 * - Clic sur un événement -> modal de détails
 */
export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Regroupe les événements par jour (clé "YYYY-M-D") pour un accès rapide.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  // Construction de la grille du mois (cases vides incluses pour aligner).
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // getDay() : 0 = dimanche -> on décale pour commencer le lundi.
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [year, month]);

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div>
      {/* En-tête de navigation */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold text-title">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-2">
          <NavButton label="Mois précédent" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
            ‹
          </NavButton>
          <button
            type="button"
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            Aujourd'hui
          </button>
          <NavButton label="Mois suivant" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
            ›
          </NavButton>
        </div>
      </div>

      {/* Grille */}
      <div className="card overflow-hidden p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted">
              {wd}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="min-h-[72px]" />;
            const dayEvents = eventsByDay.get(`${year}-${month}-${day}`) ?? [];
            return (
              <div
                key={day}
                className={cn(
                  'min-h-[72px] rounded-lg border border-border/60 bg-ink-soft/40 p-1.5 sm:min-h-[96px]',
                  isToday(day) && 'border-accent/50 ring-1 ring-accent/30'
                )}
              >
                <span className={cn('text-xs font-medium', isToday(day) ? 'text-accent' : 'text-muted')}>
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelected(ev)}
                      className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition-opacity hover:opacity-80"
                      style={{ backgroundColor: `${ev.gameColor}26`, color: ev.gameColor }}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de détails */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${selected.gameColor}26`, color: selected.gameColor }}
                >
                  {selected.gameName}
                </span>
                <h3 className="mt-2 text-xl font-bold text-title">{selected.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-muted hover:text-title"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              <Row label="Type" value={EVENT_TYPE[selected.type as keyof typeof EVENT_TYPE]?.label ?? selected.type} />
              <Row label="Début" value={formatDateTime(selected.startDate)} />
              {selected.endDate && <Row label="Fin" value={formatDateTime(selected.endDate)} />}
            </dl>

            {selected.description && (
              <p className="mt-4 border-t border-border pt-4 text-sm text-foreground/90">
                {selected.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({
  children, label, onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg text-foreground transition-colors hover:border-accent/60 hover:text-accent"
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
