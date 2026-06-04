'use client';

import { useEffect } from 'react';

/**
 * Sélection d'un texte à éditer depuis l'aperçu (page d'accueil).
 *
 * Ne s'active QUE lorsque la page est chargée dans l'iframe de l'éditeur admin
 * (URL `/?edit=1` ET affichée dans une iframe). Pour un visiteur normal, ce
 * composant ne fait strictement rien.
 *
 * En mode édition, cliquer sur un texte marqué `data-edit-key` n'édite pas sur
 * place : on envoie sa clé et son contenu actuel à la page admin parente, qui
 * ouvre alors le véritable éditeur Tiptap dans un panneau à côté de l'aperçu.
 */
export function InlineEdit() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inIframe = window.self !== window.top;
    if (params.get('edit') !== '1' || !inIframe) return;

    const origin = window.location.origin;
    document.body.classList.add('abso-edit-mode');

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const editable = target?.closest<HTMLElement>('[data-edit-key]');
      if (editable) {
        // On édite ce texte : on sélectionne plutôt que de naviguer.
        e.preventDefault();
        document
          .querySelectorAll('.abso-edit-selected')
          .forEach((el) => el.classList.remove('abso-edit-selected'));
        editable.classList.add('abso-edit-selected');
        window.parent.postMessage(
          { type: 'abso-edit-select', key: editable.dataset.editKey, html: editable.innerHTML },
          origin,
        );
        return;
      }
      // En dehors des zones éditables : on neutralise la navigation.
      if (target?.closest('a')) e.preventDefault();
    };

    // Aperçu en direct : la page admin envoie le HTML en cours d'édition.
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      const data = e.data;
      if (!data || data.type !== 'abso-edit-preview' || typeof data.key !== 'string') return;
      const el = document.querySelector<HTMLElement>(`[data-edit-key="${data.key}"]`);
      if (el) el.innerHTML = String(data.html ?? '');
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('message', onMessage);
      document.body.classList.remove('abso-edit-mode');
    };
  }, []);

  return null;
}
