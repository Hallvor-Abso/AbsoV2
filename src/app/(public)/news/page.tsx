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

  // Article « À la Une » : celui marqué comme tel dans l'admin, sinon le plus récent.
  const featured = news.find((n) => n.featured) ?? news[0];
  const rest = featured ? news.filter((n) => n.id !== featured.id) : news;

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
        <>
          {/* ===================== ARTICLE À LA UNE ===================== */}
          {featured && (
            <Reveal>
              <Link
                href={`/news/${featured.slug}`}
                className="group mb-12 grid overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-accent/50 hover:shadow-glow md:grid-cols-2"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-ink-soft md:aspect-auto md:min-h-[320px]">
                  {featured.imageUrl ? (
                    <Image
                      src={featured.imageUrl}
                      alt={featured.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-display text-3xl opacity-20">Absolution</span>
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
                    À la Une
                  </span>
                </div>

                <div className="flex flex-col justify-center p-7 md:p-10">
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                    <span>{formatDate(featured.publishedAt)}</span>
                    {featured.game && (
                      <>
                        <span>·</span>
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{ color: featured.game.color, backgroundColor: `${featured.game.color}1A` }}
                        >
                          {featured.game.name}
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-title transition-colors group-hover:text-accent sm:text-3xl">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="mt-3 text-muted">{featured.excerpt}</p>
                  )}
                  <span className="mt-5 text-sm font-medium text-accent">Lire l'article →</span>
                </div>
              </Link>
            </Reveal>
          )}

          {/* ===================== GRILLE DES AUTRES ===================== */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article, i) => (
                <Reveal key={article.id} delay={i * 0.06}>
                  <Link
                    href={`/news/${article.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-accent/50 hover:shadow-glow"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-ink-soft">
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          unoptimized
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
                              style={{ color: article.game.color, backgroundColor: `${article.game.color}1A` }}
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
                      <span className="mt-auto pt-4 text-sm font-medium text-accent">Lire l'article →</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
