import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { ApplicationForm } from '@/components/application-form';
import { SLOT_STATUS } from '@/lib/labels';
import { getActiveGames, getRecruitmentSlots } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Recrutement',
  description: 'Postes ouverts et formulaire de candidature pour rejoindre la guilde Absolution.',
};

export default async function RecruitmentPage() {
  const [games, slots] = await Promise.all([
    getActiveGames(),
    getRecruitmentSlots(),
  ]);

  // On regroupe les postes par jeu pour un affichage clair.
  const slotsByGame = games.map((game) => ({
    game,
    slots: slots.filter((s) => s.gameId === game.id),
  }));

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Rejoindre les rangs"
        title="Recrutement"
        subtitle="Nous recherchons des joueurs sérieux, autonomes et investis. Consulte les postes ouverts puis dépose ta candidature."
        className="mb-12"
      />

      {/* Tableau des postes par jeu */}
      <div className="space-y-10">
        {slotsByGame.map(
          ({ game, slots }) =>
            slots.length > 0 && (
              <div key={game.id}>
                <h3 className="mb-4 text-lg font-semibold text-title">{game.name}</h3>
                <div className="card overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-5 py-3 font-medium">Rôle</th>
                        <th className="px-5 py-3 font-medium">Classe</th>
                        <th className="px-5 py-3 text-right font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {slots.map((slot) => (
                        <tr key={slot.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5 text-foreground">{slot.role}</td>
                          <td className="px-5 py-3.5 font-medium text-title">{slot.className}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SLOT_STATUS[slot.status].badge}`}
                            >
                              {SLOT_STATUS[slot.status].label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
        )}
      </div>

      {/* Formulaire de candidature */}
      <div className="mt-16">
        <SectionHeading
          eyebrow="Postuler"
          title="Formulaire de candidature"
          subtitle="Prends le temps de remplir chaque champ : une candidature soignée fait la différence."
          className="mb-8"
        />
        {games.length === 0 ? (
          <p className="text-muted">Le recrutement est actuellement fermé.</p>
        ) : (
          <ApplicationForm games={games.map((g) => ({ id: g.id, name: g.name }))} />
        )}
      </div>
    </div>
  );
}
