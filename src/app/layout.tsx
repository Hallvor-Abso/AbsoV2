import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { getSiteContent } from '@/lib/site-content';

// Chargement des polices via next/font (auto-hébergées, performantes)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

// Métadonnées SEO par défaut (héritées par toutes les pages).
// Le favicon suit automatiquement le logo téléversé dans l'admin
// (site.logoUrl) ; sinon on retombe sur l'emblème embarqué.
export async function generateMetadata(): Promise<Metadata> {
  let icon = '/absolution-emblem.svg';
  try {
    const content = await getSiteContent();
    if (content['site.logoUrl']) icon = content['site.logoUrl'];
  } catch {
    // base indisponible (build/preview) : on garde l'emblème par défaut.
  }

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
    title: {
      default: 'Absolution — Guilde semi-hardcore',
      template: '%s · Absolution',
    },
    description:
      'Absolution est une guilde semi-hardcore dédiée au contenu haut niveau de MMORPG. Progression. Cohésion. Excellence.',
    keywords: ['guilde', 'MMORPG', 'World of Warcraft', 'SWTOR', 'raid', 'semi-hardcore', 'PvE'],
    icons: { icon, shortcut: icon, apple: icon },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Absolution',
      title: 'Absolution — Guilde semi-hardcore',
      description: 'Progression. Cohésion. Excellence.',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
