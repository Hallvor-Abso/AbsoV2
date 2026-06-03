import Link from 'next/link';
import { ElectricArc } from '@/components/electric-arc';
import { Logo } from '@/components/logo';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { GameCard } from '@/components/game-card';
import { SLOT_STATUS } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { getSiteContent } from '@/lib/site-content';
import {
  getActiveGames,
  getUpcomingGames,
  getRecentKills,
  getRecruitmentSlots,
} from '@/lib/data';

// ISR : la page est régénérée au maximum toutes les 60 secondes.
export const revalidate = 60;

export default async function HomePage() {
  // On charge en parallèle tout ce dont la page a besoin.
  const [content, activeGames, upcomingGames, recentKills, slots] =
    await Promise.all([
      getSiteContent(),
      getActiveGames(),
      getUpcomingGames(),
      getRecentKills(5),
      getRecruitmentSlots(),
    ]);

  const allGames = [...activeGames, ...upcomingGames];
  // Postes ouverts ou limités uniquement (on ne met pas en avant les fermés).
  const openSlots = slots.filter((s) => s.status !== 'CLOSED');

  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {/* Arc électrique en fond, basse opacité */}
        <ElectricArc className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/60 to-ink" />
        {/* Halo bleu radial discret */}
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />

        <div className="container-page relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <Logo logoUrl={content['site.logoUrl'] || undefined} withGlow className="text-3xl" />
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-title sm:text-6xl">
              {content['hero.tagline']}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/90">
              {content['hero.subtitle']}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/recrutement" className="btn-primary">
                Nous rejoindre
              </Link>
              <Link href="/progression" className="btn-secondary">
                Notre avancée
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================== PRÉSENTATION ========================== */}
      <section className="container-page py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <SectionHeading
              eyebrow="La guilde"
              title={content['about.title']}
              subtitle={content['about.body']}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-8">
              <span className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                {content['philosophy.title']}
              </span>
              <p className="text-foreground/90">{content['philosophy.body']}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================== JEUX ACTIFS ========================== */}
      {allGames.length > 0 && (
        <section className="container-page py-12">
          <Reveal>
            <SectionHeading
              eyebrow="Nos terrains de jeu"
              title="Jeux"
              subtitle="Les univers sur lesquels Absolution évolue."
              className="mb-10"
            />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {allGames.map((game, i) => (
              <Reveal key={game.id} delay={i * 0.08}>
                <GameCard game={game} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ====================== PROGRESSION RÉCENTE ====================== */}
      {recentKills.length > 0 && (
        <section className="container-page py-20">
          <Reveal>
            <SectionHeading
              eyebrow="Faits d'armes"
              title="Progression récente"
              subtitle="Nos derniers boss vaincus."
              className="mb-10"
            />
          </Reveal>
          <div className="card divide-y divide-border">
            {recentKills.map((boss, i) => (
              <Reveal key={boss.id} delay={i * 0.05}>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <span className="h-2 w-2 rounded-full bg-accent shadow-glow" />
                    <div>
                      <p className="font-medium text-title">{boss.name}</p>
                      <p className="text-sm text-muted">
                        {boss.tier.game.name} · {boss.tier.name}
                      </p>
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-sm text-muted">
                    {formatDate(boss.firstKillDate)}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/progression" className="text-sm font-medium text-accent hover:text-accent-deep">
              Voir toute la progression →
            </Link>
          </div>
        </section>
      )}

      {/* ====================== RECRUTEMENT RAPIDE ====================== */}
      {openSlots.length > 0 && (
        <section className="container-page py-12">
          <Reveal>
            <SectionHeading
              eyebrow="Rejoindre les rangs"
              title="Recrutement"
              subtitle="Les postes que nous recherchons actuellement."
              className="mb-10"
            />
          </Reveal>
          <div className="flex flex-wrap gap-3">
            {openSlots.map((slot, i) => (
              <Reveal key={slot.id} delay={i * 0.04}>
                <div
                  className={`rounded-lg border px-4 py-2.5 text-sm ${SLOT_STATUS[slot.status].badge}`}
                >
                  <span className="font-semibold">{slot.className}</span>
                  <span className="opacity-70"> · {slot.role}</span>
                  <span className="ml-2 text-xs uppercase tracking-wider opacity-80">
                    {SLOT_STATUS[slot.status].label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/recrutement" className="btn-primary">
              Postuler
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
