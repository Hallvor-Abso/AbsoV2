import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAppUser } from '@/lib/auth';
import { canAccessOverlays } from '@/lib/permissions';
import { OverlayHub } from '@/components/admin/overlay-hub';

export const dynamic = 'force-dynamic';

/** Hub de configuration des overlays de stream — réservé au Super Admin. */
export default async function AdminOverlaysPage() {
  if (!canAccessOverlays(await getAppUser())) redirect('/admin');

  return (
    <div>
      <PageHeader
        title="Overlays Stream"
        description="Configure tes overlays OBS et copie les URLs prêtes à l'emploi (Browser Source). Réservé au Super Admin."
      />
      <OverlayHub />
    </div>
  );
}
