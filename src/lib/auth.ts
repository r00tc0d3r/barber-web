import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

// Helper type for extra claims in JWT token
type TokenClaims = { role: string; id: string };
type UserClaims = { role: string; id: string };

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Solo admins pueden entrar con credentials
        if (!user || !user.password || user.role === "CLIENT") return null;

        const isValid = await compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google sign-in: crear usuario si no existe
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "CLIENT",
            },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // Al iniciar sesión, buscar el role del usuario en la DB
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        const t = token as TokenClaims;
        const u = user as unknown as UserClaims;
        t.id = dbUser?.id ?? u.id;
        t.role = dbUser?.role ?? "CLIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as unknown as TokenClaims;
        const s = session.user as unknown as UserClaims;
        s.role = t.role;
        s.id = t.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
