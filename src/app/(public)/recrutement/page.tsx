import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { RecruitmentView, type RecruitSlot, type RecruitRole, type RecruitField } from '@/components/recruitment-view';
import { getVisibleGames, getRecruitmentSlots, getRecruitmentRoles, getRecruitmentFields } from '@/lib/data';
import type { RecruitFieldType } from '@/lib/recruitment-fields';
import { getAppUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Dépend de la session (connexion + Discord lié) → pas de cache statique.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Recrutement',
  description: 'Postes ouverts et candidature pour rejoindre la guilde Absolution.',
};

export default async function RecruitmentPage({
  searchParams,
}: {
  searchParams: { jeu?: string };
}) {
  const [games, slots, roles, fields, user] = await Promise.all([
    getVisibleGames(),
    getRecruitmentSlots(),
    getRecruitmentRoles(),
    getRecruitmentFields(),
    getAppUser(),
  ]);
  const me = user
    ? await prisma.user.findUnique({ where: { id: user.id }, select: { discordId: true, discord: true } })
    : null;
  const auth = {
    loggedIn: Boolean(user),
    discordLinked: Boolean(me?.discordId),
    discord: me?.discord ?? null,
  };

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
            coverImageUrl: g.coverImageUrl,
            status: g.status,
          }))}
          slots={slots as RecruitSlot[]}
          roles={roles as RecruitRole[]}
          fields={fields.map((f) => ({
            gameId: f.gameId,
            key: f.key,
            label: f.label,
            type: f.type as RecruitFieldType,
            placeholder: f.placeholder,
            helpText: f.helpText,
            required: f.required,
            options: f.options,
          })) as RecruitField[]}
          initialGameId={games.find((g) => g.slug === searchParams.jeu)?.id ?? null}
          auth={auth}
        />
      )}
    </div>
  );
}
