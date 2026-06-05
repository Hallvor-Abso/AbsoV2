'use server';

import { revalidatePath } from 'next/cache';
import { getAppUser } from '@/lib/auth';
import { canAccessCalendar } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { syncEventToBot } from '@/lib/bot';
import { SignupStatus } from '@prisma/client';

type Result = { ok: true } | { error: string };

const VALID = new Set<string>(Object.values(SignupStatus));

/** Inscription / changement de statut à un événement depuis le site. */
export async function rsvpEvent(eventId: string, status: string): Promise<Result> {
  const user = await getAppUser();
  if (!user || !canAccessCalendar(user)) return { error: 'Accès refusé.' };
  if (!VALID.has(status)) return { error: 'Statut invalide.' };

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { discordId: true, displayName: true, username: true },
  });
  if (!me?.discordId) {
    return { error: 'Lie ton compte Discord pour t’inscrire depuis le site.' };
  }
  const displayName = me.displayName || me.username || user.name || 'Membre';

  await prisma.eventSignup.upsert({
    where: { eventId_discordId: { eventId, discordId: me.discordId } },
    create: { eventId, discordId: me.discordId, displayName, status: status as SignupStatus, source: 'site' },
    update: { status: status as SignupStatus, displayName },
  });

  // Rafraîchit le message Discord (no-op si bot non configuré).
  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}

/** Se désinscrire d'un événement depuis le site. */
export async function cancelRsvp(eventId: string): Promise<Result> {
  const user = await getAppUser();
  if (!user || !canAccessCalendar(user)) return { error: 'Accès refusé.' };

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { discordId: true },
  });
  if (!me?.discordId) return { error: 'Compte Discord non lié.' };

  await prisma.eventSignup.deleteMany({ where: { eventId, discordId: me.discordId } });
  await syncEventToBot(eventId);
  revalidatePath('/calendrier');
  return { ok: true };
}
