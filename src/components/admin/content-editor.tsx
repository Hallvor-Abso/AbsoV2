'use client';

import { useEffect, useState } from 'react';
import { saveSiteContent, saveSiteContentField } from '@/app/admin/actions';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Éditeur « Contenu du site ».
 *
 * L'aperçu de la page d'accueil est affiché en grand dans une iframe ; il suffit
 * de cliquer directement sur un texte pour le modifier en place. Chaque
 * modification est enregistrée automatiquement (message envoyé par l'iframe).
 *
 * Les réglages qui ne sont pas du « texte sur la page » (logo, Discord, synchro
 * Warcraft Logs) restent dans un panneau dépliable en dessous.
 */
export function ContentEditor({ content }: { content: Record<string, string> }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Écoute les modifications envoyées par l'aperçu (édition en place).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data;
      if (!data || data.type !== 'abso-edit' || typeof data.key !== 'string') return;
      setSaveState('saving');
      saveSiteContentField(data.key, String(data.value ?? ''))
        .then(() => {
          setSaveState('saved');
          window.setTimeout(() => setSaveState('idle'), 1600);
        })
        .catch(() => setSaveState('error'));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="space-y-5">
      {/* Barre d'info / actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Clique sur n'importe quel texte de l'aperçu pour le modifier. Les
          changements sont enregistrés automatiquement.
        </p>
        <div className="flex items-center gap-3">
          <SavePill state={saveState} />
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            ↻ Recharger l'aperçu
          </button>
        </div>
      </div>

      {/* Aperçu éditable */}
      <iframe
        key={iframeKey}
        src="/?edit=1"
        title="Aperçu éditable de la page d'accueil"
        className="h-[80vh] w-full rounded-xl border border-border bg-ink"
      />

      {/* Réglages non visuels (pas du texte cliquable sur la page) */}
      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Réglages avancés (logo, Discord, synchro Warcraft Logs)
        </summary>
        <form action={saveSiteContent} className="mt-4 space-y-5">
          <Section title="Identité">
            <Text label="Logo de la guilde (URL)" name="site.logoUrl" value={content['site.logoUrl']} help="Vide = logo texte « ABSOLUTION »." />
            <Text label="Lien d'invitation Discord" name="site.discordUrl" value={content['site.discordUrl']} />
          </Section>

          <Section title="Synchro Warcraft Logs">
            <Text label="Région" name="wcl.region" value={content['wcl.region']} help="eu, us, kr, tw… (vide = synchro désactivée)" />
            <Text label="Royaume (slug)" name="wcl.realm" value={content['wcl.realm']} help="Minuscules, tirets (ex : tarren-mill)." />
            <Text label="Nom de la guilde" name="wcl.guild" value={content['wcl.guild']} />
            <Text label="Difficulté" name="wcl.difficulty" value={content['wcl.difficulty']} help="5 = Mythique, 4 = Héroïque, 3 = Normal." />
          </Section>

          <button type="submit" className="btn-primary">Enregistrer les réglages</button>
        </form>
      </details>
    </div>
  );
}

function SavePill({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const map: Record<Exclude<SaveState, 'idle'>, { label: string; cls: string }> = {
    saving: { label: 'Enregistrement…', cls: 'text-muted' },
    saved: { label: '✓ Enregistré', cls: 'text-emerald-300' },
    error: { label: '✕ Échec de l’enregistrement', cls: 'text-red-300' },
  };
  const { label, cls } = map[state];
  return <span className={`text-sm font-medium ${cls}`}>{label}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">{title}</h2>
      {children}
    </div>
  );
}

function Text({ label, name, value, help }: { label: string; name: string; value?: string; help?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={value ?? ''} className="field" />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );
}
