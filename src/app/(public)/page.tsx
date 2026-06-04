import Link from 'next/link';
import Image from 'next/image';
import { ElectricArc } from '@/components/electric-arc';
import { Logo } from '@/components/logo';
import { Reveal } from '@/components/reveal';
import { SectionHeading } from '@/components/section-heading';
import { GameCard } from '@/components/game-card';
import { InlineEdit } from '@/components/inline-edit';
import { formatDate } from '@/lib/utils';
import { getSiteContent } from '@/lib/site-content';
import {
  getActiveGames,
  getUpcomingGames,
  getRecentKills,
} from '@/lib/data';

// ISR : la page est régénérée au maximum toutes les 60 secondes.
export const revalidate = 60;

export default async function HomePage() {
  // On charge en parallèle tout ce dont la page a besoin.
  const [content, activeGames, upcomingGames, recentKills] =
    await Promise.all([
      getSiteContent(),
      getActiveGames(),
      getUpcomingGames(),
      getRecentKills(5),
    ]);

  const allGames = [...activeGames, ...upcomingGames];

  return (
    <>
      {/* Active l'édition en place quand la page est ouverte dans l'éditeur admin. */}
      <InlineEdit />
      {/* ============================== HERO ============================== */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {/* Arc électrique en fond */}
        <ElectricArc className="absolute inset-0 h-full w-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/55 to-ink" />
        {/* Halos bleus radiaux — apportent de la lumière au hero */}
        <div className="absolute left-1/2 top-1/3 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]" />
        <div className="absolute left-1/2 top-1/4 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-accent-deep/25 blur-[90px]" />

        <div className="container-page relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <Logo logoUrl={content['site.logoUrl'] || undefined} withGlow className="text-3xl" />
            </div>
            <h1
              data-edit-key="hero.tagline"
              className="font-display text-4xl font-bold leading-tight text-title sm:text-6xl"
              dangerouslySetInnerHTML={{ __html: content['hero.tagline'] }}
            />
            <p
              data-edit-key="hero.subtitle"
              className="mx-auto mt-6 max-w-2xl text-lg text-foreground/90"
              dangerouslySetInnerHTML={{ __html: content['hero.subtitle'] }}
            />
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
            <div>
              <span className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                La guilde
              </span>
              <h2
                data-edit-key="about.title"
                className="text-3xl font-bold sm:text-4xl"
                dangerouslySetInnerHTML={{ __html: content['about.title'] }}
              />
              {/* Texte riche éditable depuis l'admin (déjà nettoyé à l'enregistrement) */}
              <div
                data-edit-key="about.body"
                className="prose-absolution mt-3"
                dangerouslySetInnerHTML={{ __html: content['about.body'] }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-8">
              <span className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                <span data-edit-key="philosophy.title" dangerouslySetInnerHTML={{ __html: content['philosophy.title'] }} />
              </span>
              <div
                data-edit-key="philosophy.body"
                className="prose-absolution"
                dangerouslySetInnerHTML={{ __html: content['philosophy.body'] }}
              />
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
          {/* Piste linéaire de derniers kills (défilement horizontal sur mobile) */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentKills.map((boss, i) => {
              const color = boss.tier.game.color;
              return (
                <Reveal key={boss.id} delay={i * 0.05}>
                  <div
                    className="w-56 shrink-0 overflow-hidden rounded-xl border bg-ink-soft"
                    style={{ borderColor: `${color}55` }}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                      {boss.imageUrl ? (
                        <Image src={boss.imageUrl} alt={boss.name} fill sizes="224px" className="object-cover" />
                      ) : (
                        <div className="h-full w-full" style={{ background: `radial-gradient(circle at 50% 30%, ${color}40, #0C0E13)` }} />
                      )}
                      <span
                        className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-ink"
                        style={{ backgroundColor: color }}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="truncate font-medium text-title" title={boss.name}>{boss.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{boss.tier.game.name}</p>
                      <p className="mt-1 text-xs" style={{ color }}>{formatDate(boss.firstKillDate)}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-6">
            <Link href="/progression" className="text-sm font-medium text-accent hover:text-accent-deep">
              Voir toute la progression →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
