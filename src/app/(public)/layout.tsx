import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getSiteContent } from '@/lib/site-content';
import { getAppUser } from '@/lib/auth';

/**
 * Mise en page commune à toutes les pages PUBLIQUES.
 * Charge le logo, le Discord et l'utilisateur connecté (pour la navbar).
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content, user] = await Promise.all([getSiteContent(), getAppUser()]);
  const logoUrl = content['site.logoUrl'] || undefined;
  const discordUrl = content['site.discordUrl'] || undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar logoUrl={logoUrl} user={user} />
      <main className="flex-1">{children}</main>
      <Footer logoUrl={logoUrl} discordUrl={discordUrl} />
    </div>
  );
}
