'use client';

import { useEffect, useState } from 'react';
import { useAutoSave } from './auto-save-form';

/**
 * Champ date/heure géré dans le FUSEAU LOCAL de l'utilisateur.
 *
 * Le navigateur connaît le fuseau de l'admin ; on convertit donc la saisie
 * locale en instant UTC (porté par un champ caché soumis avec le formulaire)
 * et, à l'inverse, on affiche l'instant stocké en heure locale. Sans ça, la
 * date serait interprétée dans le fuseau du serveur (UTC), ce qui décale les
 * publications programmées.
 */
export function DateTimeInput({
  name,
  defaultValue = '',
}: {
  /** Nom du champ soumis. Valeur = instant UTC au format ISO, ou '' si vide. */
  name: string;
  /** Instant initial au format ISO (UTC), ou '' si aucun. */
  defaultValue?: string;
}) {
  const autoSave = useAutoSave();
  // Valeur affichée par l'<input datetime-local> : heure locale "YYYY-MM-DDTHH:mm".
  const [local, setLocal] = useState('');
  // Valeur réellement soumise : instant UTC au format ISO (ou '').
  const [utc, setUtc] = useState(defaultValue);

  // À l'affichage, convertit l'instant UTC stocké vers l'heure locale du navigateur.
  useEffect(() => {
    if (!defaultValue) {
      setLocal('');
      return;
    }
    const d = new Date(defaultValue);
    const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    setLocal(shifted.toISOString().slice(0, 16));
  }, [defaultValue]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value; // heure locale saisie (sans fuseau)
    setLocal(value);
    // new Date("YYYY-MM-DDTHH:mm") est interprété en heure LOCALE par le
    // navigateur → .toISOString() produit l'instant UTC correct.
    setUtc(value ? new Date(value).toISOString() : '');
    autoSave?.requestSave();
  }

  return (
    <>
      <input
        type="datetime-local"
        value={local}
        onChange={onChange}
        className="field"
      />
      <input type="hidden" name={name} value={utc} />
    </>
  );
}
