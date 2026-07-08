import type { NextAuthConfig } from "next-auth";

// Configuration partagée avec le middleware (edge runtime) : ne doit
// importer ni Prisma ni aucun module Node. Les providers et callbacks
// nécessitant la base sont ajoutés dans src/auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role === "COACH" ? "COACH" : "ATHLETE";
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/login") return true;
      if (!auth?.user) return false;
      if (pathname.startsWith("/coach") && auth.user.role !== "COACH") {
        return Response.redirect(new URL("/seances", request.nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
