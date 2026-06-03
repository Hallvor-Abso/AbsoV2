import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { ProgressionView, type ProgressionGame } from '@/components/progression-view';
import { getVisibleGames, getGameProgression } from '@/lib/data';

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
  // On affiche TOUS les jeux visibles (actifs + à venir), pour que WoW et SWTOR
  // soient tous deux présents et distinguables via les onglets.
  const games = await getVisibleGames();

  const withProgression: ProgressionGame[] = await Promise.all(
    games.map(async (game) => {
      const tiers = await getGameProgression(game.id);
      return {
        id: game.id,
        name: game.name,
        slug: game.slug,
        color: game.color,
        logoUrl: game.logoUrl,
        status: game.status,
        tiers: tiers.map((t) => ({
          id: t.id,
          name: t.name,
          bosses: t.bosses.map((b) => ({
            id: b.id,
            name: b.name,
            status: b.status,
            firstKillDate: b.firstKillDate ? b.firstKillDate.toISOString() : null,
            imageUrl: b.imageUrl,
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
        subtitle="L'avancée de la guilde dans le contenu de raid, jeu par jeu et tier par tier."
        className="mb-12"
      />

      {withProgression.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible pour le moment.</p>
      ) : (
        <ProgressionView games={withProgression} initialSlug={searchParams.jeu} />
      )}
    </div>
  );
}
