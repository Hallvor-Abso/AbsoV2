import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { RecruitmentView, type RecruitSlot } from '@/components/recruitment-view';
import { getVisibleGames, getRecruitmentSlots } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Recrutement',
  description: 'Postes ouverts et candidature pour rejoindre la guilde Absolution.',
};

export default async function RecruitmentPage() {
  const [games, slots] = await Promise.all([
    getVisibleGames(),
    getRecruitmentSlots(),
  ]);

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Rejoindre les rangs"
        title="Recrutement"
        subtitle="Choisis ton jeu, consulte les postes recherchés, puis dépose ta candidature."
        className="mb-12"
      />

      {games.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible pour le moment.</p>
      ) : (
        <RecruitmentView
          games={games.map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            logoUrl: g.logoUrl,
            status: g.status,
          }))}
          slots={slots as RecruitSlot[]}
        />
      )}
    </div>
  );
}
