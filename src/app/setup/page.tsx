import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ElectricArc } from '@/components/electric-arc';
import { SetupButton } from '@/components/setup-button';
import { IS_DEMO } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { isDatabaseInitialized } from '@/lib/setup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Initialisation',
  robots: { index: false, follow: false }, // page technique, pas indexée
};

/**
 * Page d'initialisation unique (/setup).
 *
 * À ouvrir UNE FOIS après avoir branché la base de données : elle crée le
 * compte admin et les données de départ, sans aucune ligne de commande.
 */
export default async function SetupPage() {
  // On détermine l'état pour afficher le bon message.
  let initialized = false;
  let dbError = false;
  if (!IS_DEMO) {
    try {
      initialized = await isDatabaseInitialized(prisma);
    } catch {
      dbError = true;
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <ElectricArc className="absolute inset-0 h-full w-full opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 to-ink" />

      <div className="card relative w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <Logo withGlow />
          <h1 className="mt-4 text-xl font-bold text-title">Initialisation du site</h1>
        </div>

        {IS_DEMO ? (
          <div className="space-y-3 text-sm text-muted">
            <p className="rounded-lg border border-border bg-ink-soft px-4 py-3">
              ⚠️ Aucune base de données n’est configurée (le site tourne en
              <strong className="text-foreground"> mode démo</strong>).
            </p>
            <p>
              Pour activer le vrai site, ajoute les variables
              <code className="mx-1 rounded bg-ink-soft px-1 text-accent">DATABASE_URL</code>
              et
              <code className="mx-1 rounded bg-ink-soft px-1 text-accent">DIRECT_URL</code>
              dans Vercel, puis redéploie et recharge cette page.
            </p>
          </div>
        ) : dbError ? (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            La base de données n’est pas encore joignable. Attends la fin du
            déploiement (les tables se créent automatiquement), puis recharge
            cette page.
          </p>
        ) : initialized ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted">
              Le site est déjà initialisé. Tu peux gérer tout le contenu depuis
              l’espace admin.
            </p>
            <Link href="/admin/login" className="btn-primary">
              Aller à l’espace admin
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Clique pour créer ton <strong className="text-foreground">compte
              admin</strong> et installer les données de départ (jeux WoW &amp;
              SWTOR, progression, news d’exemple).
            </p>
            <SetupButton />
            <p className="text-xs text-muted">
              Tes identifiants admin proviennent des variables
              <code className="mx-1 rounded bg-ink-soft px-1 text-accent">ADMIN_USERNAME</code>
              et
              <code className="mx-1 rounded bg-ink-soft px-1 text-accent">ADMIN_PASSWORD</code>
              définies dans Vercel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
