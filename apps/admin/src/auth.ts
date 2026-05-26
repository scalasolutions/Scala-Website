import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // Whitelisted email
        const whitelistedEmail = 'scalasolutions.dev@gmail.com';
        // Password loaded securely from environment variables, with a standard fallback for development
        const expectedPassword = process.env.ADMIN_PASSWORD || 'scala-admin-2026';

        if (email === whitelistedEmail && password === expectedPassword) {
          return {
            id: 'admin',
            name: 'Scala Admin',
            email: whitelistedEmail,
            role: 'admin',
          };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || 'fallback-secret-at-least-32-characters-long',
});
