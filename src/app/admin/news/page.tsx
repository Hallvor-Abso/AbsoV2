import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { NEWS_STATUS } from '@/lib/labels';
import { formatDate } from '@/lib/utils';
import { deleteNews } from '@/app/admin/actions';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const scope = allowedGameIds(await getAppUser());
  const news = await prisma.news.findMany({
    where: scope !== 'all' ? { gameId: { in: scope } } : {},
    orderBy: { createdAt: 'desc' },
    include: { game: true },
  });

  return (
    <div>
      <PageHeader
        title="News"
        description="Crée, modifie et publie les articles."
        action={
          <Link href="/admin/news/new" className="btn-primary">
            Nouvel article
          </Link>
        }
      />

      {news.length === 0 ? (
        <p className="text-muted">Aucun article. Commence par en créer un.</p>
      ) : (
        <div className="card divide-y divide-border">
          {news.map((article) => (
            <div key={article.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      article.status === 'PUBLISHED'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-white/5 text-muted'
                    }`}
                  >
                    {NEWS_STATUS[article.status].label}
                  </span>
                  {article.game && (
                    <span className="text-xs text-muted">{article.game.name}</span>
                  )}
                </div>
                <p className="mt-1 truncate font-medium text-title">{article.title}</p>
                <p className="text-xs text-muted">
                  {article.publishedAt ? `Publié le ${formatDate(article.publishedAt)}` : `Créé le ${formatDate(article.createdAt)}`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link href={`/admin/news/${article.id}`} className="text-sm font-medium text-accent hover:text-accent-deep">
                  Modifier
                </Link>
                <form action={deleteNews.bind(null, article.id)}>
                  <ConfirmButton message="Supprimer définitivement cet article ?">
                    Supprimer
                  </ConfirmButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
