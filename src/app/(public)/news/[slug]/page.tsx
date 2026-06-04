import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { getPublishedNewsBySlug } from '@/lib/data';

export const revalidate = 60;

// SEO dynamique : titre + description + og:image propres à l'article.
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getPublishedNewsBySlug(params.slug);
  if (!article) return { title: 'Article introuvable' };

  return {
    title: article.title,
    description: article.excerpt || undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
      type: 'article',
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getPublishedNewsBySlug(params.slug);
  if (!article) notFound();

  return (
    <article className="container-page max-w-3xl py-16">
      <Link href="/news" className="text-sm text-muted hover:text-accent">
        ← Toutes les news
      </Link>

      <header className="mt-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted">
          <span>{formatDate(article.publishedAt)}</span>
          {article.game && (
            <>
              <span>·</span>
              <span
                className="rounded-full px-2 py-0.5 font-medium"
                style={{
                  color: article.game.color,
                  backgroundColor: `${article.game.color}1A`,
                }}
              >
                {article.game.name}
              </span>
            </>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold text-title sm:text-4xl">
          {article.title}
        </h1>
      </header>

      {article.imageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl border border-border">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Contenu riche (déjà nettoyé/sanitisé à l'enregistrement) */}
      <div
        className="prose-absolution mt-10"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </article>
  );
}
