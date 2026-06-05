import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/section-heading';
import { getAppUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APPLICATION_STATUS } from '@/lib/labels';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mes candidatures',
  description: 'Suis le statut de tes candidatures.',
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export default async function MyApplicationsPage() {
  const user = await getAppUser();
  if (!user) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <SectionHeading
          eyebrow="Suivi"
          title="Mes candidatures"
          subtitle="Connecte-toi pour suivre le statut de tes candidatures."
          align="center"
          className="mb-8"
        />
        <div className="flex gap-3">
          <Link href="/connexion" className="btn-primary">Se connecter</Link>
          <Link href="/inscription" className="btn-secondary">S'inscrire</Link>
        </div>
      </div>
    );
  }

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { game: true },
  });

  // Un message d'officier est « non lu » s'il est postérieur à la dernière consultation.
  const isUnread = (a: { lastOfficerMessageAt: Date | null; candidateSeenAt: Date | null }) =>
    Boolean(a.lastOfficerMessageAt && (!a.candidateSeenAt || a.lastOfficerMessageAt > a.candidateSeenAt));

  const view = applications.map((a) => ({
    id: a.id,
    gameName: a.game?.name ?? 'Jeu supprimé',
    gameColor: a.game?.color ?? '#4A9EFF',
    pseudo: a.pseudo,
    status: a.status as keyof typeof APPLICATION_STATUS,
    createdAt: a.createdAt,
    unread: isUnread(a),
  }));

  // On marque comme lues les candidatures consultées (le badge se vide ensuite).
  const unreadIds = applications.filter(isUnread).map((a) => a.id);
  if (unreadIds.length > 0) {
    await prisma.application.updateMany({
      where: { id: { in: unreadIds } },
      data: { candidateSeenAt: new Date() },
    });
  }

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Suivi"
        title="Mes candidatures"
        subtitle="Le statut de tes candidatures. Un 🔔 indique qu'un officier t'a écrit sur Discord."
        className="mb-10"
      />

      {view.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-muted">Tu n'as pas encore postulé.</p>
          <Link href="/recrutement" className="btn-primary mt-6 inline-flex">Voir le recrutement</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {view.map((a) => {
            const status = APPLICATION_STATUS[a.status];
            return (
              <li key={a.id} className="card flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: `${a.gameColor}26`, color: a.gameColor }}
                    >
                      {a.gameName}
                    </span>
                    {a.unread && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
                        title="Un officier t'a écrit sur Discord"
                      >
                        🔔 Nouveau message
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Candidature « {a.pseudo} » · {formatDate(a.createdAt)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${status.badge}`}>
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
