import { type NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * Configuration de l'authentification admin (NextAuth.js).
 *
 * On utilise un login simple "identifiant + mot de passe" :
 *  - L'admin entre ses identifiants sur /admin/login
 *  - On vérifie le mot de passe (haché avec bcrypt) en base de données
 *  - Une session sécurisée (JWT) est créée pour 8 heures
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 heures
  },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        username: { label: 'Identifiant', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, name: user.username };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Raccourci pour récupérer la session côté serveur. */
export function getSession() {
  return getServerSession(authOptions);
}

/** Vrai si la requête courante provient d'un admin connecté. */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session?.user);
}
