'use client';

import { useEffect } from 'react';

// Clés dont le contenu est du HTML riche (on renvoie alors innerHTML).
const RICH_KEYS = new Set(['about.body', 'philosophy.body']);

/**
 * Édition en place de la homepage.
 *
 * Ne s'active QUE lorsque la page est chargée dans l'iframe de l'éditeur admin
 * (URL `/?edit=1` ET affichée dans une iframe). Pour un visiteur normal, ce
 * composant ne fait strictement rien.
 *
 * En mode édition, tous les éléments marqués `data-edit-key` deviennent
 * modifiables : au clic on tape directement le texte, et à la sortie du champ
 * la nouvelle valeur est envoyée à la page admin parente (postMessage), qui
 * l'enregistre. L'enregistrement réel reste protégé côté serveur (Super Admin).
 */
export function InlineEdit() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inIframe = window.self !== window.top;
    if (params.get('edit') !== '1' || !inIframe) return;

    const origin = window.location.origin;
    document.body.classList.add('abso-edit-mode');

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-edit-key]'),
    );
    const cleanups: Array<() => void> = [];

    for (const el of els) {
      const key = el.dataset.editKey;
      if (!key) continue;
      el.setAttribute('contenteditable', 'true');
      el.spellcheck = false;

      const onBlur = () => {
        const value = RICH_KEYS.has(key)
          ? el.innerHTML
          : (el.innerText || '').replace(/\s+/g, ' ').trim();
        window.parent.postMessage({ type: 'abso-edit', key, value }, origin);
      };
      // Pour les textes simples : Entrée valide au lieu d'insérer un saut de ligne.
      const onKeydown = (e: KeyboardEvent) => {
        if (!RICH_KEYS.has(key) && e.key === 'Enter') {
          e.preventDefault();
          el.blur();
        }
      };
      el.addEventListener('blur', onBlur);
      el.addEventListener('keydown', onKeydown);
      cleanups.push(() => {
        el.removeEventListener('blur', onBlur);
        el.removeEventListener('keydown', onKeydown);
        el.removeAttribute('contenteditable');
      });
    }

    // En mode édition, on neutralise la navigation pour rester sur l'aperçu.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest('a');
      if (link) e.preventDefault();
    };
    document.addEventListener('click', onClick, true);

    return () => {
      cleanups.forEach((fn) => fn());
      document.removeEventListener('click', onClick, true);
      document.body.classList.remove('abso-edit-mode');
    };
  }, []);

  return null;
}
