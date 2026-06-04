'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { saveSiteContentField } from '@/app/admin/actions';

/**
 * Pour les textes « sur une ligne » (titres), on aplatit le HTML produit par
 * Tiptap : on retire les balises de paragraphe pour ne garder que la mise en
 * forme en ligne (gras, italique, lien…), valide à l'intérieur d'un <h1>/<h2>.
 */
function flattenInline(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, ' ')
    .replace(/<\/?p[^>]*>/gi, '')
    .trim();
}

/**
 * Panneau d'édition Tiptap pour UN texte de la page d'accueil.
 *
 * Ouvert quand on clique sur un texte de l'aperçu. Réutilise le vrai éditeur
 * riche du projet. L'enregistrement passe par la server action protégée.
 */
export function InlinePanelEditor({
  contentKey,
  label,
  initialHtml,
  inline,
  onPreview,
  onSaved,
  onClose,
}: {
  contentKey: string;
  label: string;
  initialHtml: string;
  inline: boolean;
  /** Appelé à chaque frappe avec le HTML rendu, pour l'aperçu en direct. */
  onPreview?: (html: string) => void;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image,
      Placeholder.configure({ placeholder: 'Écris ton texte ici…' }),
    ],
    content: initialHtml || '',
    editorProps: {
      attributes: {
        class: cn(
          'prose-absolution px-4 py-3 focus:outline-none',
          inline ? 'min-h-[90px]' : 'min-h-[260px]',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const raw = editor.getHTML();
      onPreview?.(inline ? flattenInline(raw) : raw);
    },
  });

  const save = async () => {
    if (!editor) return;
    const raw = editor.getHTML();
    const html = inline ? flattenInline(raw) : raw;
    setSaving(true);
    try {
      await saveSiteContentField(contentKey, html);
      setSaved(true);
      onSaved();
      window.setTimeout(() => setSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card flex h-[80vh] flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border p-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <button type="button" onClick={onClose} title="Fermer" className="px-1 text-muted hover:text-foreground">
          ✕
        </button>
      </div>

      {editor && <Toolbar editor={editor} inline={inline} />}

      <div className="flex-1 overflow-auto bg-ink-soft">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-3 border-t border-border p-3">
        <button type="button" onClick={save} disabled={saving} className="btn-primary py-2 text-sm disabled:opacity-60">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary py-2 text-sm">
          Annuler
        </button>
        {saved && <span className="text-sm font-medium text-emerald-300">✓ Enregistré</span>}
      </div>
    </div>
  );
}

function Toolbar({ editor, inline }: { editor: Editor; inline: boolean }) {
  const btn = (active: boolean) =>
    cn(
      'rounded px-2.5 py-1 text-sm font-medium transition-colors',
      active ? 'bg-accent/20 text-accent' : 'text-foreground hover:bg-white/5',
    );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-ink p-2">
      <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
        Gras
      </button>
      <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italique
      </button>
      <button type="button" className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        Barré
      </button>

      {/* Les blocs (titres, listes…) n'ont de sens que pour les textes longs. */}
      {!inline && (
        <>
          <span className="mx-1 h-5 w-px bg-border" />
          <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            Titre
          </button>
          <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            Sous-titre
          </button>
          <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            Liste
          </button>
          <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            Liste num.
          </button>
          <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            Citation
          </button>
        </>
      )}

      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        className={btn(editor.isActive('link'))}
        onClick={() => {
          const url = window.prompt('Adresse du lien (https://…) :');
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        Lien
      </button>
      {!inline && (
        <button
          type="button"
          className={btn(false)}
          onClick={() => {
            const url = window.prompt("Adresse de l'image (https://…) :");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        >
          Image
        </button>
      )}
    </div>
  );
}
