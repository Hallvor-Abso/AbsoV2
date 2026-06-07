import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { NewsForm } from '@/components/admin/news-form';
import { prisma } from '@/lib/prisma';
import { getAppUser } from '@/lib/auth';
import { allowedGameIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({
  params,
}: {
  params: { id: string };
}) {
  const scope = allowedGameIds(await getAppUser());
  const [news, games] = await Promise.all([
    prisma.news.findUnique({ where: { id: params.id } }),
    prisma.game.findMany({
      where: scope !== 'all' ? { id: { in: scope } } : {},
      orderBy: { order: 'asc' },
    }),
  ]);

  if (!news) notFound();

  // Un admin de jeu ne peut pas éditer une news hors de son périmètre.
  if (scope !== 'all' && news.gameId && !scope.includes(news.gameId)) notFound();

  return (
    <div>
      <Link href="/admin/news" className="text-sm text-muted hover:text-accent">
        ← Retour aux news
      </Link>
      <div className="mt-4">
        <PageHeader title="Modifier l'article" />
      </div>
      <NewsForm
        news={{
          id: news.id,
          title: news.title,
          excerpt: news.excerpt,
          content: news.content,
          imageUrl: news.imageUrl,
          status: news.status,
          gameId: news.gameId,
          publishedAt: news.publishedAt?.toISOString() ?? '',
        }}
        games={games.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}
