import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { normalizeRoleName } from "@/lib/roles";

type SessionRole = string | { role?: string | { name?: string } };

function extractRoleName(role: SessionRole) {
  if (typeof role === "string") return role;
  if (typeof role.role === "string") return role.role;
  return role.role?.name || "";
}

/**
 * Edge-compatible auth config.
 * Only include providers that do NOT require Node.js APIs (e.g. bcrypt, Prisma).
 * The Credentials provider is added in src/auth.ts which runs in Node.js only.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // Handle both raw Prisma includes {role: {name: 'ADMIN'}} and flat arrays ['ADMIN'] safely
        const roles = (user as { roles?: SessionRole[] }).roles || [];
        token.roles = roles.map((role) => normalizeRoleName(extractRoleName(role))).filter(Boolean);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).roles = token.roles || [];
      }
      return session;
    },
  },
};
