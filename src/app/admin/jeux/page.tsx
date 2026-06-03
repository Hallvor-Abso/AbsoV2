import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { saveGame, toggleGame, deleteGame } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <PageHeader
        title="Jeux"
        description="Active/désactive les jeux. Un jeu désactivé disparaît entièrement du site public."
      />

      {/* Liste des jeux existants */}
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: game.color }} />
                <div>
                  <p className="font-medium text-title">{game.name}</p>
                  <p className="text-xs text-muted">
                    /{game.slug} · {game.status === 'UPCOMING' ? 'À venir' : 'Actif'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Activation / désactivation */}
                <form action={toggleGame.bind(null, game.id, !game.isActive)}>
                  <button
                    type="submit"
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      game.isActive
                        ? 'border-accent/40 bg-accent/15 text-accent'
                        : 'border-border bg-white/5 text-muted'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${game.isActive ? 'bg-accent' : 'bg-muted'}`} />
                    {game.isActive ? 'Visible' : 'Masqué'}
                  </button>
                </form>
              </div>
            </div>

            {/* Formulaire d'édition (repliable) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-accent">
                Modifier
              </summary>
              <GameForm game={game} />
              {/* Suppression — formulaire séparé (jamais imbriqué dans l'autre) */}
              <form action={deleteGame.bind(null, game.id)} className="mt-3">
                <ConfirmButton message="Supprimer ce jeu supprimera aussi sa progression, ses postes et ses événements. Continuer ?">
                  Supprimer ce jeu
                </ConfirmButton>
              </form>
            </details>
          </div>
        ))}
      </div>

      {/* Ajout d'un nouveau jeu */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-title">Ajouter un jeu</h2>
        <div className="card p-5">
          <GameForm />
        </div>
      </div>
    </div>
  );
}

/** Formulaire de création/édition d'un jeu. */
function GameForm({
  game,
}: {
  game?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    color: string;
    status: string;
    isActive: boolean;
    order: number;
  };
}) {
  return (
    <form action={saveGame} className="mt-4 space-y-4">
      {game && <input type="hidden" name="id" value={game.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nom du jeu</label>
          <input name="name" required defaultValue={game?.name} className="field" placeholder="World of Warcraft" />
        </div>
        <div>
          <label className="label">Identifiant URL (slug)</label>
          <input name="slug" defaultValue={game?.slug} className="field" placeholder="wow (laisser vide = auto)" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">URL du logo</label>
          <input name="logoUrl" defaultValue={game?.logoUrl ?? ''} className="field" placeholder="https://..." />
        </div>
        <div>
          <label className="label">URL de l'image de fond (art officiel)</label>
          <input name="coverImageUrl" defaultValue={game?.coverImageUrl ?? ''} className="field" placeholder="https://..." />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Couleur d'accent</label>
          <input name="color" type="color" defaultValue={game?.color ?? '#4A9EFF'} className="field h-11 p-1" />
        </div>
        <div>
          <label className="label">Statut</label>
          <select name="status" defaultValue={game?.status ?? 'ACTIVE'} className="field">
            <option value="ACTIVE">Actif (jouable)</option>
            <option value="UPCOMING">À venir</option>
          </select>
        </div>
        <div>
          <label className="label">Ordre d'affichage</label>
          <input name="order" type="number" defaultValue={game?.order ?? 0} className="field" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isActive" defaultChecked={game?.isActive ?? true} className="h-4 w-4 accent-[#4A9EFF]" />
        Visible sur le site public
      </label>

      <button type="submit" className="btn-primary">
        {game ? 'Enregistrer' : 'Ajouter le jeu'}
      </button>
    </form>
  );
}
