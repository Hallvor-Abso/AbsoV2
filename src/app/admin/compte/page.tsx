import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { getAppUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChangePasswordForm, EmailForm } from './account-forms';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const me = await getAppUser();
  if (!me) redirect('/connexion?callbackUrl=/admin/compte');

  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { email: true } });

  return (
    <div>
      <PageHeader title="Mon compte" description="Gère ton email de connexion et ton mot de passe." />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-title">Email</h2>
          <p className="mb-4 text-sm text-muted">
            Sert à te connecter et à recevoir le lien « mot de passe oublié ».
          </p>
          <EmailForm defaultEmail={user?.email ?? ''} />
        </section>

        <section className="card p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-title">Mot de passe</h2>
          <p className="mb-4 text-sm text-muted">Choisis un nouveau mot de passe (8 caractères minimum).</p>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
