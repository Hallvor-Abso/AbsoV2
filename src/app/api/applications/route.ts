import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applicationSchema } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';
import { notifyDiscord } from '@/lib/discord';
import { syncApplicationToBot } from '@/lib/bot';
import { getAppUser } from '@/lib/auth';
import {
  DEFAULT_RECRUIT_FIELDS,
  validateFieldValue,
  type FormFieldDef,
  type StoredAnswer,
} from '@/lib/recruitment-fields';

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

  // 4. Champs du formulaire de CE jeu (ou champs par défaut si non personnalisé).
  const dbFields = await prisma.recruitmentField.findMany({
    where: { gameId: game.id },
    orderBy: { order: 'asc' },
  });
  const fields: FormFieldDef[] =
    dbFields.length > 0
      ? dbFields.map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          placeholder: f.placeholder,
          helpText: f.helpText,
          required: f.required,
          options: f.options,
        }))
      : DEFAULT_RECRUIT_FIELDS;

  // 5. Validation dynamique + construction des réponses (libellés issus de la
  //    base, jamais du client) et nettoyage des textes.
  const answers: StoredAnswer[] = [];
  for (const field of fields) {
    const raw = data.values[field.key] ?? '';
    const err = validateFieldValue(field, raw);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const value = sanitizeText(raw, 4000);
    if (value) answers.push({ label: field.label, value });
  }

  // 6. Enregistrement.
  const application = await prisma.application.create({
    data: {
      pseudo: sanitizeText(data.pseudo, 60),
      discord: sanitizeText(data.discord, 60) || null,
      answers,
      gameId: game.id,
      userId: appUser.id,
    },
  });

  // 7a. Publication dans le salon de candidatures du jeu (via le bot).
  await syncApplicationToBot(application.id);

  // 7b. Notification Discord par webhook global (no-op si non configuré).
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '');
  await notifyDiscord({
    title: '📥 Nouvelle candidature',
    description: `**${application.pseudo}** a postulé pour **${game.name}**`,
    url: base ? `${base}/admin/candidatures` : undefined,
    fields: [
      ...(application.discord ? [{ name: 'Discord', value: application.discord, inline: true }] : []),
      ...answers.slice(0, 5).map((a) => ({ name: a.label, value: a.value.slice(0, 1024) })),
    ],
  });

  return NextResponse.json({ ok: true });
}
