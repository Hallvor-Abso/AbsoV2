import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { ActionForm } from '@/components/admin/action-form';
import { GameForm } from '@/components/admin/game-form';
import { GameAddModal } from '@/components/admin/game-add-modal';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { canManageGlobally } from '@/lib/permissions';
import { toggleGame, deleteGame } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminGamesPage() {
  if (!canManageGlobally(await getAppUser())) redirect('/admin');
  const games = await prisma.game.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <PageHeader
        title="Jeux"
        description="Active/désactive les jeux. Un jeu désactivé disparaît entièrement du site public."
      />

      {/* Bouton d'ajout (ouvre une modale avec le formulaire de création) */}
      <div className="mb-6 flex justify-end">
        <GameAddModal />
      </div>

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
              <ActionForm action={deleteGame.bind(null, game.id)} success="Jeu supprimé" className="mt-3">
                <ConfirmButton message="Supprimer ce jeu supprimera aussi sa progression, ses postes et ses événements. Continuer ?">
                  Supprimer ce jeu
                </ConfirmButton>
              </ActionForm>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
