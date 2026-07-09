/**
 * Outils de fuseau horaire — COPIE de ../src/lib/timezone.ts.
 * ⚠️  À garder synchronisé. Sert au bot pour générer les occurrences des séries
 * récurrentes « sans fin » en conservant l'heure-mur de Paris (zéro décalage DST).
 * Implémenté avec `Intl` (ICU, fourni par Node) → aucune dépendance externe.
 */

export const PARIS_TZ = 'Europe/Paris';

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Décompose un instant en composantes « heure-mur » dans le fuseau donné. */
function getZonedParts(instant: Date, timeZone: string): WallClock {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  let hour = get('hour');
  if (hour === 24) hour = 0; // certains environnements renvoient « 24 » à minuit
  return { year: get('year'), month: get('month'), day: get('day'), hour, minute: get('minute'), second: get('second') };
}

/** Décalage du fuseau (ms) à cet instant : (heure-mur interprétée en UTC) − instant. */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const p = getZonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - instant.getTime();
}

/**
 * Convertit une heure-mur (exprimée dans `timeZone`) en instant UTC. Les champs
 * hors plage (ex. jour 40, mois 13) débordent naturellement via `Date.UTC`.
 */
function zonedWallToUtc(w: WallClock, timeZone: string): Date {
  const guess = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  let utc = guess - tzOffsetMs(new Date(guess), timeZone);
  const refined = guess - tzOffsetMs(new Date(utc), timeZone);
  if (refined !== utc) utc = refined;
  return new Date(utc);
}

/**
 * Décale un instant de `steps` pas de récurrence en conservant l'heure-mur de
 * Paris. Renvoie l'instant tel quel pour `steps = 0`.
 */
export function stepZonedDate(
  base: Date,
  recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly' | string,
  steps: number,
): Date {
  if (steps === 0) return base;
  const w = getZonedParts(base, PARIS_TZ);
  switch (recurrence) {
    case 'daily':
      w.day += steps;
      break;
    case 'weekly':
      w.day += 7 * steps;
      break;
    case 'biweekly':
      w.day += 14 * steps;
      break;
    case 'monthly':
      w.month += steps;
      break;
    default:
      return base; // cadence inconnue → pas de décalage
  }
  return zonedWallToUtc(w, PARIS_TZ);
}

/**
 * Renvoie l'instant du dernier créneau « jour de semaine + heure » (en heure de
 * Paris) qui tombe à ou avant `before`. `weekday` suit la convention JS
 * (0 = dimanche … 6 = samedi).
 */
export function previousZonedSlot(before: Date, weekday: number, hour: number, minute: number): Date {
  const w = getZonedParts(before, PARIS_TZ);
  const currentWeekday = new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
  const dayDiff = (currentWeekday - weekday + 7) % 7;
  const slot: WallClock = { year: w.year, month: w.month, day: w.day - dayDiff, hour, minute, second: 0 };
  let utc = zonedWallToUtc(slot, PARIS_TZ);
  if (utc.getTime() > before.getTime()) {
    utc = zonedWallToUtc({ ...slot, day: slot.day - 7 }, PARIS_TZ);
  }
  return utc;
}
