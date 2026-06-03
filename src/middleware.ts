import { withAuth } from 'next-auth/middleware';

/**
 * Protection des routes admin : redirige les visiteurs non connectés vers la
 * page de connexion. Le contrôle fin des rôles (qui a le droit d'accéder à
 * quoi) est fait côté serveur dans la mise en page de l'admin.
 */
export default withAuth({
  pages: { signIn: '/connexion' },
});

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
