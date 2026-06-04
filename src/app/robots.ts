import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXTAUTH_URL || 'https://abso-v2.vercel.app').replace(/\/$/, '');

/** robots.txt : on autorise le public, on bloque l'admin et les routes techniques. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/setup', '/connexion', '/inscription'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
