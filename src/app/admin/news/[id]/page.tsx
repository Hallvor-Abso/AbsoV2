import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/page-header';
import { NewsForm } from '@/components/admin/news-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function EditNewsPage({
  params,
}: {
  params: { id: string };
}) {
  const [news, games] = await Promise.all([
    prisma.news.findUnique({ where: { id: params.id } }),
    prisma.game.findMany({ orderBy: { order: 'asc' } }),
  ]);

  if (!news) notFound();

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
          featured: news.featured,
        }}
        games={games.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}
