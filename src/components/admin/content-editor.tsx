'use client';

import { useEffect, useState } from 'react';
import { saveSiteContent } from '@/app/admin/actions';
import { InlinePanelEditor } from './inline-panel-editor';

// Libellés lisibles de chaque texte éditable de la page d'accueil.
const LABELS: Record<string, string> = {
  'hero.tagline': 'Accroche principale',
  'hero.subtitle': 'Sous-titre',
  'about.title': 'Titre « Qui sommes-nous »',
  'about.body': 'Texte « Qui sommes-nous »',
  'philosophy.title': 'Titre « Notre philosophie »',
  'philosophy.body': 'Texte « Notre philosophie »',
};
// Textes sur une seule ligne (titres) : éditeur en ligne, sans blocs.
const INLINE_KEYS = new Set(['hero.tagline', 'about.title', 'philosophy.title']);

type Selection = { key: string; html: string };

/**
 * Éditeur « Contenu du site ».
 *
 * Grand aperçu de la page d'accueil (iframe) ; on clique sur un texte pour
 * ouvrir le véritable éditeur Tiptap dans un panneau à droite. Les réglages
 * non visuels (logo, Discord, Warcraft Logs) restent en bas, dépliables.
 */
export function ContentEditor({ content }: { content: Record<string, string> }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);

  // Réception du texte cliqué dans l'aperçu.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data;
      if (!data || data.type !== 'abso-edit-select' || typeof data.key !== 'string') return;
      if (!(data.key in LABELS)) return;
      setSelection({ key: data.key, html: String(data.html ?? '') });
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="space-y-5">
      {/* Barre d'info / actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Clique sur un texte de l'aperçu pour l'éditer dans le panneau.
        </p>
        <button
          type="button"
          onClick={() => setIframeKey((k) => k + 1)}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          ↻ Recharger l'aperçu
        </button>
      </div>

      {/* Aperçu + panneau d'édition */}
      <div className={selection ? 'grid gap-5 lg:grid-cols-[1.6fr_1fr]' : ''}>
        <iframe
          key={iframeKey}
          src="/?edit=1"
          title="Aperçu de la page d'accueil"
          className="h-[80vh] w-full rounded-xl border border-border bg-ink"
        />

        {selection && (
          <InlinePanelEditor
            key={selection.key}
            contentKey={selection.key}
            label={LABELS[selection.key]}
            initialHtml={selection.html}
            inline={INLINE_KEYS.has(selection.key)}
            onSaved={() => setIframeKey((k) => k + 1)}
            onClose={() => setSelection(null)}
          />
        )}
      </div>

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
