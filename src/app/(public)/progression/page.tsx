import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { ProgressionView, type ProgressionGame } from '@/components/progression-view';
import { getActiveGames, getGameProgression } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Progression',
  description: 'Suivez la progression de la guilde Absolution dans le contenu raid haut-niveau.',
};

export default async function ProgressionPage({
  searchParams,
}: {
  searchParams: { jeu?: string };
}) {
  const games = await getActiveGames();

  // Pour chaque jeu actif, on récupère ses tiers + boss.
  const withProgression: ProgressionGame[] = await Promise.all(
    games.map(async (game) => {
      const tiers = await getGameProgression(game.id);
      return {
        id: game.id,
        name: game.name,
        slug: game.slug,
        color: game.color,
        tiers: tiers.map((t) => ({
          id: t.id,
          name: t.name,
          bosses: t.bosses.map((b) => ({
            id: b.id,
            name: b.name,
            status: b.status,
            firstKillDate: b.firstKillDate ? b.firstKillDate.toISOString() : null,
          })),
        })),
      };
    })
  );

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Faits d'armes"
        title="Progression"
        subtitle="L'avancée de la guilde dans le contenu de raid, tier par tier."
        className="mb-12"
      />

      {withProgression.length === 0 ? (
        <p className="text-muted">Aucun jeu actif pour le moment.</p>
      ) : (
        <ProgressionView games={withProgression} initialSlug={searchParams.jeu} />
      )}
    </div>
  );
}
