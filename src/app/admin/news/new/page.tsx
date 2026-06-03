import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { NewsForm } from '@/components/admin/news-form';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function NewNewsPage() {
  const games = await prisma.game.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <Link href="/admin/news" className="text-sm text-muted hover:text-accent">
        ← Retour aux news
      </Link>
      <div className="mt-4">
        <PageHeader title="Nouvel article" description="Rédige et publie un nouvel article." />
      </div>
      <NewsForm games={games.map((g) => ({ id: g.id, name: g.name }))} />
    </div>
  );
}
