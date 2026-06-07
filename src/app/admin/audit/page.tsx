import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(d);
}

export default async function AdminAuditPage() {
  const me = await getAppUser();
  if (me?.role !== 'SUPER_ADMIN') redirect('/admin');

  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        description="Les 200 dernières actions admin sensibles (rôles, suppressions, jeux). Réservé au Super Admin."
      />

      {logs.length === 0 ? (
        <p className="text-muted">Aucune action enregistrée pour le moment.</p>
      ) : (
        <div className="card divide-y divide-border">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-wrap items-baseline justify-between gap-2 p-3.5">
              <div className="min-w-0">
                <p className="text-sm text-title">
                  <span className="font-semibold">{l.actorName}</span>{' '}
                  <span className="text-muted">— {l.action}</span>
                  {l.detail ? <span className="text-foreground"> : {l.detail}</span> : null}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted">{fmt(l.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
