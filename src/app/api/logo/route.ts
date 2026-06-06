import { getSiteContent } from '@/lib/site-content';

export const runtime = 'nodejs';
// Toujours lire la valeur courante en base (pas de mise en cache au build) :
// le logo doit refléter immédiatement un changement fait dans l'admin.
export const dynamic = 'force-dynamic';

/**
 * Logo public de la guilde (URL téléversée dans l'admin, `site.logoUrl`).
 * Sert aux overlays OBS (composants client) pour afficher le logo réel
 * sans avoir à coder son URL en dur. Renvoie `{ logoUrl: '' }` si aucun
 * logo n'a été téléversé (les overlays retombent alors sur l'emblème).
 */
export async function GET() {
  try {
    const content = await getSiteContent();
    return Response.json({ logoUrl: content['site.logoUrl'] || '' });
  } catch {
    return Response.json({ logoUrl: '' });
  }
}
