import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';
import { OverlayHub } from '@/components/admin/overlay-hub';
import { getOverlayConfig } from '@/lib/overlay-config';

export const dynamic = 'force-dynamic';

/** Hub de configuration des overlays de stream — réservé au Super Admin. */
export default async function AdminOverlaysPage() {
  if (!canAccessOverlays(await getAppUser())) redirect('/admin');
  const config = await getOverlayConfig();

  return (
    <div>
      <PageHeader
        title="Overlays Stream"
        description="Configure tes overlays OBS, enregistre, et colle les URLs dans une Browser Source. Réservé au Super Admin."
      />
      <OverlayHub initial={config} />
    </div>
  );
}
