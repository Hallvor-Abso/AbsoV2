'use client';

import { useTransition } from 'react';
import { useToast } from './toast';

/**
 * Formulaire branché sur une server action, avec confirmation visuelle.
 *
 * Remplace `<form action={maServerAction}>` : on attend la fin de l'action
 * puis on affiche un toast (« Modifications enregistrées » par défaut), pour
 * que l'admin soit certain que sa sauvegarde a bien été prise en compte.
 */
export function ActionForm({
  action,
  success = 'Modifications enregistrées',
  className,
  children,
  onDone,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>;
  success?: string;
  className?: string;
  children: React.ReactNode;
  /** Appelé après une sauvegarde réussie (ex. refermer un panneau de création). */
  onDone?: () => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await action(formData);
            toast(success);
            onDone?.();
          } catch (err) {
            // Laisser passer les redirections internes de Next.
            const digest = (err as { digest?: string })?.digest;
            if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err;
            toast("Échec de l'enregistrement, réessaie.", 'error');
          }
        });
      }}
    >
      {/* fieldset display:contents → désactive tous les champs pendant la
          sauvegarde (anti double-clic) sans changer la mise en page. */}
      <fieldset
        disabled={pending}
        className={pending ? 'contents [&_button[type=submit]]:opacity-60' : 'contents'}
      >
        {children}
      </fieldset>
    </form>
  );
}
