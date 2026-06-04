import type { MetadataRoute } from 'next';
import { getPublishedNews } from '@/lib/data';

const BASE = (process.env.NEXTAUTH_URL || 'https://abso-v2.vercel.app').replace(/\/$/, '');

// Régénéré chaque heure : intègre les nouvelles news sans rebuild complet.
export const revalidate = 3600;

/** Plan du site : pages publiques + articles de news publiés. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/progression`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/recrutement`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/calendrier`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/news`, changeFrequency: 'daily', priority: 0.7 },
  ];

  let newsRoutes: MetadataRoute.Sitemap = [];
  try {
    const news = await getPublishedNews();
    newsRoutes = news.map((n) => ({
      url: `${BASE}/news/${n.slug}`,
      lastModified: n.updatedAt ?? n.publishedAt ?? undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch {
    // Base indisponible : on renvoie au moins les routes statiques.
  }

  return [...staticRoutes, ...newsRoutes];
}
