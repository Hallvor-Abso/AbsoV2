'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

/** Barre latérale de navigation de l'espace admin (responsive). */
export function AdminNav({
  username,
  canContenu,
  canOverlays,
  canManageGlobally,
}: {
  username?: string | null;
  canContenu: boolean;
  canOverlays: boolean;
  canManageGlobally: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Liens affichés selon les droits de l'utilisateur.
  const ADMIN_LINKS = [
    { href: '/admin', label: 'Tableau de bord', show: true },
    { href: '/admin/jeux', label: 'Jeux', show: canManageGlobally },
    { href: '/admin/news', label: 'News', show: true },
    { href: '/admin/progression', label: 'Progression', show: true },
    { href: '/admin/recrutement', label: 'Recrutement', show: true },
    { href: '/admin/candidatures', label: 'Candidatures', show: true },
    { href: '/admin/calendrier', label: 'Calendrier', show: true },
    { href: '/admin/membres', label: 'Membres', show: canManageGlobally },
    { href: '/admin/presence', label: 'Présence', show: canContenu },
    { href: '/admin/audit', label: 'Journal', show: canContenu },
    { href: '/admin/contenu', label: 'Contenu du site', show: canContenu },
    { href: '/admin/overlays', label: 'Overlays Stream', show: canOverlays },
  ].filter((l) => l.show);

  const links = (
    <nav className="space-y-1">
      {ADMIN_LINKS.map((link) => {
        const active =
          link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
              active
                ? 'bg-accent/15 text-accent'
                : 'text-foreground hover:bg-white/[0.03] hover:text-title'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Barre supérieure mobile */}
      <div className="flex items-center justify-between border-b border-border bg-ink-soft p-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-foreground"
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && <div className="border-b border-border bg-ink-soft p-4 lg:hidden">{links}</div>}

      {/* Barre latérale bureau */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-ink-soft p-5 lg:flex">
        <div className="mb-8 px-1">
          <Logo />
          <p className="mt-1 text-xs text-muted">Administration</p>
        </div>
        {links}
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <Link href="/" className="block px-3 text-sm text-muted hover:text-accent">
            ← Voir le site
          </Link>
          <div className="px-3 text-xs text-muted">Connecté : {username}</div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary w-full text-sm"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
