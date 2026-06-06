import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Logo de la guilde.
 * - Si un logo a été uploadé via l'admin (logoUrl), on l'affiche (image).
 * - Sinon, on affiche un logo textuel élégant "ABSOLUTION" avec glow bleu.
 *
 * `className`       : styles du logo TEXTE (taille de police, etc.).
 * `imageClassName`  : styles du logo IMAGE — surtout la HAUTEUR. Par défaut
 *                     `h-9` (≈36 px) pour tenir dans la navbar ; le hero passe
 *                     une hauteur plus grande. La largeur reste `w-auto` pour
 *                     respecter le ratio et éviter l'affichage en taille native.
 */
export function Logo({
  logoUrl,
  className,
  imageClassName,
  withGlow = false,
}: {
  logoUrl?: string;
  className?: string;
  imageClassName?: string;
  withGlow?: boolean;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="Absolution"
        width={180}
        height={48}
        unoptimized
        className={cn(
          'block w-auto object-contain',
          withGlow && 'drop-shadow-[0_0_18px_rgba(74,158,255,0.5)]',
          imageClassName ?? 'h-9'
        )}
        priority
      />
    );
  }

  return (
    <span
      className={cn(
        'font-display text-xl font-bold uppercase tracking-[0.25em] text-title',
        withGlow && 'drop-shadow-[0_0_18px_rgba(74,158,255,0.45)]',
        className
      )}
    >
      Abso<span className="text-accent">lution</span>
    </span>
  );
}
