'use client';

import { useState } from 'react';
import { RichTextEditor } from './rich-text-editor';
import { saveSiteContent } from '@/app/admin/actions';

/**
 * Éditeur « Contenu du site » : champs + texte riche à gauche, aperçu en
 * direct de la page d'accueil (iframe) à droite.
 */
export function ContentEditor({ content }: { content: Record<string, string> }) {
  const [previewKey, setPreviewKey] = useState(0);
  const refreshPreview = () => setPreviewKey((k) => k + 1);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ---------------- Éditeur ---------------- */}
      <form
        action={async (fd) => {
          await saveSiteContent(fd);
          // L'aperçu est rechargé après enregistrement.
          refreshPreview();
        }}
        className="space-y-8"
      >
        <Section title="Identité">
          <Text label="Logo de la guilde (URL)" name="site.logoUrl" value={content['site.logoUrl']} help="Vide = logo texte « ABSOLUTION »." />
          <Text label="Lien d'invitation Discord" name="site.discordUrl" value={content['site.discordUrl']} />
        </Section>

        <Section title="Accueil — Hero">
          <Text label="Accroche principale" name="hero.tagline" value={content['hero.tagline']} />
          <Area label="Sous-titre" name="hero.subtitle" value={content['hero.subtitle']} />
        </Section>

        <Section title="Section « Qui sommes-nous »">
          <Text label="Titre" name="about.title" value={content['about.title']} />
          <div>
            <label className="label">Texte (mise en forme possible)</label>
            <RichTextEditor name="about.body" defaultValue={content['about.body']} />
          </div>
        </Section>

        <Section title="Section « Philosophie »">
          <Text label="Titre" name="philosophy.title" value={content['philosophy.title']} />
          <div>
            <label className="label">Texte (mise en forme possible)</label>
            <RichTextEditor name="philosophy.body" defaultValue={content['philosophy.body']} />
          </div>
        </Section>

        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Synchro Warcraft Logs (avancé)
          </summary>
          <div className="mt-4 space-y-4">
            <Text label="Région" name="wcl.region" value={content['wcl.region']} help="eu, us, kr, tw… (vide = synchro désactivée)" />
            <Text label="Royaume (slug)" name="wcl.realm" value={content['wcl.realm']} help="Minuscules, tirets (ex : tarren-mill)." />
            <Text label="Nom de la guilde" name="wcl.guild" value={content['wcl.guild']} />
            <Text label="Difficulté" name="wcl.difficulty" value={content['wcl.difficulty']} help="5 = Mythique, 4 = Héroïque, 3 = Normal." />
          </div>
        </details>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">Enregistrer</button>
          <span className="text-xs text-muted">L'aperçu se met à jour après l'enregistrement.</span>
        </div>
      </form>

      {/* ---------------- Aperçu en direct ---------------- */}
      <div className="lg:sticky lg:top-8 h-fit">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Aperçu de la page d'accueil</p>
          <button type="button" onClick={refreshPreview} className="btn-secondary px-3 py-1.5 text-sm">
            Rafraîchir
          </button>
        </div>
        <iframe
          key={previewKey}
          src="/"
          title="Aperçu de la page d'accueil"
          className="h-[75vh] w-full rounded-xl border border-border bg-ink"
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-5">
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

function Area({ label, name, value }: { label: string; name: string; value?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={3} defaultValue={value ?? ''} className="field" />
    </div>
  );
}
