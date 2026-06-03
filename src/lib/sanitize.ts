import DOMPurify from 'isomorphic-dompurify';

/**
 * Nettoie le HTML riche produit par l'éditeur (Tiptap) avant de l'enregistrer.
 * Supprime tout script ou attribut dangereux pour prévenir les attaques XSS,
 * tout en conservant la mise en forme légitime (titres, listes, liens, images...).
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'img', 'hr',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

/** Nettoie un texte simple (supprime tout HTML) et limite sa longueur. */
export function sanitizeText(input: unknown, maxLength = 5000): string {
  if (typeof input !== 'string') return '';
  const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  return stripped.trim().slice(0, maxLength);
}
