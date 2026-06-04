'use client';

import { useEffect, useRef, useState } from 'react';

// Textes qui doivent rester sur une seule ligne : Entrée valide au lieu
// d'insérer un saut de ligne. Les autres acceptent plusieurs lignes.
const SINGLE_LINE = new Set(['hero.tagline', 'about.title', 'philosophy.title']);

/**
 * Édition en place de la homepage AVEC barre de mise en forme.
 *
 * Ne s'active QUE lorsque la page est chargée dans l'iframe de l'éditeur admin
 * (URL `/?edit=1` ET affichée dans une iframe). Pour un visiteur normal, ce
 * composant ne fait strictement rien.
 *
 * En mode édition :
 *  - tout élément marqué `data-edit-key` devient modifiable au clic ;
 *  - une barre flottante (gras, italique, souligné, listes, lien…) permet de
 *    mettre en forme n'importe quel texte ;
 *  - à chaque modification, la nouvelle valeur (HTML) est envoyée à la page
 *    admin parente, qui l'enregistre (sauvegarde protégée côté serveur).
 */
export function InlineEdit() {
  const [active, setActive] = useState(false);
  const currentRef = useRef<HTMLElement | null>(null);
  const originRef = useRef<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inIframe = window.self !== window.top;
    if (params.get('edit') !== '1' || !inIframe) return;

    originRef.current = window.location.origin;
    document.body.classList.add('abso-edit-mode');
    setActive(true);
    // Mise en forme via balises (<b>, <i>…) plutôt que styles inline.
    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* certains navigateurs n'aiment pas cet appel : sans gravité */
    }

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-edit-key]'));
    const cleanups: Array<() => void> = [];

    for (const el of els) {
      const key = el.dataset.editKey;
      if (!key) continue;
      el.setAttribute('contenteditable', 'true');
      el.spellcheck = false;

      const onFocus = () => {
        currentRef.current = el;
      };
      const onBlur = () => save(el);
      const onKeydown = (e: KeyboardEvent) => {
        if (SINGLE_LINE.has(key) && e.key === 'Enter') {
          e.preventDefault();
          el.blur();
        }
      };
      el.addEventListener('focus', onFocus);
      el.addEventListener('blur', onBlur);
      el.addEventListener('keydown', onKeydown);
      cleanups.push(() => {
        el.removeEventListener('focus', onFocus);
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
      setActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Envoie la valeur courante (HTML) à la page admin parente pour enregistrement.
  function save(el: HTMLElement) {
    const key = el.dataset.editKey;
    if (!key) return;
    window.parent.postMessage(
      { type: 'abso-edit', key, value: el.innerHTML },
      originRef.current,
    );
  }

  // Applique une commande de mise en forme sur la sélection courante.
  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    const el = currentRef.current;
    if (el) {
      el.focus();
      save(el);
    }
  }

  if (!active) return null;
  return <FormatToolbar onCmd={exec} />;
}

/** Barre flottante de mise en forme, rendue en bas de l'aperçu. */
function FormatToolbar({ onCmd }: { onCmd: (cmd: string, value?: string) => void }) {
  const btn =
    'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm text-foreground hover:bg-accent/20';
  const sep = 'mx-1 h-5 w-px bg-border';

  const addLink = () => {
    const url = window.prompt('Adresse du lien (https://…) :');
    if (url) onCmd('createLink', url);
  };

  return (
    <div
      // On empêche la perte de sélection quand on clique sur un bouton.
      onMouseDown={(e) => e.preventDefault()}
      style={{ position: 'fixed', left: '50%', bottom: '18px', transform: 'translateX(-50%)', zIndex: 2147483647 }}
      className="flex items-center gap-0.5 rounded-xl border border-border bg-ink/95 px-2 py-1.5 shadow-2xl backdrop-blur"
    >
      <button type="button" className={btn} title="Gras" onClick={() => onCmd('bold')}>
        <b>B</b>
      </button>
      <button type="button" className={btn} title="Italique" onClick={() => onCmd('italic')}>
        <i>I</i>
      </button>
      <button type="button" className={btn} title="Souligné" onClick={() => onCmd('underline')}>
        <u>U</u>
      </button>
      <button type="button" className={btn} title="Barré" onClick={() => onCmd('strikeThrough')}>
        <s>S</s>
      </button>
      <span className={sep} />
      <button type="button" className={btn} title="Liste à puces" onClick={() => onCmd('insertUnorderedList')}>
        • ☰
      </button>
      <button type="button" className={btn} title="Liste numérotée" onClick={() => onCmd('insertOrderedList')}>
        1. ☰
      </button>
      <button type="button" className={btn} title="Insérer un lien" onClick={addLink}>
        🔗
      </button>
      <span className={sep} />
      <button type="button" className={btn} title="Effacer la mise en forme" onClick={() => { onCmd('removeFormat'); onCmd('unlink'); }}>
        ✕
      </button>
    </div>
  );
}
