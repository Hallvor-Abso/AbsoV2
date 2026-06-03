import { getSession } from '@/lib/auth';
import { AuthProvider } from '@/components/session-provider';
import { AdminNav } from '@/components/admin/admin-nav';

/**
 * Mise en page de l'espace admin.
 *
 * - Si l'utilisateur n'est PAS connecté (ex : page de login), on affiche
 *   simplement le contenu en plein écran (le formulaire de connexion).
 * - S'il est connecté, on affiche la barre latérale + le contenu.
 *
 * Les routes admin sont en plus protégées par le middleware (src/middleware.ts).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminNav username={session.user.name} />
        <div className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-5xl p-5 sm:p-8">{children}</div>
        </div>
      </div>
    </AuthProvider>
  );
}
