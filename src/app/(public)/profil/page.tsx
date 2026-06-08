import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SectionHeading } from '@/components/section-heading';
import { ProfileView, type ProfileMain } from '@/components/profile-view';
import { getAppUser } from '@/lib/auth';
import { canAccessApplications } from '@/lib/permissions';
import { getVisibleGames } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon profil',
  description: 'Gère ta classe-spé par jeu et ton compte.',
};

export default async function ProfilePage() {
  const user = await getAppUser();
  if (!user) redirect('/connexion');

  const [me, games] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { displayName: true, username: true, email: true, discord: true, discordId: true },
    }),
    getVisibleGames(),
  ]);

  const mains = me?.discordId
    ? await prisma.memberMain.findMany({ where: { discordId: me.discordId } })
    : [];
  const myMains: Record<string, ProfileMain> = Object.fromEntries(
    mains.map((m) => [
      m.gameId,
      { classId: m.classId, className: m.className, specId: m.specId, spec: m.spec, role: m.role },
    ]),
  );

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Mon espace"
        title="Mon profil"
        subtitle="Ta classe et ta spé par jeu, réutilisées automatiquement à tes inscriptions."
        className="mb-10"
      />
      <ProfileView
        account={{
          name: me?.displayName || me?.username || 'Membre',
          email: me?.email ?? null,
          discord: me?.discord ?? null,
          discordLinked: Boolean(me?.discordId),
        }}
        games={games.map((g) => ({ id: g.id, name: g.name, slug: g.slug, color: g.color, status: g.status }))}
        myMains={myMains}
        showApplications={canAccessApplications(user)}
      />
    </div>
  );
}
