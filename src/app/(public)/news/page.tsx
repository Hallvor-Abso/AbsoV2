import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SectionHeading } from '@/components/section-heading';
import { Reveal } from '@/components/reveal';
import { formatDate } from '@/lib/utils';
import { getPublishedNews } from '@/lib/data';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'News',
  description: "L'actualité de la guilde Absolution : annonces, progression et événements.",
};

export default async function NewsPage() {
  const news = await getPublishedNews();

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Actualités"
        title="News"
        subtitle="Annonces, comptes-rendus et actualité de la guilde."
        className="mb-12"
      />

      {news.length === 0 ? (
        <p className="text-muted">Aucun article publié pour le moment.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((article, i) => (
            <Reveal key={article.id} delay={i * 0.06}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-accent/50 hover:shadow-glow"
              >
                {/* Image de couverture */}
                <div className="relative aspect-[16/9] overflow-hidden bg-ink-soft">
                  {article.imageUrl ? (
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted">
                      <span className="font-display text-2xl opacity-30">Absolution</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted">
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
                  <h3 className="text-lg font-semibold text-title transition-colors group-hover:text-accent">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{article.excerpt}</p>
                  )}
                  <span className="mt-auto pt-4 text-sm font-medium text-accent">
                    Lire l'article →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
