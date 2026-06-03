import { RichTextEditor } from './rich-text-editor';
import { saveNews } from '@/app/admin/actions';

type NewsData = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  imageUrl: string | null;
  status: string;
  gameId: string | null;
  publishedAt: string; // valeur pour <input datetime-local> ('' si vide)
};

type GameOption = { id: string; name: string };

/** Formulaire de création/édition d'un article de news. */
export function NewsForm({
  news,
  games,
  presetGameId,
}: {
  news?: NewsData;
  games: GameOption[];
  presetGameId?: string;
}) {
  return (
    <form action={saveNews} className="space-y-5">
      {news && <input type="hidden" name="id" value={news.id} />}

      <div>
        <label className="label">Titre</label>
        <input name="title" required defaultValue={news?.title} className="field" placeholder="Titre de l'article" />
      </div>

      <div>
        <label className="label">Résumé (court, affiché dans la grille)</label>
        <textarea name="excerpt" rows={2} defaultValue={news?.excerpt ?? ''} className="field" placeholder="Une phrase d'accroche..." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">URL de l'image de couverture</label>
          <input name="imageUrl" defaultValue={news?.imageUrl ?? ''} className="field" placeholder="https://..." />
        </div>
        <div>
          <label className="label">Jeu associé</label>
          <select name="gameId" defaultValue={news?.gameId ?? presetGameId ?? ''} className="field">
            <option value="">Aucun (général)</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Contenu</label>
        <RichTextEditor name="content" defaultValue={news?.content ?? ''} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Statut</label>
          <select name="status" defaultValue={news?.status ?? 'DRAFT'} className="field">
            <option value="DRAFT">Brouillon (invisible au public)</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </div>
        <div>
          <label className="label">Date de publication</label>
          <input type="datetime-local" name="publishedAt" defaultValue={news?.publishedAt ?? ''} className="field" />
          <p className="mt-1 text-xs text-muted">
            Vide = maintenant. Une date <strong>future</strong> programme la publication
            (l'article reste masqué jusque-là).
          </p>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        {news ? 'Enregistrer les modifications' : "Créer l'article"}
      </button>
    </form>
  );
}
