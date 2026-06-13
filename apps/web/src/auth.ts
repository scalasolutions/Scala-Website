import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getClients } from '@/lib/db/queries';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // 1. Whitelisted Admin Credential check
        const whitelistedEmail = 'scalasolutions.dev@gmail.com';
        const expectedPassword = process.env.ADMIN_PASSWORD || 'scala-admin-2026';

        if (email === whitelistedEmail && password === expectedPassword) {
          return {
            id: 'admin',
            name: 'Scala Admin',
            email: whitelistedEmail,
            role: 'admin',
          };
        }

        // 2. Client Portal Credential check
        try {
          const clients = await getClients();
          const client = clients.find(c => c.email.trim().toLowerCase() === email);
          if (client && client.portalPassword === password) {
            return {
              id: client.id,
              name: client.name,
              email: client.email,
              role: 'client',
            };
          }
        } catch (e) {
          console.error("NextAuth client authorization check failed:", e);
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.scalasolutions.id' : undefined,
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'fallback-secret-at-least-32-characters-long',
});
