import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { AdminTwitchCommands, type TwitchCmd } from '@/components/admin/admin-twitch-commands';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminTwitchPage() {
  const me = await getAppUser();
  if (!canAccessOverlays(me)) redirect('/admin');

  const commands = await prisma.twitchCommand.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <PageHeader
        title="Bot Twitch"
        description="Commandes de chat personnalisées du bot Twitch de la guilde."
      />
      <AdminTwitchCommands
        commands={commands.map((c): TwitchCmd => ({
          id: c.id,
          name: c.name,
          response: c.response,
          enabled: c.enabled,
          cooldownSeconds: c.cooldownSeconds,
          userLevel: c.userLevel,
        }))}
      />
    </div>
  );
}
