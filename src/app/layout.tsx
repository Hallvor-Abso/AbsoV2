import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

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

// Métadonnées SEO par défaut (héritées par toutes les pages)
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXTAUTH_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'Absolution — Guilde semi-hardcore',
    template: '%s · Absolution',
  },
  description:
    'Absolution est une guilde semi-hardcore dédiée au contenu haut-niveau de MMORPG. Progression. Cohésion. Excellence.',
  keywords: ['guilde', 'MMORPG', 'World of Warcraft', 'SWTOR', 'raid', 'semi-hardcore', 'PvE'],
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
