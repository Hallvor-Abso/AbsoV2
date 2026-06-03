import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { ApplicationForm } from '@/components/application-form';
import { RecruitmentView, type RecruitSlot } from '@/components/recruitment-view';
import { getVisibleGames, getRecruitmentSlots } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Recrutement',
  description: 'Postes ouverts et formulaire de candidature pour rejoindre la guilde Absolution.',
};

export default async function RecruitmentPage() {
  const [games, slots] = await Promise.all([
    getVisibleGames(),
    getRecruitmentSlots(),
  ]);

  // Seuls les jeux qui ont au moins un poste sont affichés dans les onglets.
  const gamesWithSlots = games.filter((g) => slots.some((s) => s.gameId === g.id));

  // Pour le formulaire, on ne propose que les jeux actifs.
  const activeGames = games.filter((g) => g.status === 'ACTIVE');

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Rejoindre les rangs"
        title="Recrutement"
        subtitle="Nous recherchons des joueurs sérieux, autonomes et investis. Consulte les postes ouverts puis dépose ta candidature."
        className="mb-12"
      />

      {/* Postes par jeu */}
      {gamesWithSlots.length > 0 ? (
        <RecruitmentView
          games={gamesWithSlots.map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            logoUrl: g.logoUrl,
            status: g.status,
          }))}
          slots={slots as RecruitSlot[]}
        />
      ) : (
        <p className="text-muted">Aucun poste ouvert pour le moment.</p>
      )}

      {/* Formulaire de candidature (inchangé) */}
      <div className="mt-16">
        <SectionHeading
          eyebrow="Postuler"
          title="Formulaire de candidature"
          subtitle="Prends le temps de remplir chaque champ : une candidature soignée fait la différence."
          className="mb-8"
        />
        {activeGames.length === 0 ? (
          <p className="text-muted">Le recrutement est actuellement fermé.</p>
        ) : (
          <ApplicationForm games={activeGames.map((g) => ({ id: g.id, name: g.name }))} />
        )}
      </div>
    </div>
  );
}
