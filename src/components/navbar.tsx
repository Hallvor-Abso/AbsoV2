'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/progression', label: 'Progression' },
  { href: '/news', label: 'News' },
  { href: '/recrutement', label: 'Recrutement' },
  { href: '/calendrier', label: 'Calendrier' },
];

/**
 * Barre de navigation principale du site public.
 * - Fixe en haut, fond sombre translucide avec léger flou.
 * - Menu déroulant sur mobile.
 */
export function Navbar({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-ink/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Logo logoUrl={logoUrl} />
        </Link>

        {/* Liens — bureau */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'text-accent'
                    : 'text-foreground hover:text-title'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/recrutement" className="btn-primary ml-3 px-4 py-2 text-sm">
            Nous rejoindre
          </Link>
        </div>

        {/* Bouton menu — mobile */}
        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Menu déroulant — mobile */}
      {open && (
        <div className="border-t border-border/60 bg-ink md:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
