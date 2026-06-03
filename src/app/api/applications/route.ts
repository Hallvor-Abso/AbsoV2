import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applicationSchema } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

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
  const allowed = rateLimit(`application:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessaie dans quelques minutes.' },
      { status: 429 }
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
  await prisma.application.create({
    data: {
      pseudo: sanitizeText(data.pseudo, 60),
      characterId: sanitizeText(data.characterId, 80) || null,
      className: sanitizeText(data.className, 60),
      role: sanitizeText(data.role, 60),
      server: sanitizeText(data.server, 80),
      experience: sanitizeText(data.experience, 4000),
      availability: sanitizeText(data.availability, 1000),
      logsUrl: sanitizeText(data.logsUrl, 500) || null,
      motivation: sanitizeText(data.motivation, 4000),
      gameId: game.id,
    },
  });

  return NextResponse.json({ ok: true });
}
