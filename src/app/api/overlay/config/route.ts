import { getOverlayConfig } from '@/lib/overlay-config';

export const runtime = 'nodejs';
// Les overlays doivent refléter immédiatement les réglages enregistrés
// dans l'admin : pas de cache au build.
export const dynamic = 'force-dynamic';

/**
 * Réglages publics des overlays (configurés dans /admin/overlays), consommés
 * par les overlays pour servir de valeurs par défaut quand l'URL ne précise
 * pas un paramètre. Renvoie { shared, overlays }.
 */
export async function GET() {
  const config = await getOverlayConfig();
  return Response.json(config);
}
