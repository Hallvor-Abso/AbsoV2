import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // données toujours fraîches dans l'admin

export default async function AdminDashboard() {
  // Vue d'ensemble : on charge les chiffres clés en parallèle.
  const [pendingCount, latestNews, nextEvent, activeGames] = await Promise.all([
    prisma.application.count({ where: { status: 'PENDING' } }),
    prisma.news.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.event.findFirst({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      include: { game: true },
    }),
    prisma.game.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité de la guilde."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Candidatures en attente"
          value={String(pendingCount)}
          href="/admin/candidatures"
          highlight={pendingCount > 0}
        />
        <StatCard
          label="Jeux actifs"
          value={String(activeGames.length)}
          href="/admin/jeux"
        />
        <StatCard
          label="Dernière news"
          value={latestNews?.title ?? '—'}
          href="/admin/news"
          small
        />
        <StatCard
          label="Prochain événement"
          value={nextEvent ? `${nextEvent.title} · ${formatDate(nextEvent.startDate)}` : 'Aucun'}
          href="/admin/calendrier"
          small
        />
      </div>

      {/* Accès rapides */}
      <div className="mt-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          Accès rapides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink href="/admin/news" title="Rédiger une news" desc="Créer un nouvel article" />
          <QuickLink href="/admin/progression" title="Mettre à jour la progression" desc="Boss tués, dates de kill" />
          <QuickLink href="/admin/recrutement" title="Gérer le recrutement" desc="Postes ouverts/fermés" />
          <QuickLink href="/admin/calendrier" title="Planifier un raid" desc="Ajouter un événement" />
          <QuickLink href="/admin/jeux" title="Gérer les jeux" desc="Activer/désactiver" />
          <QuickLink href="/admin/contenu" title="Modifier la homepage" desc="Textes & logo" />
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {/* Jeux actifs */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Jeux actifs
          </h2>
          {activeGames.length === 0 ? (
            <p className="text-sm text-muted">Aucun jeu actif.</p>
          ) : (
            <ul className="space-y-2">
              {activeGames.map((g) => (
                <li key={g.id} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-foreground">{g.name}</span>
                  <span className="ml-auto text-xs text-muted">
                    {g.status === 'UPCOMING' ? 'À venir' : 'Actif'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prochain événement détaillé */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
            Prochain événement
          </h2>
          {nextEvent ? (
            <div className="text-sm">
              <p className="font-medium text-title">{nextEvent.title}</p>
              <p className="mt-1 text-muted">{nextEvent.game.name}</p>
              <p className="mt-1 text-muted">{formatDate(nextEvent.startDate)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun événement programmé.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, href, highlight, small,
}: {
  label: string;
  value: string;
  href: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card p-5 transition-all duration-200 hover:border-accent/50 hover:shadow-glow ${
        highlight ? 'border-accent/50' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 font-display font-bold text-title ${small ? 'line-clamp-2 text-base' : 'text-3xl'} ${highlight ? 'text-accent' : ''}`}>
        {value}
      </p>
    </Link>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card p-5 transition-all duration-200 hover:border-accent/50 hover:shadow-glow">
      <p className="font-medium text-title">{title}</p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </Link>
  );
}
