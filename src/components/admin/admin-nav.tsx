'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { Logo } from '@/components/logo';
import { Icon, type IconName } from './icons';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string; icon: IconName; show: boolean };
type NavSection = { title?: string; links: NavLink[] };

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

  // Liens regroupés par thème, filtrés selon les droits de l'utilisateur.
  const SECTIONS: NavSection[] = [
    {
      links: [{ href: '/admin', label: 'Tableau de bord', icon: 'dashboard', show: true }],
    },
    {
      title: 'Guilde',
      links: [
        { href: '/admin/calendrier', label: 'Calendrier', icon: 'calendar', show: true },
        { href: '/admin/recrutement', label: 'Recrutement', icon: 'recruitment', show: true },
        { href: '/admin/candidatures', label: 'Candidatures', icon: 'applications', show: true },
        { href: '/admin/membres', label: 'Membres', icon: 'members', show: canManageGlobally },
        { href: '/admin/presence', label: 'Présence', icon: 'presence', show: canContenu },
        { href: '/admin/progression', label: 'Progression', icon: 'progression', show: true },
        { href: '/admin/news', label: 'News', icon: 'news', show: true },
      ],
    },
    {
      title: 'Réglages',
      links: [
        { href: '/admin/jeux', label: 'Jeux', icon: 'games', show: canManageGlobally },
        { href: '/admin/audit', label: 'Journal', icon: 'journal', show: canContenu },
        { href: '/admin/contenu', label: 'Contenu du site', icon: 'content', show: canContenu },
        { href: '/admin/overlays', label: 'Overlays Stream', icon: 'overlays', show: canOverlays },
        { href: '/admin/twitch', label: 'Bot Twitch', icon: 'twitch', show: canOverlays },
      ],
    },
  ]
    .map((s) => ({ ...s, links: s.links.filter((l) => l.show) }))
    .filter((s) => s.links.length > 0);

  const links = (
    <nav className="space-y-5">
      {SECTIONS.map((section, i) => (
        <div key={section.title ?? i} className="space-y-1">
          {section.title && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70">
              {section.title}
            </p>
          )}
          {section.links.map((link) => {
            const active =
              link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'text-foreground/90 hover:bg-white/[0.04] hover:text-title'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon
                  name={link.icon}
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    active ? 'text-accent' : 'text-muted group-hover:text-foreground'
                  )}
                />
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
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
          <Link
            href="/"
            className="flex items-center gap-2 px-3 text-sm text-muted transition-colors hover:text-accent"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Voir le site
          </Link>
          <div className="px-3 text-xs text-muted">Connecté : {username}</div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary w-full gap-2 text-sm"
          >
            <Icon name="logout" className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
