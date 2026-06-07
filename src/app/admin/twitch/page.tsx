import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { AdminTwitchCommands, type TwitchCmd } from '@/components/admin/admin-twitch-commands';
import { AdminTwitchTimers, type TwitchTimerItem } from '@/components/admin/admin-twitch-timers';
import { AdminTwitchMod, type TwitchModConfig } from '@/components/admin/admin-twitch-mod';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MOD_DEFAULT: TwitchModConfig = {
  blockLinks: false, permitSeconds: 60, capsEnabled: false, capsMinLength: 12,
  capsPercent: 70, blacklist: [], timeoutSeconds: 30, warnMessage: null, modsImmune: true,
};

export default async function AdminTwitchPage() {
  const me = await getAppUser();
  if (!canAccessOverlays(me)) redirect('/admin');

  const [commands, timers, mod] = await Promise.all([
    prisma.twitchCommand.findMany({ orderBy: { name: 'asc' } }),
    prisma.twitchTimer.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.twitchModConfig.findUnique({ where: { id: 'default' } }),
  ]);

  return (
    <div className="space-y-12">
      <div>
        <PageHeader title="Bot Twitch" description="Commandes de chat personnalisées." />
        <AdminTwitchCommands
          commands={commands.map((c): TwitchCmd => ({
            id: c.id, name: c.name, response: c.response, enabled: c.enabled,
            cooldownSeconds: c.cooldownSeconds, userLevel: c.userLevel,
          }))}
        />
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-title">Timers</h2>
        <AdminTwitchTimers
          timers={timers.map((t): TwitchTimerItem => ({
            id: t.id, name: t.name, message: t.message, intervalMinutes: t.intervalMinutes, enabled: t.enabled,
          }))}
        />
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-title">Modération automatique</h2>
        <AdminTwitchMod config={mod ? { ...MOD_DEFAULT, ...mod } : MOD_DEFAULT} />
      </section>
    </div>
  );
}
