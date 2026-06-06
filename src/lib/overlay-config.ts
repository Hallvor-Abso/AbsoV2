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

/** Décode les entités HTML basiques (réparation des valeurs anciennement encodées). */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function decodeMap(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (input && typeof input === 'object') {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = decodeEntities(v);
    }
  }
  return out;
}

/** Lit les réglages sauvegardés (objet vide si rien / base indisponible). */
export async function getOverlayConfig(): Promise<OverlayConfig> {
  if (IS_DEMO) return EMPTY_OVERLAY_CONFIG;
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: OVERLAY_CONFIG_KEY } });
    if (!row?.value) return EMPTY_OVERLAY_CONFIG;
    const parsed = JSON.parse(row.value);
    const overlays: Record<string, Record<string, string>> = {};
    if (parsed?.overlays && typeof parsed.overlays === 'object') {
      for (const [id, map] of Object.entries(parsed.overlays as Record<string, unknown>)) {
        overlays[id] = decodeMap(map);
      }
    }
    return { shared: decodeMap(parsed?.shared), overlays };
  } catch {
    return EMPTY_OVERLAY_CONFIG;
  }
}
