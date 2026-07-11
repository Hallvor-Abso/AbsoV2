/** En-tête de page admin : titre + description optionnelle + action à droite. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Barre d'accent verticale — rappel de l'identité visuelle. */}
          <span className="mt-1 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-accent to-accent-deep" />
          <div>
            <h1 className="font-display text-2xl font-bold text-title">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {/* Séparateur dégradé discret sous l'en-tête. */}
      <div className="mt-5 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
    </div>
  );
}
