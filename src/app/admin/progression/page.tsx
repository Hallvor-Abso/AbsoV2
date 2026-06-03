import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { BOSS_STATUS } from '@/lib/labels';
import {
  createTier,
  deleteTier,
  createBoss,
  updateBoss,
  deleteBoss,
} from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

/** Convertit une date en valeur d'input "date" (YYYY-MM-DD). */
function toDateInput(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

export default async function AdminProgressionPage() {
  const games = await prisma.game.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { order: 'asc' },
    include: {
      raidTiers: {
        orderBy: { order: 'asc' },
        include: { bosses: { orderBy: { order: 'asc' } } },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Progression"
        description="Gère les tiers de raid et le statut de chaque boss."
      />

      {games.length === 0 && (
        <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>
      )}

      <div className="space-y-12">
        {games.map((game) => (
          <section key={game.id}>
            <h2 className="mb-4 text-lg font-semibold text-title">{game.name}</h2>

            {/* Ajout d'un tier */}
            <form action={createTier} className="mb-6 flex flex-wrap gap-3">
              <input type="hidden" name="gameId" value={game.id} />
              <input name="name" required placeholder="Nom du tier (ex : Liberation of Undermine)" className="field max-w-md" />
              <button type="submit" className="btn-secondary">Ajouter un tier</button>
            </form>

            <div className="space-y-6">
              {game.raidTiers.map((tier) => (
                <div key={tier.id} className="card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-title">{tier.name}</h3>
                    <form action={deleteTier.bind(null, tier.id)}>
                      <ConfirmButton message="Supprimer ce tier et tous ses boss ?">
                        Supprimer le tier
                      </ConfirmButton>
                    </form>
                  </div>

                  {/* Liste des boss */}
                  <div className="space-y-2">
                    {tier.bosses.map((boss) => (
                      <div key={boss.id} className="rounded-lg border border-border bg-ink-soft/40 p-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${BOSS_STATUS[boss.status].dot}`} />
                          <span className="font-medium text-foreground">{boss.name}</span>
                        </div>
                        <form action={updateBoss} className="mt-3 flex flex-wrap items-end gap-3">
                          <input type="hidden" name="id" value={boss.id} />
                          <div>
                            <label className="mb-1 block text-xs text-muted">Statut</label>
                            <select name="status" defaultValue={boss.status} className="field py-1.5 text-sm">
                              <option value="UNTESTED">Non tenté</option>
                              <option value="PROGRESSING">En progression</option>
                              <option value="KILLED">Tué</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-muted">Date de premier kill</label>
                            <input type="date" name="firstKillDate" defaultValue={toDateInput(boss.firstKillDate)} className="field py-1.5 text-sm" />
                          </div>
                          <div className="min-w-[220px] flex-1">
                            <label className="mb-1 block text-xs text-muted">Image du boss (URL)</label>
                            <input name="imageUrl" defaultValue={boss.imageUrl ?? ''} placeholder="https://..." className="field py-1.5 text-sm" />
                          </div>
                          <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                        </form>
                        <form action={deleteBoss.bind(null, boss.id)} className="mt-2">
                          <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce boss ?">
                            Supprimer le boss
                          </ConfirmButton>
                        </form>
                      </div>
                    ))}
                  </div>

                  {/* Ajout d'un boss */}
                  <form action={createBoss} className="mt-4 flex flex-wrap gap-3">
                    <input type="hidden" name="tierId" value={tier.id} />
                    <input name="name" required placeholder="Nom du boss" className="field max-w-xs py-1.5 text-sm" />
                    <button type="submit" className="btn-secondary py-2 text-sm">Ajouter un boss</button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
