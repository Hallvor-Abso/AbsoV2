import { PageHeader } from '@/components/admin/page-header';
import { getSiteContent } from '@/lib/site-content';
import { saveSiteContent } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

// Description de chaque champ éditable (libellé + type d'affichage).
const FIELDS: { key: string; label: string; help?: string; multiline?: boolean }[] = [
  { key: 'site.logoUrl', label: 'Logo de la guilde (URL)', help: "Laisse vide pour afficher le logo texte « ABSOLUTION ». Colle l'URL d'une image (PNG/SVG)." },
  { key: 'site.discordUrl', label: 'Lien d\'invitation Discord', help: 'Apparaît dans le pied de page.' },
  { key: 'hero.tagline', label: 'Accroche principale (hero)' },
  { key: 'hero.subtitle', label: 'Sous-titre du hero', multiline: true },
  { key: 'about.title', label: 'Titre — section « Qui sommes-nous »' },
  { key: 'about.body', label: 'Texte — section « Qui sommes-nous »', multiline: true },
  { key: 'philosophy.title', label: 'Titre — section « Philosophie »' },
  { key: 'philosophy.body', label: 'Texte — section « Philosophie »', multiline: true },
];

export default async function AdminContentPage() {
  const content = await getSiteContent();

  return (
    <div>
      <PageHeader
        title="Contenu du site"
        description="Modifie les textes de la page d'accueil et le logo. Les changements sont visibles immédiatement."
      />

      <form action={saveSiteContent} className="card space-y-6 p-6">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="label" htmlFor={field.key}>{field.label}</label>
            {field.multiline ? (
              <textarea
                id={field.key}
                name={field.key}
                rows={4}
                defaultValue={content[field.key] ?? ''}
                className="field"
              />
            ) : (
              <input
                id={field.key}
                name={field.key}
                defaultValue={content[field.key] ?? ''}
                className="field"
              />
            )}
            {field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}
          </div>
        ))}

        <button type="submit" className="btn-primary">Enregistrer</button>
      </form>

      <p className="mt-6 text-sm text-muted">
        💡 Pour le logo, héberge ton image (ex : dans Supabase Storage ou un service
        d'images) puis colle son URL publique dans le champ ci-dessus.
      </p>
    </div>
  );
}
