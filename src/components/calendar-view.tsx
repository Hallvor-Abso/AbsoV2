'use client';

import { useMemo, useState, useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { EVENT_TYPE } from '@/lib/labels';
import { GameTabBar, type GameTabInfo } from './game-tab-bar';
import { rsvpEvent, cancelRsvp } from '@/app/(public)/calendrier/actions';

export type EventSignup = {
  discordId: string;
  displayName: string;
  status: string; // GOING | MAYBE | DECLINED
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string; // ISO
  endDate: string | null;
  type: string;
  gameId: string;
  gameName: string;
  gameColor: string;
  signups: EventSignup[];
};

const RSVP_OPTIONS = [
  { key: 'GOING', label: 'Présent', emoji: '✅' },
  { key: 'MAYBE', label: 'Peut-être', emoji: '❓' },
  { key: 'DECLINED', label: 'Absent', emoji: '❌' },
] as const;

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
export function CalendarView({
  events,
  games,
  discordLinked,
  myDiscordId,
}: {
  events: CalendarEvent[];
  games: GameTabInfo[];
  discordLinked: boolean;
  myDiscordId: string | null;
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  // On garde l'ID (et non l'objet) pour que le détail reflète les changements
  // après un rafraîchissement (inscription, etc.).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;
  // Un seul jeu affiché à la fois pour éviter un calendrier surchargé.
  const [activeId, setActiveId] = useState(games[0]?.id);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // On ne garde que les événements du jeu sélectionné.
  const visibleEvents = useMemo(
    () => (activeId ? events.filter((e) => e.gameId === activeId) : events),
    [events, activeId]
  );

  // Regroupe les événements par jour (clé "YYYY-M-D") pour un accès rapide.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of visibleEvents) {
      const d = new Date(ev.startDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [visibleEvents]);

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
      {/* Onglets par jeu : un calendrier distinct par jeu */}
      <GameTabBar games={games} activeId={activeId ?? ''} onSelect={setActiveId} />

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
                      onClick={() => setSelectedId(ev.id)}
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
          onClick={() => setSelectedId(null)}
        >
          <div
            className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-6"
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
                onClick={() => setSelectedId(null)}
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

            <EventRsvp event={selected} discordLinked={discordLinked} myDiscordId={myDiscordId} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Bloc d'inscription (RSVP) + liste des inscrits dans le détail d'un événement. */
function EventRsvp({
  event,
  discordLinked,
  myDiscordId,
}: {
  event: CalendarEvent;
  discordLinked: boolean;
  myDiscordId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const myStatus = myDiscordId
    ? event.signups.find((s) => s.discordId === myDiscordId)?.status ?? null
    : null;

  // Surbrillance instantanée : on affiche tout de suite le statut choisi, sans
  // attendre l'aller-retour serveur (réconcilié au rafraîchissement).
  const [shownStatus, setOptimisticStatus] = useOptimistic<string | null>(myStatus);

  // `next` = nouveau statut optimiste (ou null pour une désinscription).
  const run = (next: string | null, fn: () => Promise<{ ok: true } | { error: string }>) =>
    startTransition(async () => {
      setError(null);
      setOptimisticStatus(next);
      const res = await fn();
      if ('error' in res) setError(res.error);
      else router.refresh();
    });

  return (
    <div className="mt-5 border-t border-border pt-4">
      {/* Boutons d'inscription */}
      {discordLinked ? (
        <>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Ma réponse</p>
          <div className="flex flex-wrap gap-2">
            {RSVP_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                disabled={pending}
                onClick={() => run(opt.key, () => rsvpEvent(event.id, opt.key))}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                  shownStatus === opt.key
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border text-foreground hover:border-accent/60'
                )}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
            {shownStatus && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(null, () => cancelRsvp(event.id))}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-title disabled:opacity-50"
              >
                Me retirer
              </button>
            )}
          </div>
          <a href="/api/discord/link" className="mt-2 inline-block text-xs text-muted underline hover:text-accent">
            Mettre à jour mon pseudo Discord
          </a>
        </>
      ) : (
        <div className="rounded-lg border border-border bg-ink-soft/40 p-3 text-sm">
          <p className="mb-2 text-foreground/90">
            Pour t’inscrire depuis le site, relie ton compte Discord (une seule fois).
          </p>
          <a href="/api/discord/link" className="btn-primary inline-flex text-sm">
            Lier mon compte Discord
          </a>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {/* Listes des inscrits */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {RSVP_OPTIONS.map((opt) => {
          const names = event.signups.filter((s) => s.status === opt.key).map((s) => s.displayName);
          return (
            <div key={opt.key}>
              <p className="mb-1 text-xs font-semibold text-muted">
                {opt.emoji} {opt.label} ({names.length})
              </p>
              {names.length === 0 ? (
                <p className="text-xs text-muted/70">—</p>
              ) : (
                <ul className="space-y-0.5 text-sm text-foreground/90">
                  {names.map((n, i) => (
                    <li key={`${n}-${i}`} className="truncate">{n}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
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
