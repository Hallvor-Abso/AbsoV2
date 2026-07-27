'use server';

import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createResetToken, consumeResetToken } from '@/lib/password-reset';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

type AuthResult = { ok: boolean; message: string };

/**
 * Demande de réinitialisation : si un compte existe avec cet email, on envoie un
 * lien. Réponse TOUJOURS identique (anti-énumération : on ne révèle pas si
 * l'email existe). Limité par IP pour éviter le spam d'emails.
 */
export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  const generic: AuthResult = {
    ok: true,
    message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
  };
  if (!email) return { ok: false, message: 'Email requis.' };

  const ip = getClientIp(await headers());
  const allowed = await rateLimit(`reset:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) return { ok: false, message: 'Trop de demandes. Réessaie dans quelques minutes.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const raw = await createResetToken(user.id);
    const base = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
    const link = `${base}/reinitialiser/${raw}`;
    await sendEmail({
      to: email,
      subject: 'Réinitialisation de ton mot de passe — Absolution',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>Réinitialisation du mot de passe</h2>
          <p>Bonjour,</p>
          <p>Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous
             (lien valable <strong>1 heure</strong>) :</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#4A9EFF;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
              Choisir un nouveau mot de passe
            </a>
          </p>
          <p style="color:#666;font-size:13px">Ou copie ce lien : <br>${link}</p>
          <p style="color:#666;font-size:13px">Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
        </div>`,
    });
  }
  return generic;
}

/** Réinitialise le mot de passe à partir d'un jeton reçu par email. */
export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 8) return { ok: false, message: 'Mot de passe : 8 caractères minimum.' };
  if (password !== confirm) return { ok: false, message: 'Les deux mots de passe ne correspondent pas.' };

  const userId = await consumeResetToken(token);
  if (!userId) return { ok: false, message: 'Lien invalide ou expiré. Refais une demande.' };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true, message: 'Mot de passe mis à jour ! Tu peux te connecter.' };
}
