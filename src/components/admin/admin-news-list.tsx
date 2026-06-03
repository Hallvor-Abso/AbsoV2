'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameTabBar, type GameTabInfo } from '@/components/game-tab-bar';
import { ConfirmButton } from './confirm-button';
import { toggleFeatured, deleteNews } from '@/app/admin/actions';
import { formatDate } from '@/lib/utils';

export type AdminArticle = {
  id: string;
  title: string;
  gameId: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  publishedAt: string | null; // ISO
};

const NONE = '__none__'; // onglet « Sans jeu »

/** Liste des articles, séparée par jeu, avec bouton « À la Une » et planification. */
export function AdminNewsList({
  games,
  articles,
}: {
  games: GameTabInfo[];
  articles: AdminArticle[];
}) {
  const hasNone = articles.some((a) => !a.gameId);
  const tabs: GameTabInfo[] = [
    ...games,
    ...(hasNone ? [{ id: NONE, name: 'Sans jeu', color: '#8A8F9C' } as GameTabInfo] : []),
  ];

  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const list = articles.filter((a) =>
    activeId === NONE ? !a.gameId : a.gameId === activeId
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <GameTabBar games={tabs} activeId={activeId ?? ''} onSelect={setActiveId} />
      </div>

      <div className="mb-6">
        <Link
          href={activeId && activeId !== NONE ? `/admin/news/new?jeu=${activeId}` : '/admin/news/new'}
          className="btn-primary"
        >
          Nouvel article
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-muted">Aucun article pour ce jeu.</p>
      ) : (
        <div className="card divide-y divide-border">
          {list.map((article) => {
            const now = Date.now();
            const scheduled =
              article.status === 'PUBLISHED' &&
              article.publishedAt != null &&
              new Date(article.publishedAt).getTime() > now;
            return (
              <div key={article.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {article.featured && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-ink">
                        À la Une
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        scheduled
                          ? 'bg-amber-400/10 text-amber-300'
                          : article.status === 'PUBLISHED'
                            ? 'bg-accent/15 text-accent'
                            : 'bg-white/5 text-muted'
                      }`}
                    >
                      {scheduled ? 'Programmé' : article.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-medium text-title">{article.title}</p>
                  <p className="text-xs text-muted">
                    {scheduled
                      ? `Publication prévue le ${formatDate(article.publishedAt)}`
                      : article.publishedAt
                        ? `Publié le ${formatDate(article.publishedAt)}`
                        : 'Non publié'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <form action={toggleFeatured.bind(null, article.id)}>
                    <button
                      type="submit"
                      className={`text-sm font-medium ${
                        article.featured ? 'text-amber-300 hover:text-amber-200' : 'text-accent hover:text-accent-deep'
                      }`}
                    >
                      {article.featured ? 'Retirer de la Une' : 'Mettre à la Une'}
                    </button>
                  </form>
                  <Link href={`/admin/news/${article.id}`} className="text-sm font-medium text-foreground hover:text-accent">
                    Modifier
                  </Link>
                  <form action={deleteNews.bind(null, article.id)}>
                    <ConfirmButton message="Supprimer définitivement cet article ?">Supprimer</ConfirmButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
