import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applicationSchema } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { notifyDiscord } from '@/lib/discord';
import { syncApplicationToBot } from '@/lib/bot';
import { getAppUser } from '@/lib/auth';

/**
 * POST /api/applications — réception d'une candidature publique.
 *
 * Protections en place :
 *  - Rate limiting : max 3 candidatures par IP toutes les 10 minutes
 *  - Validation stricte des champs (zod)
 *  - Sanitisation des textes (suppression de tout HTML)
 *  - Vérification que le jeu visé existe et est bien actif
 */
export async function POST(request: Request) {
  // 1. Limitation de débit
  const ip = getClientIp(request.headers);
  const allowed = await rateLimit(`application:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie dans quelques minutes.' },
      { status: 429 }
    );
  }

  // 1bis. Connexion obligatoire + compte Discord lié (pour le suivi de candidature).
  const appUser = await getAppUser();
  if (!appUser) {
    return NextResponse.json({ error: 'Connecte-toi pour postuler.' }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { discordId: true },
  });
  if (!me?.discordId) {
    return NextResponse.json(
      { error: 'Lie ton compte Discord avant de postuler.' },
      { status: 403 }
    );
  }

  // 2. Lecture + validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Champs invalides.' },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // 3. Le jeu doit exister et être actif (on n'accepte pas de candidature
  //    pour un jeu masqué/désactivé).
  const game = await prisma.game.findFirst({
    where: { id: data.gameId, isActive: true },
  });
  if (!game) {
    return NextResponse.json({ error: 'Jeu indisponible.' }, { status: 400 });
  }

  // 4. Enregistrement (textes nettoyés)
  const clean = {
    pseudo: sanitizeText(data.pseudo, 60),
    discord: sanitizeText(data.discord, 60) || null,
    characterId: sanitizeText(data.characterId, 80) || null,
    className: sanitizeText(data.className, 60),
    role: sanitizeText(data.role, 60),
    server: sanitizeText(data.server, 80),
    experience: sanitizeText(data.experience, 4000),
    availability: sanitizeText(data.availability, 1000),
    logsUrl: sanitizeText(data.logsUrl, 500) || null,
    motivation: sanitizeText(data.motivation, 4000),
    gameId: game.id,
    userId: appUser.id,
  };
  const application = await prisma.application.create({ data: clean });

  // 5a. Publication dans le salon de candidatures du jeu (via le bot).
  await syncApplicationToBot(application.id);

  // 5b. Notification Discord par webhook global (no-op si non configuré).
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  await notifyDiscord({
    title: '📥 Nouvelle candidature',
    description: `**${clean.pseudo}** a postulé pour **${game.name}**`,
    url: base ? `${base}/admin/candidatures` : undefined,
    fields: [
      ...(clean.discord ? [{ name: 'Discord', value: clean.discord, inline: true }] : []),
      { name: 'Classe / Rôle', value: `${clean.className} · ${clean.role}`, inline: true },
      { name: 'Serveur', value: clean.server, inline: true },
      { name: 'Disponibilités', value: clean.availability },
      ...(clean.logsUrl ? [{ name: 'Logs', value: clean.logsUrl }] : []),
    ],
  });

  return NextResponse.json({ ok: true });
}
