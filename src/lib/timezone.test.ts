import { describe, it, expect } from 'vitest';
import { stepZonedDate, previousZonedSlot, zonedTimeOnDate, PARIS_TZ } from './timezone';

/** Heure-mur de Paris (« HH:mm ») d'un instant, pour les assertions. */
function parisTime(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
function parisDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

describe('stepZonedDate', () => {
  it('renvoie la date inchangée au pas 0', () => {
    const base = new Date('2026-03-24T20:00:00.000Z'); // mardi 21h00 Paris (CET)
    expect(stepZonedDate(base, 'weekly', 0)).toEqual(base);
  });

  it('conserve l’heure-mur de Paris à travers le passage à l’heure d’été (mars)', () => {
    // Mardi 24 mars 2026, 21h00 Paris (hiver, UTC+1 → 20h00 UTC).
    const base = new Date('2026-03-24T20:00:00.000Z');
    expect(parisTime(base)).toBe('21:00');

    // +2 semaines = mardi 7 avril (après le passage à l’heure d’été du 29 mars).
    const occ = stepZonedDate(base, 'weekly', 2);
    expect(parisDate(occ)).toBe('07/04/2026');
    expect(parisTime(occ)).toBe('21:00'); // toujours 21h00 affiché à Paris
    // En UTC l'instant a bien décalé (UTC+2 en été → 19h00 UTC).
    expect(occ.toISOString()).toBe('2026-04-07T19:00:00.000Z');
  });

  it('conserve l’heure-mur de Paris à travers le retour à l’heure d’hiver (octobre)', () => {
    // Samedi 24 oct 2026, 21h00 Paris (été, UTC+2 → 19h00 UTC).
    const base = new Date('2026-10-24T19:00:00.000Z');
    expect(parisTime(base)).toBe('21:00');

    // +1 semaine = samedi 31 oct (après le retour à l’heure d’hiver du 25 oct).
    const occ = stepZonedDate(base, 'weekly', 1);
    expect(parisDate(occ)).toBe('31/10/2026');
    expect(parisTime(occ)).toBe('21:00');
    expect(occ.toISOString()).toBe('2026-10-31T20:00:00.000Z'); // UTC+1 en hiver
  });

  it('gère la cadence mensuelle', () => {
    const base = new Date('2026-01-15T20:00:00.000Z'); // 15 janv 21h00 Paris
    const occ = stepZonedDate(base, 'monthly', 2);
    expect(parisDate(occ)).toBe('15/03/2026');
    expect(parisTime(occ)).toBe('21:00');
  });

  it('gère le débordement de jour (quotidien en fin de mois)', () => {
    const base = new Date('2026-01-30T20:00:00.000Z'); // 30 janv 21h00 Paris
    const occ = stepZonedDate(base, 'daily', 3); // → 2 février
    expect(parisDate(occ)).toBe('02/02/2026');
    expect(parisTime(occ)).toBe('21:00');
  });
});

describe('previousZonedSlot', () => {
  // weekday : 0 = dimanche … 1 = lundi … 4 = jeudi.
  it('renvoie le lundi 18h00 précédant un raid du jeudi', () => {
    const raid = new Date('2026-06-18T19:00:00.000Z'); // jeudi 18 juin, 21h00 Paris (été)
    const slot = previousZonedSlot(raid, 1, 18, 0); // lundi 18h00
    expect(parisDate(slot)).toBe('15/06/2026'); // lundi 15 juin
    expect(parisTime(slot)).toBe('18:00');
  });

  it('recule d’une semaine si le créneau du même jour est plus tard que le raid', () => {
    // Raid lundi 15 juin 10h00 Paris ; créneau visé lundi 18h00 → même jour mais
    // plus tard → on prend le lundi précédent (8 juin).
    const raid = new Date('2026-06-15T08:00:00.000Z'); // lundi 15 juin 10h00 Paris
    const slot = previousZonedSlot(raid, 1, 18, 0);
    expect(parisDate(slot)).toBe('08/06/2026');
    expect(parisTime(slot)).toBe('18:00');
  });

  it('garde l’heure-mur de Paris à travers un changement d’heure', () => {
    // Raid jeudi 2 avril 2026 21h00 Paris (après passage heure d'été du 29 mars).
    const raid = new Date('2026-04-02T19:00:00.000Z');
    const slot = previousZonedSlot(raid, 1, 18, 0); // lundi 30 mars 18h00 (déjà heure d'été)
    expect(parisDate(slot)).toBe('30/03/2026');
    expect(parisTime(slot)).toBe('18:00');
  });
});

describe('zonedTimeOnDate', () => {
  it('renvoie 20h00 Paris le jour du raid (été = UTC+2)', () => {
    const raid = new Date('2026-06-14T19:00:00.000Z'); // dimanche 14 juin, 21h00 Paris
    const t = zonedTimeOnDate(raid, 20, 0);
    expect(parisDate(t)).toBe('14/06/2026');
    expect(parisTime(t)).toBe('20:00');
    expect(t.toISOString()).toBe('2026-06-14T18:00:00.000Z'); // 20h Paris = 18h UTC en été
  });

  it('renvoie 20h00 Paris le jour du raid (hiver = UTC+1)', () => {
    const raid = new Date('2026-12-20T20:00:00.000Z'); // 20 déc, 21h00 Paris
    const t = zonedTimeOnDate(raid, 20, 0);
    expect(parisDate(t)).toBe('20/12/2026');
    expect(parisTime(t)).toBe('20:00');
    expect(t.toISOString()).toBe('2026-12-20T19:00:00.000Z'); // 20h Paris = 19h UTC en hiver
  });
});
