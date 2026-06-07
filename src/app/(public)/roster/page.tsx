import type { Metadata } from 'next';
import { SectionHeading } from '@/components/section-heading';
import { RosterView, type RosterMember } from '@/components/roster-view';
import { getVisibleGames } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Effectif',
  description: "L'effectif de la guilde Absolution : qui joue quoi, par jeu et par rôle.",
};

export default async function RosterPage() {
  const games = await getVisibleGames();

  const mains = await prisma.memberMain.findMany({ where: { game: { isActive: true } } });
  const discordIds = [...new Set(mains.map((m) => m.discordId))];

  // Résolution des pseudos : compte du site en priorité, sinon dernière inscription.
  const [users, signups] = await Promise.all([
    discordIds.length
      ? prisma.user.findMany({
          where: { discordId: { in: discordIds } },
          select: { discordId: true, displayName: true, username: true },
        })
      : Promise.resolve([]),
    discordIds.length
      ? prisma.eventSignup.findMany({
          where: { discordId: { in: discordIds } },
          select: { discordId: true, displayName: true },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);
  const nameByDiscord = new Map<string, string>();
  for (const s of signups) if (!nameByDiscord.has(s.discordId)) nameByDiscord.set(s.discordId, s.displayName);
  for (const u of users) {
    if (u.discordId) nameByDiscord.set(u.discordId, u.displayName || u.username || nameByDiscord.get(u.discordId) || 'Membre');
  }

  const members: Record<string, RosterMember[]> = {};
  for (const g of games) {
    members[g.id] = mains
      .filter((m) => m.gameId === g.id)
      .map((m) => ({
        name: nameByDiscord.get(m.discordId) ?? 'Membre',
        role: m.role,
        className: m.className,
        spec: m.spec,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="L'équipe"
        title="Effectif"
        subtitle="Qui joue quoi dans la guilde, par jeu et par rôle."
        className="mb-12"
      />
      {games.length === 0 ? (
        <p className="text-muted">Aucun jeu disponible pour le moment.</p>
      ) : (
        <RosterView
          games={games.map((g) => ({
            id: g.id,
            name: g.name,
            color: g.color,
            logoUrl: g.logoUrl,
            coverImageUrl: g.coverImageUrl,
            status: g.status,
          }))}
          members={members}
        />
      )}
    </div>
  );
}
