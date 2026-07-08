import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Le middleware n'utilise que la config "edge-safe" (pas de Prisma) :
// il vérifie le JWT et applique la règle de rôle sur /coach.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
