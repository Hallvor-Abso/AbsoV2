import { prisma } from './prisma';
import { IS_DEMO } from './env';

/**
 * Réglages persistés des overlays de stream (configurés dans /admin/overlays).
 *
 * Tout est stocké dans une seule entrée `SiteContent` (clé `overlay.config`)
 * sous forme de JSON. La forme reprend exactement ce que produit le hub :
 *   { shared: { param: value }, overlays: { overlayId: { param: value } } }
 * Les valeurs sont déjà au format « paramètre d'URL » (ex. guild:'0',
 * site:'1') : un overlay les interprète donc de façon identique, qu'elles
 * viennent de l'URL ou de la base. Les paramètres d'URL restent prioritaires.
 */
export const OVERLAY_CONFIG_KEY = 'overlay.config';

export type OverlayConfig = {
  shared: Record<string, string>;
  overlays: Record<string, Record<string, string>>;
};

export const EMPTY_OVERLAY_CONFIG: OverlayConfig = { shared: {}, overlays: {} };

/** Lit les réglages sauvegardés (objet vide si rien / base indisponible). */
export async function getOverlayConfig(): Promise<OverlayConfig> {
  if (IS_DEMO) return EMPTY_OVERLAY_CONFIG;
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: OVERLAY_CONFIG_KEY } });
    if (!row?.value) return EMPTY_OVERLAY_CONFIG;
    const parsed = JSON.parse(row.value);
    return {
      shared: parsed?.shared && typeof parsed.shared === 'object' ? parsed.shared : {},
      overlays: parsed?.overlays && typeof parsed.overlays === 'object' ? parsed.overlays : {},
    };
  } catch {
    return EMPTY_OVERLAY_CONFIG;
  }
}
