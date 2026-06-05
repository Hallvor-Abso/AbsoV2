'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { canAccessAdmin, canAccessCalendar, type SessionUser } from '@/lib/permissions';

const BASE_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/progression', label: 'Progression' },
  { href: '/news', label: 'News' },
  { href: '/recrutement', label: 'Recrutement' },
];

export function Navbar({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  // On ne considère l'utilisateur que lorsque son rôle est chargé.
  const su = session?.user as { role?: string } | undefined;
  const user = (su?.role ? su : null) as SessionUser | null;

  // Le Calendrier n'est visible que par les membres (et plus) ; « Mes
  // candidatures » apparaît pour tout utilisateur connecté.
  const links = [...BASE_LINKS];
  if (canAccessCalendar(user)) links.push({ href: '/calendrier', label: 'Calendrier' });
  if (user) links.push({ href: '/mes-candidatures', label: 'Mes candidatures' });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-ink/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Logo logoUrl={logoUrl} />
        </Link>

        {/* Liens — bureau */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                isActive(link.href) ? 'text-accent' : 'text-foreground hover:text-title'
              )}
            >
              {link.label}
            </Link>
          ))}

          <span className="mx-2 h-5 w-px bg-border" />

          {user ? (
            <div className="flex items-center gap-2">
              {canAccessAdmin(user) && (
                <Link href="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-accent">
                  Admin
                </Link>
              )}
              <span className="hidden text-sm text-muted lg:inline">{user.name}</span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <>
              <Link href="/connexion" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:text-accent">
                Connexion
              </Link>
              <Link href="/inscription" className="btn-primary ml-1 px-4 py-2 text-sm">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Bouton menu — mobile */}
        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /> : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />}
          </svg>
        </button>
      </nav>

      {/* Menu déroulant — mobile */}
      {open && (
        <div className="border-t border-border/60 bg-ink md:hidden">
          <div className="container-page flex flex-col py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                {canAccessAdmin(user) && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:text-accent">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-md px-3 py-3 text-left text-sm font-medium text-foreground hover:text-accent"
                >
                  Déconnexion ({user.name})
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:text-accent">
                  Connexion
                </Link>
                <Link href="/inscription" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-accent">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
