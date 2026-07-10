import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

function emailList(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const allowedEmails = emailList(process.env.ALLOWED_EMAILS);
const coachEmails = emailList(process.env.COACH_EMAILS);
// Connexion dev : jamais active sur Vercel, même si la variable traîne.
export const devLoginEnabled =
  process.env.AUTH_DEV_LOGIN === "true" && !process.env.VERCEL;

// Provider de développement : connexion en un clic en tant que coach ou
// athlète, sans OAuth. Jamais actif si AUTH_DEV_LOGIN n'est pas "true".
const devLogin = Credentials({
  id: "dev-login",
  name: "Connexion dev",
  credentials: { email: { label: "Email" } },
  async authorize(credentials) {
    if (!devLoginEnabled) return null;
    const email = String(credentials?.email ?? "").toLowerCase();
    if (!email.endsWith("@dev.local")) return null;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [Google, ...(devLoginEnabled ? [devLogin] : [])],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (account?.provider === "dev-login") return true;
      // Application privée : seuls les emails de l'allowlist entrent.
      return allowedEmails.length > 0 && allowedEmails.includes(email);
    },
    async jwt({ token, user }) {
      // `user` n'est défini qu'à la connexion : on synchronise le rôle
      // depuis la base (et on promeut en COACH si l'email est listé).
      if (user?.email) {
        const email = user.email.toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser && coachEmails.includes(email) && dbUser.role !== "COACH") {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: "COACH" },
          });
        }
        token.sub = dbUser?.id ?? token.sub;
        token.role = dbUser?.role ?? "ATHLETE";
      }
      return token;
    },
  },
});
