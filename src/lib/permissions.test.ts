import { describe, it, expect } from 'vitest';
import {
  isGuildMemberDiscord,
  canAccessApplications,
  hasAnyCalendarAccess,
  calendarGameIds,
  type SessionUser,
} from './permissions';

const WOW = 'wow-game-id';
const SWTOR = 'swtor-game-id';
const ALL = [WOW, SWTOR];

function user(over: Partial<SessionUser> = {}): SessionUser {
  return { id: 'u1', name: 'Test', role: 'VISITEUR', adminGameIds: [], discordRoles: [], ...over };
}

describe('isGuildMemberDiscord', () => {
  it('vrai si Membre+ sur un jeu', () => {
    expect(isGuildMemberDiscord(user({ discordRoles: [`membre:${WOW}`] }))).toBe(true);
    expect(isGuildMemberDiscord(user({ discordRoles: [`officier:${SWTOR}`] }))).toBe(true);
    expect(isGuildMemberDiscord(user({ discordRoles: ['gm'] }))).toBe(true);
  });
  it('faux pour Recrue seule, Visiteur ou aucun grade', () => {
    expect(isGuildMemberDiscord(user({ discordRoles: [`recrue:${WOW}`] }))).toBe(false);
    expect(isGuildMemberDiscord(user({ discordRoles: ['visiteur'] }))).toBe(false);
    expect(isGuildMemberDiscord(user())).toBe(false);
  });
});

describe('canAccessApplications', () => {
  it('caché pour un membre de la guilde', () => {
    expect(canAccessApplications(user({ discordRoles: [`membre:${WOW}`] }))).toBe(false);
  });
  it('visible pour visiteur/recrue', () => {
    expect(canAccessApplications(user())).toBe(true);
    expect(canAccessApplications(user({ discordRoles: [`recrue:${WOW}`] }))).toBe(true);
  });
  it('toujours visible pour le Super Admin', () => {
    expect(canAccessApplications(user({ role: 'SUPER_ADMIN', discordRoles: [`officier:${WOW}`] }))).toBe(true);
  });
  it('null/undefined → false', () => {
    expect(canAccessApplications(null)).toBe(false);
  });
});

describe('calendarGameIds (accès par jeu)', () => {
  it('Recrue WOW → seulement WOW', () => {
    expect(calendarGameIds(user({ discordRoles: [`recrue:${WOW}`] }), ALL)).toEqual([WOW]);
  });
  it('Recrue WOW + SWTOR → les deux', () => {
    const ids = calendarGameIds(user({ discordRoles: [`recrue:${WOW}`, `membre:${SWTOR}`] }), ALL);
    expect(new Set(ids)).toEqual(new Set(ALL));
  });
  it('GM et admins voient tout', () => {
    expect(new Set(calendarGameIds(user({ discordRoles: ['gm'] }), ALL))).toEqual(new Set(ALL));
    expect(new Set(calendarGameIds(user({ role: 'ADMIN' }), ALL))).toEqual(new Set(ALL));
  });
  it('admin de jeu → uniquement ses jeux', () => {
    expect(calendarGameIds(user({ adminGameIds: [SWTOR] }), ALL)).toEqual([SWTOR]);
  });
  it('aucun grade → aucun accès', () => {
    expect(calendarGameIds(user(), ALL)).toEqual([]);
  });
});

describe('hasAnyCalendarAccess', () => {
  it('vrai dès une Recrue, faux sinon', () => {
    expect(hasAnyCalendarAccess(user({ discordRoles: [`recrue:${WOW}`] }))).toBe(true);
    expect(hasAnyCalendarAccess(user())).toBe(false);
  });
});
