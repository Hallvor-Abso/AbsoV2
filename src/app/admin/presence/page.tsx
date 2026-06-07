import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Row = { name: string; going: number; maybe: number; declined: number };

export default async function AdminPresencePage() {
  const me = await getAppUser();
  if (me?.role !== 'SUPER_ADMIN') redirect('/admin');

  const now = new Date();
  const events = await prisma.event.findMany({
    where: { startDate: { lt: now } },
    select: { signups: { select: { discordId: true, displayName: true, status: true } } },
  });

  const stats = new Map<string, Row>();
  for (const ev of events) {
    for (const s of ev.signups) {
      const cur = stats.get(s.discordId) ?? { name: s.displayName, going: 0, maybe: 0, declined: 0 };
      if (s.displayName) cur.name = s.displayName;
      if (s.status === 'GOING') cur.going++;
      else if (s.status === 'MAYBE') cur.maybe++;
      else cur.declined++;
      stats.set(s.discordId, cur);
    }
  }

  const rows = [...stats.values()]
    .map((r) => {
      const total = r.going + r.maybe + r.declined;
      return { ...r, total, rate: total ? Math.round((r.going / total) * 100) : 0 };
    })
    .sort((a, b) => b.going - a.going || b.rate - a.rate || a.name.localeCompare(b.name, 'fr'));

  return (
    <div>
      <PageHeader
        title="Présence"
        description={`Statistiques de présence aux ${events.length} événement(s) passé(s). Réservé au Super Admin.`}
      />

      {rows.length === 0 ? (
        <p className="text-muted">Aucune donnée de présence pour le moment.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                <th className="p-3">Membre</th>
                <th className="p-3 text-center">✅ Présent</th>
                <th className="p-3 text-center">❓ Peut-être</th>
                <th className="p-3 text-center">❌ Absent</th>
                <th className="p-3 text-center">Réponses</th>
                <th className="p-3 text-center">Taux présent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-medium text-title">{r.name}</td>
                  <td className="p-3 text-center text-emerald-300">{r.going}</td>
                  <td className="p-3 text-center text-amber-300">{r.maybe}</td>
                  <td className="p-3 text-center text-red-300">{r.declined}</td>
                  <td className="p-3 text-center text-muted">{r.total}</td>
                  <td className="p-3 text-center">
                    <span
                      className={
                        r.rate >= 75
                          ? 'font-semibold text-emerald-300'
                          : r.rate >= 50
                            ? 'font-semibold text-amber-300'
                            : 'font-semibold text-red-300'
                      }
                    >
                      {r.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        « Taux présent » = inscriptions « Présent » / total des réponses du membre.
      </p>
    </div>
  );
}
