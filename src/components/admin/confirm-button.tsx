'use client';

/**
 * Bouton de suppression avec confirmation.
 * À placer dans un <form action={...}> : il demande confirmation avant
 * de laisser le formulaire s'envoyer (sécurité contre les clics accidentels).
 */
export function ConfirmButton({
  children,
  message = 'Confirmer cette action ? Elle est irréversible.',
  className = 'text-sm font-medium text-red-300 hover:text-red-200',
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
