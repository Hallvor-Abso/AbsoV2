'use server';

import { revalidatePath } from 'next/cache';
import { getAppUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { gameKey, findClass, findSpec } from '@/lib/classes';

type Result = { ok: true } | { error: string };
const ROLES = new Set(['TANK', 'HEAL', 'DPS']);

/** Définit/MAJ la classe-spé (main) du membre connecté pour un jeu. */
export async function setMyMain(gameId: string, classId: string, choice: string): Promise<Result> {
  const user = await getAppUser();
  if (!user) return { error: 'Non connecté.' };
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { discordId: true } });
  if (!me?.discordId) return { error: 'Lie ton compte Discord pour définir ta classe.' };

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { error: 'Jeu introuvable.' };
  const key = gameKey(game.slug) ?? gameKey(game.name);
  if (!key) return { error: 'Jeu non pris en charge.' };
  const cls = findClass(key, classId);
  if (!cls) return { error: 'Classe invalide.' };

  let role: string;
  let specId = '';
  let spec = '';
  if (key === 'wow') {
    const s = findSpec(key, classId, choice);
    if (!s) return { error: 'Spécialisation invalide.' };
    role = s.role;
    specId = s.id;
    spec = s.label;
  } else {
    if (!ROLES.has(choice)) return { error: 'Rôle invalide.' };
    role = choice;
  }

  await prisma.memberMain.upsert({
    where: { discordId_gameId: { discordId: me.discordId, gameId } },
    create: { discordId: me.discordId, gameId, role, classId: cls.id, className: cls.label, specId, spec },
    update: { role, classId: cls.id, className: cls.label, specId, spec },
  });
  revalidatePath('/profil');
  return { ok: true };
}
