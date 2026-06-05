'use client';

import { useEffect, useState } from 'react';
import { GameForm } from './game-form';

/** Bouton « Ajouter un jeu » qui ouvre une modale contenant le formulaire de création. */
export function GameAddModal() {
  const [open, setOpen] = useState(false);

  // Fermeture à la touche Échap + blocage du scroll de fond quand la modale est ouverte.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        + Ajouter un jeu
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="card my-8 w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-title">Ajouter un jeu</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-md p-1 text-muted transition-colors hover:text-title"
              >
                ✕
              </button>
            </div>
            {/* Une fois le jeu créé, on referme la modale (le toast confirme la sauvegarde). */}
            <GameForm onDone={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
