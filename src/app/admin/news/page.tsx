import { PageHeader } from '@/components/admin/page-header';
import { AdminNewsList, type AdminArticle } from '@/components/admin/admin-news-list';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const scope = allowedGameIds(await getAppUser());

  const [news, games] = await Promise.all([
    prisma.news.findMany({
      where: scope !== 'all' ? { gameId: { in: scope } } : {},
      orderBy: { createdAt: 'desc' },
    }),
    prisma.game.findMany({
      where: scope !== 'all' ? { id: { in: scope } } : {},
      orderBy: { order: 'asc' },
    }),
  ]);

  const articles: AdminArticle[] = news.map((n) => ({
    id: n.id,
    title: n.title,
    gameId: n.gameId,
    status: n.status,
    featured: n.featured,
    publishedAt: n.publishedAt ? n.publishedAt.toISOString() : null,
  }));

  return (
    <div>
      <PageHeader
        title="News"
        description="Articles séparés par jeu. Programme la publication et choisis l'article « À la Une » (un seul à la fois)."
      />
      <AdminNewsList
        games={games.map((g) => ({ id: g.id, name: g.name, color: g.color, logoUrl: g.logoUrl, status: g.status }))}
        articles={articles}
      />
    </div>
  );
}
