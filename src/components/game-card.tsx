import Image from 'next/image';
import Link from 'next/link';
import { GAME_STATUS } from '@/lib/labels';

type GameCardData = {
  name: string;
  slug: string;
  coverImageUrl: string | null;
  color: string;
  status: 'ACTIVE' | 'UPCOMING';
};

/**
 * Carte de jeu élégante : art officiel assombri en fond, nom et statut.
 * Les jeux actifs renvoient vers leur progression, les jeux à venir ne sont
 * pas cliquables (badge « À venir »).
 */
export function GameCard({ game }: { game: GameCardData }) {
  const isUpcoming = game.status === 'UPCOMING';

  const inner = (
    <div className="group relative h-64 overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-accent/50 hover:shadow-glow">
      {/* Art officiel assombri */}
      {game.coverImageUrl && (
        <Image
          src={game.coverImageUrl}
          alt={game.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover opacity-30 transition-all duration-500 group-hover:scale-105 group-hover:opacity-40"
        />
      )}
      {/* Dégradé sombre pour la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-6">
        <span
          className="mb-2 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            color: isUpcoming ? '#8A8F9C' : game.color,
            borderColor: isUpcoming ? '#2A2D35' : `${game.color}66`,
            backgroundColor: isUpcoming ? 'transparent' : `${game.color}1A`,
          }}
        >
          {GAME_STATUS[game.status].label}
        </span>
        <h3 className="text-2xl font-bold text-title">{game.name}</h3>
        {!isUpcoming && (
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Voir la progression →
          </span>
        )}
      </div>
    </div>
  );

  if (isUpcoming) return inner;

  return (
    <Link href={`/progression?jeu=${game.slug}`} aria-label={`Progression ${game.name}`}>
      {inner}
    </Link>
  );
}
