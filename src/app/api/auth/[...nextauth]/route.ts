import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Route gérée entièrement par NextAuth (login, logout, session...).
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
