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
