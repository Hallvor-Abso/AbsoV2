import Link from 'next/link';

/** Page 404 globale (route inexistante), aux couleurs du site. */
export default function NotFound() {
  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center text-center">
      <p className="font-display text-7xl font-bold text-accent drop-shadow-[0_0_24px_rgba(74,158,255,0.4)]">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-title">Page introuvable</h1>
      <p className="mt-2 max-w-md text-muted">
        La page que tu cherches n’existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Retour à l’accueil
      </Link>
    </div>
  );
}
