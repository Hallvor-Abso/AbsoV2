import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { ContentEditor } from '@/components/admin/content-editor';
import { getSiteContent } from '@/lib/site-content';
import { getAppUser } from '@/lib/auth';
import { canAccessContenu } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  if (!canAccessContenu(await getAppUser())) redirect('/admin');
  const content = await getSiteContent();

  return (
    <div>
      <PageHeader
        title="Contenu du site"
        description="Modifie les textes de la page d'accueil et le logo, avec un aperçu en direct."
      />
      <ContentEditor content={content} />
    </div>
  );
}
