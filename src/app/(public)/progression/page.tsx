import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { ProgressionView, type ProgressionGame } from '@/components/progression-view';
import { getVisibleGames, getGameProgression } from '@/lib/data';
import { getSiteContent } from '@/lib/site-content';
import { getZoneProgress, isWclConfigured, type BossProgress } from '@/lib/warcraftlogs';

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
  const [games, content] = await Promise.all([getVisibleGames(), getSiteContent()]);

  // Paramètres de synchro Warcraft Logs (peuvent être vides → synchro inactive).
  const wcl = {
    region: content['wcl.region'] || '',
    realm: content['wcl.realm'] || '',
    guild: content['wcl.guild'] || '',
    difficulty: Number(content['wcl.difficulty'] || 5),
  };
  const wclActive = isWclConfigured() && wcl.region && wcl.realm && wcl.guild;

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
        tiers: await Promise.all(
          tiers.map(async (t) => {
            // Si la synchro WCL est active et le tier a un zoneId, on récupère
            // les pulls/% pour tous ses boss en une seule requête.
            let progress: Map<number, BossProgress> | null = null;
            if (wclActive && t.zoneId) {
              progress = await getZoneProgress({
                region: wcl.region,
                realm: wcl.realm,
                guild: wcl.guild,
                zoneId: t.zoneId,
                difficulty: wcl.difficulty,
              });
            }

            return {
              id: t.id,
              name: t.name,
              year: t.year,
              timerDone: t.timerDone,
              bosses: t.bosses.map((b) => {
                const p =
                  progress && b.encounterId ? progress.get(b.encounterId) : undefined;
                return {
                  id: b.id,
                  name: b.name,
                  status: b.status,
                  firstKillDate: b.firstKillDate ? b.firstKillDate.toISOString() : null,
                  imageUrl: b.imageUrl,
                  pulls: p?.pulls ?? null,
                  bestPercent: p && !p.killed ? p.bestPercent : null,
                };
              }),
            };
          })
        ),
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
