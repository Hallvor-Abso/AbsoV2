/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // On autorise les images distantes (logos de jeux, art officiel, images de news).
    // Supabase Storage et les CDN de jeux passent par HTTPS, on accepte donc tout hôte https.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // En-têtes de sécurité appliqués à toutes les routes. X-Frame-Options reste
  // SAMEORIGIN pour que l'aperçu des overlays (iframe, même origine) fonctionne ;
  // les Browser Sources OBS ne sont pas des iframes → non concernées.
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    ];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
