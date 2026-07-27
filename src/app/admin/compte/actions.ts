'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';

type AccountResult = { ok: boolean; message: string };

/** Change le mot de passe du compte connecté (vérifie l'actuel d'abord). */
export async function changePassword(formData: FormData): Promise<AccountResult> {
  const me = await getAppUser();
  if (!me) return { ok: false, message: 'Non connecté.' };

  const current = String(formData.get('current') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 8) return { ok: false, message: 'Nouveau mot de passe : 8 caractères minimum.' };
  if (password !== confirm) return { ok: false, message: 'Les deux mots de passe ne correspondent pas.' };

  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return { ok: false, message: 'Compte introuvable.' };
  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { ok: false, message: 'Mot de passe actuel incorrect.' };

  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: true, message: 'Mot de passe mis à jour.' };
}

/**
 * Définit / met à jour l'email du compte connecté. Utile notamment au
 * super-admin (créé sans email) pour pouvoir recevoir un lien « mot de passe
 * oublié ».
 */
export async function updateEmail(formData: FormData): Promise<AccountResult> {
  const me = await getAppUser();
  if (!me) return { ok: false, message: 'Non connecté.' };

  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, message: 'Email invalide.' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== me.id) return { ok: false, message: 'Cet email est déjà utilisé.' };

  await prisma.user.update({ where: { id: me.id }, data: { email } });
  return { ok: true, message: 'Email enregistré.' };
}
