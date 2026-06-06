import sanitizeHtmlLib from 'sanitize-html';

/**
 * Nettoie le HTML riche produit par l'éditeur (Tiptap) avant de l'enregistrer.
 * Supprime tout script ou attribut dangereux pour prévenir les attaques XSS,
 * tout en conservant la mise en forme légitime (titres, listes, liens, images...).
 *
 * On utilise `sanitize-html` (basé sur htmlparser2) : léger et compatible avec
 * l'environnement serverless de Vercel (contrairement aux solutions basées sur
 * jsdom, qui peuvent y échouer).
 */
export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'img', 'hr',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Sécurise les liens ouverts dans un nouvel onglet.
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
}

/** Nettoie un texte simple (supprime tout HTML) et limite sa longueur. */
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  const stripped = sanitizeHtmlLib(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return stripped.trim().slice(0, maxLength);
}

/**
 * Nettoie un texte destiné à être affiché en TEXTE BRUT (pas en HTML) :
 * supprime toute balise mais NE ré-encode PAS les entités (`&`, `<`, `>`…),
 * contrairement à `sanitizeText`. À utiliser pour des valeurs rendues via du
 * texte React (qui ré-échappe déjà à l'affichage) — ex. messages d'overlay,
 * où `SWTOR & WOW` doit rester `SWTOR & WOW` et non `SWTOR &amp; WOW`.
 */
export function sanitizePlainText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // retire les balises
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
    .slice(0, maxLength);
}
