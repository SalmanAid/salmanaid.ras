import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import { UserService } from "@/services/user.service";
import { VerifySchema } from "@/schemas/auth.schema";

/**
 * Full Node.js auth setup.
 * The Credentials provider lives here (not in auth.config.ts) because
 * it depends on bcrypt and Prisma which are Node.js-only and would fail in Edge middleware.
 */

// Session configuration from environment variables
const SESSION_MAX_AGE = parseInt(process.env.AUTH_SESSION_MAX_AGE || String(24 * 60 * 60), 10); // Default: 24 hours
const SESSION_UPDATE_AGE = parseInt(process.env.AUTH_SESSION_UPDATE_AGE || String(60 * 60), 10); // Default: 1 hour

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { 
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  secret: process.env.AUTH_SECRET,
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = VerifySchema.safeParse(credentials);
        if (!parsed.success) return null;

        return await UserService.verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
});
