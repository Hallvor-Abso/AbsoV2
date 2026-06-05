'use client';

import { useState } from 'react';
import { GameForm } from './game-form';
import { Modal } from './modal';

/** Bouton « Ajouter un jeu » qui ouvre une modale contenant le formulaire de création. */
export function GameAddModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        + Ajouter un jeu
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un jeu">
        {/* Une fois le jeu créé, on referme la modale (le toast confirme la sauvegarde). */}
        <GameForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
