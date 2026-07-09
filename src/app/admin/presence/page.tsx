import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type Row = { name: string; going: number; selected: number; maybe: number; declined: number };

/** Classe de couleur d'un taux (vert ≥ 75 %, orange ≥ 50 %, rouge sinon). */
function rateClass(rate: number): string {
  if (rate >= 75) return 'font-semibold text-emerald-300';
  if (rate >= 50) return 'font-semibold text-amber-300';
  return 'font-semibold text-red-300';
}

export default async function AdminPresencePage() {
  const me = await getAppUser();
  if (me?.role !== 'SUPER_ADMIN') redirect('/admin');

  const now = new Date();
  const events = await prisma.event.findMany({
    where: { startDate: { lt: now } },
    select: { signups: { select: { discordId: true, displayName: true, status: true, selected: true } } },
  });

  const stats = new Map<string, Row>();
  for (const ev of events) {
    for (const s of ev.signups) {
      const cur = stats.get(s.discordId) ?? { name: s.displayName, going: 0, selected: 0, maybe: 0, declined: 0 };
      if (s.displayName) cur.name = s.displayName;
      if (s.status === 'GOING') cur.going++;
      else if (s.status === 'MAYBE') cur.maybe++;
      else cur.declined++;
      // « Retenu » = validé dans le groupe de raid par le GM (indépendant du statut).
      if (s.selected) cur.selected++;
      stats.set(s.discordId, cur);
    }
  }

  const rows = [...stats.values()]
    .map((r) => {
      const total = r.going + r.maybe + r.declined;
      // Taux présent : inscriptions « Présent » / total des réponses.
      const rate = total ? Math.round((r.going / total) * 100) : 0;
      // Taux pris : fois retenu en raid / fois inscrit « Présent » (borné à 100 %).
      const takenRate = r.going ? Math.min(100, Math.round((r.selected / r.going) * 100)) : 0;
      return { ...r, total, rate, takenRate };
    })
    .sort((a, b) => b.going - a.going || b.selected - a.selected || b.rate - a.rate || a.name.localeCompare(b.name, 'fr'));

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
                <th className="p-3 text-center">🛡️ Retenu</th>
                <th className="p-3 text-center">❓ Peut-être</th>
                <th className="p-3 text-center">❌ Absent</th>
                <th className="p-3 text-center">Réponses</th>
                <th className="p-3 text-center">Taux présent</th>
                <th className="p-3 text-center">Taux pris</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="p-3 font-medium text-title">{r.name}</td>
                  <td className="p-3 text-center text-emerald-300">{r.going}</td>
                  <td className="p-3 text-center text-sky-300">{r.selected}</td>
                  <td className="p-3 text-center text-amber-300">{r.maybe}</td>
                  <td className="p-3 text-center text-red-300">{r.declined}</td>
                  <td className="p-3 text-center text-muted">{r.total}</td>
                  <td className="p-3 text-center">
                    <span className={rateClass(r.rate)}>{r.rate}%</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={rateClass(r.takenRate)}>{r.takenRate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        « Présent » = inscrit présent · « Retenu » = validé dans le groupe de raid par le GM (inscrit ≠ pris).
        « Taux présent » = Présent / total des réponses · « Taux pris » = Retenu / Présent.
      </p>
    </div>
  );
}
