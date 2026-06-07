'use server';

import { revalidatePath } from 'next/cache';
import { getAppUser } from '@/lib/auth';
import { canAccessCalendar } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { syncEventToBot } from '@/lib/bot';
import { SignupStatus } from '@prisma/client';
import { gameKey, findClass, findSpec } from '@/lib/classes';

type Result = { ok: true } | { error: string } | { needSpec: true };

const VALID = new Set<string>(Object.values(SignupStatus));

type Me = { ok: false; error: string } | { ok: true; discordId: string; displayName: string };

/** Récupère le discordId + pseudo du membre connecté (ou un message d'erreur). */
async function requireMe(): Promise<Me> {
  const user = await getAppUser();
  if (!user || !canAccessCalendar(user)) return { ok: false, error: 'Accès refusé.' };
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { discordId: true, displayName: true, username: true },
  });
  if (!me?.discordId) return { ok: false, error: 'Lie ton compte Discord pour t’inscrire depuis le site.' };
  return { ok: true, discordId: me.discordId, displayName: me.displayName || me.username || 'Membre' };
}

/**
 * Inscription / changement de statut depuis le site.
 * Pour « Présent/Peut-être » sur un jeu à classes (WoW/SWTOR), si le membre n'a
 * pas encore de main → renvoie { needSpec: true } pour que l'UI demande la spé.
 */
export async function rsvpEvent(eventId: string, status: string): Promise<Result> {
  const me = await requireMe();
  if (!me.ok) return { error: me.error };
  if (!VALID.has(status)) return { error: 'Statut invalide.' };

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!event) return { error: 'Événement introuvable.' };
  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);

  // Présent/Peut-être sur un jeu à classes : la spé est requise.
  if (status !== 'DECLINED' && key) {
    const main = await prisma.memberMain.findUnique({
      where: { discordId_gameId: { discordId: me.discordId, gameId: event.gameId } },
    });
    if (!main) return { needSpec: true };
    await prisma.eventSignup.upsert({
      where: { eventId_discordId: { eventId, discordId: me.discordId } },
      create: {
        eventId, discordId: me.discordId, displayName: me.displayName, status: status as SignupStatus, source: 'site',
        role: main.role, classId: main.classId, className: main.className, spec: main.spec,
      },
      update: {
        status: status as SignupStatus, displayName: me.displayName,
        role: main.role, classId: main.classId, className: main.className, spec: main.spec,
      },
    });
  } else {
    await prisma.eventSignup.upsert({
      where: { eventId_discordId: { eventId, discordId: me.discordId } },
      create: { eventId, discordId: me.discordId, displayName: me.displayName, status: status as SignupStatus, source: 'site' },
      update: { status: status as SignupStatus, displayName: me.displayName },
    });
  }

  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}

const ROLES = new Set(['TANK', 'HEAL', 'DPS']);

/**
 * Résout la sélection en (rôle, classe, spé) selon le jeu.
 * - WoW : `choice` = id de spé → la spé donne le rôle.
 * - SWTOR : `choice` = rôle (TANK/HEAL/DPS), pas de spé.
 */
function resolveChoice(key: ReturnType<typeof gameKey>, classId: string, choice: string) {
  if (!key) return null;
  const cls = findClass(key, classId);
  if (!cls) return null;
  if (key === 'wow') {
    const spec = findSpec(key, classId, choice);
    if (!spec) return null;
    return { role: spec.role, classId: cls.id, className: cls.label, specId: spec.id, spec: spec.label };
  }
  if (!ROLES.has(choice)) return null;
  return { role: choice, classId: cls.id, className: cls.label, specId: '', spec: '' };
}

/** Inscription en fournissant la spé/rôle (1ʳᵉ fois) : enregistre le main + l'inscription. */
export async function rsvpWithSpec(
  eventId: string,
  status: string,
  classId: string,
  choice: string,
): Promise<Result> {
  const me = await requireMe();
  if (!me.ok) return { error: me.error };
  if (status !== 'GOING' && status !== 'MAYBE') return { error: 'Statut invalide.' };

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!event) return { error: 'Événement introuvable.' };
  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);
  const r = resolveChoice(key, classId, choice);
  if (!r) return { error: 'Choix invalide.' };

  await prisma.memberMain.upsert({
    where: { discordId_gameId: { discordId: me.discordId, gameId: event.gameId } },
    create: { discordId: me.discordId, gameId: event.gameId, ...r },
    update: r,
  });
  await prisma.eventSignup.upsert({
    where: { eventId_discordId: { eventId, discordId: me.discordId } },
    create: {
      eventId, discordId: me.discordId, displayName: me.displayName, status: status as SignupStatus, source: 'site',
      role: r.role, classId: r.classId, className: r.className, spec: r.spec,
    },
    update: {
      status: status as SignupStatus, displayName: me.displayName,
      role: r.role, classId: r.classId, className: r.className, spec: r.spec,
    },
  });

  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}

/** Change la spé/rôle (main) et met à jour l'inscription en cours, sans changer le statut. */
export async function changeSpec(eventId: string, classId: string, choice: string): Promise<Result> {
  const me = await requireMe();
  if (!me.ok) return { error: me.error };

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { game: true } });
  if (!event) return { error: 'Événement introuvable.' };
  const key = gameKey(event.game.slug) ?? gameKey(event.game.name);
  const r = resolveChoice(key, classId, choice);
  if (!r) return { error: 'Choix invalide.' };

  await prisma.memberMain.upsert({
    where: { discordId_gameId: { discordId: me.discordId, gameId: event.gameId } },
    create: { discordId: me.discordId, gameId: event.gameId, ...r },
    update: r,
  });
  await prisma.eventSignup.updateMany({
    where: { eventId, discordId: me.discordId },
    data: { role: r.role, classId: r.classId, className: r.className, spec: r.spec },
  });

  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}

/** Se désinscrire d'un événement depuis le site. */
export async function cancelRsvp(eventId: string): Promise<Result> {
  const me = await requireMe();
  if (!me.ok) return { error: me.error };
  await prisma.eventSignup.deleteMany({ where: { eventId, discordId: me.discordId } });
  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}
