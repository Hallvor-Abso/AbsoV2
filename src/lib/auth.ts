import { type NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { cache } from 'react';
import { prisma } from './prisma';
import type { SessionUser } from './permissions';
import type { Role } from '@prisma/client';

/**
 * Authentification (NextAuth.js) — comptes visiteurs + comptes d'administration.
 *
 * Connexion par "identifiant" (email OU nom d'utilisateur) + mot de passe.
 * La session transporte le rôle et les jeux administrés, pour appliquer les
 * permissions partout (voir src/lib/permissions.ts).
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages: { signIn: '/connexion' },
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        identifier: { label: 'Email ou identifiant', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        const id = credentials.identifier.trim();

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: id.toLowerCase() }, { username: id }] },
          include: { adminGames: { select: { id: true } } },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Auto-réparation : le compte « bootstrap » (.env) est toujours Super Admin.
        let role: Role = user.role;
        if (
          user.username &&
          process.env.ADMIN_USERNAME &&
          user.username === process.env.ADMIN_USERNAME &&
          role !== 'SUPER_ADMIN'
        ) {
          await prisma.user.update({ where: { id: user.id }, data: { role: 'SUPER_ADMIN' } });
          role = 'SUPER_ADMIN';
        }

        // On renvoie via une variable (et non un littéral) pour transporter
        // role + adminGameIds sans erreur de typage NextAuth.
        const account: SessionUser = {
          id: user.id,
          name: user.displayName || user.username || user.email || 'Utilisateur',
          role,
          adminGameIds: user.adminGames.map((g) => g.id),
        };
        return account;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as SessionUser;
        token.id = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        const su = session.user as unknown as SessionUser;
        su.id = token.id as string;
        // On relit le rôle et les jeux administrés EN BASE à chaque fois :
        // ainsi tout changement de rôle est pris en compte immédiatement,
        // sans avoir à se déconnecter/reconnecter.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            displayName: true,
            username: true,
            email: true,
            adminGames: { select: { id: true } },
          },
        });
        if (dbUser) {
          su.role = dbUser.role;
          su.adminGameIds = dbUser.adminGames.map((g) => g.id);
          su.name = dbUser.displayName || dbUser.username || dbUser.email || 'Utilisateur';
        } else {
          su.role = 'VISITEUR';
          su.adminGameIds = [];
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getSession() {
  return getServerSession(authOptions);
}

/**
 * Récupère l'utilisateur courant (typé) côté serveur, ou null.
 * Mis en cache pour la durée d'UNE requête (React cache) afin d'éviter de
 * recalculer la session plusieurs fois sur une même page.
 */
export const getAppUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const session = await getSession();
    if (!session?.user) return null;
    return session.user as unknown as SessionUser;
  } catch {
    // Ex : pas de NEXTAUTH_SECRET (mode démo) → simplement déconnecté.
    return null;
  }
});
