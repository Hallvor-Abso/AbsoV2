import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getSiteContent } from '@/lib/site-content';

/**
 * Mise en page commune à toutes les pages PUBLIQUES.
 * Charge le logo et le lien Discord (éditables depuis l'admin) une seule fois.
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
    <div className="flex min-h-screen flex-col">
      <Navbar logoUrl={logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer logoUrl={logoUrl} discordUrl={discordUrl} />
    </div>
  );
}
