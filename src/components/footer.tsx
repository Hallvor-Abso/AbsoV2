import Link from 'next/link';
import { Logo } from './logo';

/**
 * Pied de page minimaliste : logo, liens de navigation, Discord, copyright.
 */
export function Footer({
  logoUrl,
  discordUrl,
}: {
  logoUrl?: string;
  discordUrl?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border bg-ink-soft">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo logoUrl={logoUrl} />
          <p className="max-w-sm text-sm text-muted">
            Guilde semi-hardcore dédiée au contenu haut niveau de MMORPG.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
          <Link href="/progression" className="hover:text-accent">Progression</Link>
          <Link href="/news" className="hover:text-accent">News</Link>
          <Link href="/recrutement" className="hover:text-accent">Recrutement</Link>
          <Link href="/calendrier" className="hover:text-accent">Calendrier</Link>
          {discordUrl && (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:text-accent-deep"
            >
              Discord
            </a>
          )}
        </nav>
      </div>

      <div className="border-t border-border/60">
        <div className="container-page py-5 text-center text-xs text-muted">
          © {year} Absolution. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
