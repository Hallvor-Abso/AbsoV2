import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';
import { OverlayHub } from '@/components/admin/overlay-hub';
import { OverlayAlertsPanel } from '@/components/admin/overlay-alerts-panel';
import { getOverlayConfig } from '@/lib/overlay-config';
import { twitchConfigured, getBroadcaster, listSubscriptions } from '@/lib/twitch';

export const dynamic = 'force-dynamic';

/** Hub de configuration des overlays de stream — réservé au Super Admin. */
export default async function AdminOverlaysPage() {
  if (!canAccessOverlays(await getAppUser())) redirect('/admin');
  const config = await getOverlayConfig();

  // Statut de l'intégration Twitch (sans planter si non configurée).
  const configured = twitchConfigured();
  const broadcaster = configured ? await getBroadcaster() : { id: '', login: '' };
  let subscriptions: { id: string; type: string; status: string }[] = [];
  if (configured && broadcaster.id) {
    try {
      subscriptions = await listSubscriptions();
    } catch {
      subscriptions = [];
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overlays Stream"
        description="Configure tes overlays OBS, enregistre, et colle les URLs dans une Browser Source. Réservé au Super Admin."
      />
      <OverlayAlertsPanel configured={configured} login={broadcaster.login} subscriptions={subscriptions} />
      <OverlayHub initial={config} />
    </div>
  );
}
