import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Icon, type IconName } from '@/components/admin/icons';
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
          icon="applications"
          label="Candidatures en attente"
          value={String(pendingCount)}
          href="/admin/candidatures"
          highlight={pendingCount > 0}
        />
        <StatCard icon="games" label="Jeux actifs" value={String(activeGames.length)} href="/admin/jeux" />
        <StatCard icon="news" label="Dernière news" value={latestNews?.title ?? '—'} href="/admin/news" small />
        <StatCard
          icon="calendar"
          label="Prochain événement"
          value={nextEvent ? `${nextEvent.title} · ${formatDate(nextEvent.startDate)}` : 'Aucun'}
          href="/admin/calendrier"
          small
        />
      </div>

      {/* Accès rapides */}
      <SectionTitle icon="dashboard">Accès rapides</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink icon="news" href="/admin/news" title="Rédiger une news" desc="Créer un nouvel article" />
        <QuickLink icon="progression" href="/admin/progression" title="Mettre à jour la progression" desc="Boss tués, dates de kill" />
        <QuickLink icon="recruitment" href="/admin/recrutement" title="Gérer le recrutement" desc="Postes ouverts/fermés" />
        <QuickLink icon="calendar" href="/admin/calendrier" title="Planifier un raid" desc="Ajouter un événement" />
        <QuickLink icon="games" href="/admin/jeux" title="Gérer les jeux" desc="Activer/désactiver" />
        <QuickLink icon="content" href="/admin/contenu" title="Modifier la homepage" desc="Textes & logo" />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {/* Jeux actifs */}
        <div className="card p-6">
          <SectionTitle icon="games" className="mb-4 mt-0">Jeux actifs</SectionTitle>
          {activeGames.length === 0 ? (
            <p className="text-sm text-muted">Aucun jeu actif.</p>
          ) : (
            <ul className="space-y-1">
              {activeGames.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/[0.03]"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="font-medium text-foreground">{g.name}</span>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      g.status === 'UPCOMING'
                        ? 'bg-amber-400/10 text-amber-300'
                        : 'bg-emerald-400/10 text-emerald-300'
                    }`}
                  >
                    {g.status === 'UPCOMING' ? 'À venir' : 'Actif'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prochain événement détaillé */}
        <div className="card relative overflow-hidden p-6">
          {/* halo d'accent discret en coin */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
          <SectionTitle icon="calendar" className="mb-4 mt-0">Prochain événement</SectionTitle>
          {nextEvent ? (
            <div className="relative">
              <p className="font-display text-xl font-bold text-title">{nextEvent.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {nextEvent.game.name}
                </span>
                <span className="text-muted">{formatDate(nextEvent.startDate)}</span>
              </div>
              <Link
                href="/admin/calendrier"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-deep"
              >
                Gérer le calendrier
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun événement programmé.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Petit titre de section avec icône d'accent. */
function SectionTitle({
  icon, children, className = 'mb-4 mt-10',
}: {
  icon: IconName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted ${className}`}>
      <span className="text-accent"><Icon name={icon} className="h-4 w-4" /></span>
      {children}
    </h2>
  );
}

function StatCard({
  icon, label, value, href, highlight, small,
}: {
  icon: IconName;
  label: string;
  value: string;
  href: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`card group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow ${
        highlight ? 'border-accent/50 shadow-glow' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition-colors ${
            highlight
              ? 'bg-accent/20 text-accent ring-accent/30'
              : 'bg-accent/10 text-accent ring-accent/15 group-hover:bg-accent/20'
          }`}
        >
          <Icon name={icon} />
        </span>
        {highlight && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />}
      </div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`mt-1.5 font-display font-bold text-title ${small ? 'line-clamp-2 text-base' : 'text-3xl'} ${
          highlight ? 'text-accent' : ''
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function QuickLink({
  icon, href, title, desc,
}: {
  icon: IconName;
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/15 transition-colors group-hover:bg-accent/20">
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-title">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{desc}</p>
      </div>
      <Icon
        name="arrow"
        className="ml-auto h-4 w-4 shrink-0 text-muted opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:opacity-100"
      />
    </Link>
  );
}
