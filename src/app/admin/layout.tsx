import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/auth';
import { canAccessAdmin, canAccessContenu, canManageGlobally } from '@/lib/permissions';
import { AuthProvider } from '@/components/session-provider';
import { AdminNav } from '@/components/admin/admin-nav';

/**
 * Mise en page de l'espace admin.
 * Accès réservé aux admins (globaux ou de jeu). Les liens affichés dépendent
 * du rôle : « Contenu du site » réservé au Super Admin, « Jeux » et « Membres »
 * réservés aux admins globaux.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();

  // Non connecté → la page de connexion (géré aussi par le middleware).
  if (!user) redirect('/connexion?callbackUrl=/admin');
  // Connecté mais sans droit d'admin → retour à l'accueil.
  if (!canAccessAdmin(user)) redirect('/');

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminNav
          username={user.name}
          canContenu={canAccessContenu(user)}
          canManageGlobally={canManageGlobally(user)}
        />
        <div className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-5 sm:p-8">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
