/**
 * Outils de fuseau horaire pour la récurrence d'événements.
 *
 * Tout le site affiche les dates en heure de Paris (rappels, roster, calendrier).
 * Quand on génère des occurrences récurrentes, on veut donc conserver la même
 * HEURE-MUR de Paris d'une occurrence à l'autre (ex. « tous les mardis 21h00 »),
 * y compris à travers les changements d'heure été/hiver — un simple décalage sur
 * l'instant UTC décalerait l'heure affichée d'1 h deux fois par an.
 *
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
  // Première estimation avec l'offset autour de l'instant visé…
  let utc = guess - tzOffsetMs(new Date(guess), timeZone);
  // …puis un raffinement au cas où on a franchi une transition d'heure.
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

/** Instant UTC correspondant à `hour:minute` (heure de Paris) le même jour-calendrier que `ref`. */
export function zonedTimeOnDate(ref: Date, hour: number, minute: number): Date {
  const w = getZonedParts(ref, PARIS_TZ);
  return zonedWallToUtc({ year: w.year, month: w.month, day: w.day, hour, minute, second: 0 }, PARIS_TZ);
}

/**
 * Renvoie l'instant du dernier créneau « jour de semaine + heure » (en heure de
 * Paris) qui tombe à ou avant `before`. Sert à planifier la publication d'une
 * occurrence sur un créneau fixe précédant sa date (ex. « le lundi 18h00 »).
 *
 * `weekday` suit la convention JS : 0 = dimanche … 6 = samedi.
 */
export function previousZonedSlot(before: Date, weekday: number, hour: number, minute: number): Date {
  const w = getZonedParts(before, PARIS_TZ);
  // Jour de semaine de la date-mur de Paris (Date.UTC sur les composantes mur).
  const currentWeekday = new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay();
  const dayDiff = (currentWeekday - weekday + 7) % 7;
  const slot: WallClock = { year: w.year, month: w.month, day: w.day - dayDiff, hour, minute, second: 0 };
  let utc = zonedWallToUtc(slot, PARIS_TZ);
  // Si le créneau du même jour tombe après `before` (heure plus tardive), on
  // recule d'une semaine. Le débordement de `day` est géré par Date.UTC.
  if (utc.getTime() > before.getTime()) {
    utc = zonedWallToUtc({ ...slot, day: slot.day - 7 }, PARIS_TZ);
  }
  return utc;
}
