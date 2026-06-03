import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

/**
 * POST /api/register — création d'un compte visiteur (inscription directe).
 * Le nouveau compte reçoit le rôle VISITEUR.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  if (!rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessaie plus tard.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Champs invalides.' },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  // Email déjà utilisé ?
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      email,
      displayName: sanitizeText(data.displayName, 40),
      discord: sanitizeText(data.discord, 60),
      passwordHash,
      role: 'VISITEUR',
    },
  });

  return NextResponse.json({ ok: true });
}
