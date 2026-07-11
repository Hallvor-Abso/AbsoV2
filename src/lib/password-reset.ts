import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Jetons de réinitialisation de mot de passe.
 * On stocke uniquement le HASH (sha256) du jeton en base ; le jeton brut ne vit
 * que dans le lien envoyé par email. Usage unique + expiration 1 h.
 */

const TTL_MS = 60 * 60 * 1000; // 1 heure

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Crée un jeton pour un utilisateur et renvoie le jeton BRUT (à mettre dans le lien). */
export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: { tokenHash: hashToken(raw), userId, expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return raw;
}

/** Vrai si le jeton brut est encore valide (existe, non utilisé, non expiré). */
export async function isResetTokenValid(raw: string): Promise<boolean> {
  if (!raw) return false;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  return !!row && !row.usedAt && row.expiresAt.getTime() >= Date.now();
}

/**
 * Consomme un jeton : renvoie l'userId si valide (et le marque utilisé), sinon
 * null. Atomique via `updateMany` conditionnel pour éviter tout double usage.
 */
export async function consumeResetToken(raw: string): Promise<string | null> {
  if (!raw) return null;
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return null; // déjà consommé entre-temps
  return row.userId;
}
