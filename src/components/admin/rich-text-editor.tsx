'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Éditeur de texte riche (Tiptap) pour rédiger les articles de news.
 *
 * Le contenu HTML est stocké dans un <input type="hidden" name={name}> afin
 * d'être envoyé automatiquement avec le formulaire (server action).
 */
export function RichTextEditor({
  name,
  defaultValue = '',
}: {
  name: string;
  defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Image,
      Placeholder.configure({ placeholder: 'Rédige ton article ici...' }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: 'prose-absolution min-h-[280px] px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-ink-soft">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      {/* Valeur transmise au formulaire */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    cn(
      'rounded px-2.5 py-1 text-sm font-medium transition-colors',
      active ? 'bg-accent/20 text-accent' : 'text-foreground hover:bg-white/5'
    );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-ink p-2">
      <button type="button" className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
        Gras
      </button>
      <button type="button" className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        Italique
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button type="button" className={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        Titre
      </button>
      <button type="button" className={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        Sous-titre
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button type="button" className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        Liste
      </button>
      <button type="button" className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        Liste num.
      </button>
      <button type="button" className={btn(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        Citation
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button
        type="button"
        className={btn(editor.isActive('link'))}
        onClick={() => {
          const url = window.prompt('URL du lien :');
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        Lien
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={() => {
          const url = window.prompt("URL de l'image :");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
      >
        Image
      </button>
    </div>
  );
}
