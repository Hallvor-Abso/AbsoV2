/**
 * Arc électrique SVG — élément graphique signature de la guilde.
 *
 * Utilisé en fond de hero (basse opacité) et en décoration discrète.
 * Le motif est volontairement sobre : fines lignes bleues animées lentement.
 */
import { cn } from '@/lib/utils';

export function ElectricArc({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none select-none', className)}
      viewBox="0 0 1200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A6EFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#4A9EFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1A6EFF" stopOpacity="0" />
        </linearGradient>
        <filter id="arcGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Faisceau d'arcs irréguliers évoquant une décharge électrique */}
      <g
        stroke="url(#arcGradient)"
        strokeWidth="1.5"
        filter="url(#arcGlow)"
        className="animate-arc-pulse"
      >
        <path d="M0 300 L260 290 L320 330 L420 250 L520 300 L640 220 L760 310 L880 240 L1000 300 L1200 280" />
        <path d="M0 360 L200 350 L300 400 L460 320 L560 380 L700 300 L820 370 L960 310 L1080 360 L1200 350" opacity="0.5" />
        <path d="M0 240 L240 250 L340 210 L440 280 L560 220 L680 290 L800 230 L920 290 L1040 240 L1200 250" opacity="0.35" />
      </g>
    </svg>
  );
}
