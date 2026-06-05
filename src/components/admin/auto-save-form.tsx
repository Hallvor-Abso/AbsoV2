'use client';

import { createContext, useContext, useRef, useTransition } from 'react';
import { useToast } from './toast';

/**
 * Contexte permettant à un champ « riche » (ex. ImageInput) de déclencher la
 * sauvegarde automatique de son formulaire même quand sa valeur change sans
 * événement DOM natif (téléversement, bouton « Retirer »…).
 */
const AutoSaveContext = createContext<{ requestSave: () => void } | null>(null);
export function useAutoSave() {
  return useContext(AutoSaveContext);
}

/**
 * Formulaire à sauvegarde automatique : enregistre tout seul après chaque
 * modification (débounce), sans bouton « Enregistrer ». Un toast confirme.
 */
export function AutoSaveForm({
  action,
  success = 'Enregistré',
  className,
  children,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>;
  success?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const toast = useToast();
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false); // une modification est-elle en attente d'enregistrement ?

  const save = () => {
    const form = formRef.current;
    if (!form || !form.checkValidity()) return; // on ignore tant que c'est invalide
    dirty.current = false;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await action(fd);
        toast(success);
      } catch (err) {
        const digest = (err as { digest?: string })?.digest;
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw err;
        toast("Échec de l'enregistrement, réessaie.", 'error');
      }
    });
  };

  const schedule = () => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  };
  // À la perte de focus, on n'enregistre que s'il y a une modification en attente.
  const saveOnBlur = () => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    save();
  };

  return (
    <AutoSaveContext.Provider value={{ requestSave: schedule }}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (timer.current) clearTimeout(timer.current);
          save();
        }}
        onChange={schedule}
        onBlur={saveOnBlur}
      >
        {children}
      </form>
    </AutoSaveContext.Provider>
  );
}
