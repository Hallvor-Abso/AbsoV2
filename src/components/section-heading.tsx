import { cn } from '@/lib/utils';

/**
 * Titre de section réutilisable : petit "eyebrow" bleu + grand titre + sous-titre.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="eyebrow">
          <span className="h-px w-6 bg-accent" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
    </div>
  );
}
