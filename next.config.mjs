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
};

export default nextConfig;
