import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/components/session-provider';
import { getSiteContent } from '@/lib/site-content';

/**
 * Mise en page commune à toutes les pages PUBLIQUES.
 *
 * L'utilisateur connecté est récupéré côté CLIENT par la navbar (via
 * SessionProvider), ce qui permet aux pages publiques de rester rapides
 * (rendu mis en cache) au lieu d'être recalculées à chaque visite.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();
  const logoUrl = content['site.logoUrl'] || undefined;
  const discordUrl = content['site.discordUrl'] || undefined;

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar logoUrl={logoUrl} />
        <main className="flex-1">{children}</main>
        <Footer logoUrl={logoUrl} discordUrl={discordUrl} />
      </div>
    </AuthProvider>
  );
}
