import { withAuth } from 'next-auth/middleware';

/**
 * Protection des routes admin.
 *
 * Intercepte toute requête vers /admin/* (sauf /admin/login) et redirige les
 * visiteurs non connectés vers la page de connexion.
 */
export default withAuth({
  pages: {
    signIn: '/admin/login',
  },
});

export const config = {
  // La page /admin elle-même + toutes ses sous-pages SAUF /admin/login
  matcher: ['/admin', '/admin/((?!login).*)'],
};
