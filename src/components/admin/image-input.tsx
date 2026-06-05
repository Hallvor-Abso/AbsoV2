'use client';

import { useRef, useState } from 'react';
import { useToast } from './toast';
import { useAutoSave } from './auto-save-form';
import { uploadImage } from '@/lib/upload';

/**
 * Corrige les erreurs de copier-coller fréquentes : un lien de page Google /
 * Bing Images contient l'adresse réelle de l'image dans un paramètre
 * (`imgurl`, `mediaurl`, `url`). On l'extrait pour ne garder que l'image.
 */
function extractImageUrl(input: string): string {
  const value = input.trim();
  try {
    const u = new URL(value);
    const real =
      u.searchParams.get('imgurl') ||
      u.searchParams.get('mediaurl') ||
      u.searchParams.get('url');
    if (real && /^https?:\/\//i.test(real)) return real;
  } catch {
    // pas une URL absolue : on laisse tel quel
  }
  return value;
}

/**
 * Champ image : aperçu + bouton « Téléverser » (Vercel Blob), avec la
 * possibilité de coller une URL manuellement. La valeur finale (URL) est
 * portée par un input nommé `name`, donc envoyée normalement avec le formulaire.
 */
export function ImageInput({
  name,
  defaultValue = '',
  label,
  help,
  compact = false,
}: {
  name: string;
  defaultValue?: string;
  label?: string;
  help?: string;
  /** Variante condensée : masque le texte d'aide (utile dans les listes denses). */
  compact?: boolean;
}) {
  const toast = useToast();
  const autoSave = useAutoSave();
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Met à jour la valeur ET prévient le formulaire auto-save (les changements
  // par téléversement / « Retirer » ne déclenchent pas d'événement DOM natif).
  const changeUrl = (value: string) => {
    setUrl(value);
    autoSave?.requestSave();
  };

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      changeUrl(uploaded);
      toast('Image téléversée');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Échec du téléversement.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-start gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted">
            🖼
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input
            name={name}
            value={url}
            onChange={(e) => setUrl(extractImageUrl(e.target.value))}
            placeholder="https://….jpg / .png / .webp — ou téléverse un fichier"
            className="field py-1.5 text-sm"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary px-2.5 py-1 text-xs disabled:opacity-60"
            >
              {uploading ? 'Téléversement…' : '⬆ Téléverser une image'}
            </button>
            {url && (
              <button type="button" onClick={() => changeUrl('')} className="text-xs text-muted hover:text-foreground">
                Retirer
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
        </div>
      </div>
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      {!compact && (
        <p className="mt-1 text-xs text-muted">
          Un lien Google Images ne fonctionne pas, et certains sites bloquent l’affichage de leurs images.
          Le plus fiable : <strong>téléverser le fichier</strong>.
        </p>
      )}
    </div>
  );
}
