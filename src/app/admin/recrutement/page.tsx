import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';
import { SLOT_STATUS } from '@/lib/labels';
import { saveSlot, deleteSlot } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminRecruitmentPage() {
  // Tous les jeux ont leur catégorie de recrutement (un nouveau jeu apparaît seul).
  const scope = allowedGameIds(await getAppUser());
  const games = await prisma.game.findMany({
    where: scope !== 'all' ? { id: { in: scope } } : {},
    orderBy: [{ status: 'asc' }, { order: 'asc' }],
    include: { recruitmentSlots: { orderBy: { order: 'asc' } } },
  });

  return (
    <div>
      <PageHeader
        title="Recrutement"
        description="Définis les postes recherchés et leur statut."
      />

      {games.length === 0 && (
        <p className="text-muted">Crée d'abord un jeu actif dans l'onglet « Jeux ».</p>
      )}

      <div className="space-y-12">
        {games.map((game) => (
          <section key={game.id}>
            <h2 className="mb-4 text-lg font-semibold text-title">{game.name}</h2>

            {/* Postes existants */}
            <div className="mb-6 space-y-3">
              {game.recruitmentSlots.map((slot) => (
                <div key={slot.id} className="card p-4">
                  <form action={saveSlot} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={slot.id} />
                    <input type="hidden" name="gameId" value={game.id} />
                    <div>
                      <label className="mb-1 block text-xs text-muted">Rôle</label>
                      <input name="role" defaultValue={slot.role} className="field py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Classe</label>
                      <input name="className" defaultValue={slot.className} className="field py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Statut</label>
                      <select name="status" defaultValue={slot.status} className="field py-1.5 text-sm">
                        <option value="OPEN">Ouvert</option>
                        <option value="LIMITED">Limité</option>
                        <option value="CLOSED">Fermé</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted">Ordre</label>
                      <input name="order" type="number" defaultValue={slot.order} className="field w-20 py-1.5 text-sm" />
                    </div>
                    <button type="submit" className="btn-secondary py-2 text-sm">Enregistrer</button>
                    <span className={`ml-auto inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SLOT_STATUS[slot.status].badge}`}>
                      {SLOT_STATUS[slot.status].label}
                    </span>
                  </form>
                  <form action={deleteSlot.bind(null, slot.id)} className="mt-2">
                    <ConfirmButton className="text-xs text-red-300 hover:text-red-200" message="Supprimer ce poste ?">
                      Supprimer le poste
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>

            {/* Nouveau poste */}
            <div className="card p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Ajouter un poste</p>
              <form action={saveSlot} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="gameId" value={game.id} />
                <div>
                  <label className="mb-1 block text-xs text-muted">Rôle</label>
                  <input name="role" required placeholder="DPS, Heal, Tank" className="field py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Classe</label>
                  <input name="className" required placeholder="Mage, Prêtre..." className="field py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Statut</label>
                  <select name="status" defaultValue="OPEN" className="field py-1.5 text-sm">
                    <option value="OPEN">Ouvert</option>
                    <option value="LIMITED">Limité</option>
                    <option value="CLOSED">Fermé</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary py-2 text-sm">Ajouter</button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
