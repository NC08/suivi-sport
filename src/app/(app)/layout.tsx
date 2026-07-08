import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { role, name, email } = session.user;

  const links =
    role === "COACH"
      ? [
          { href: "/coach", label: "Séances" },
          { href: "/coach/seances/new", label: "Nouvelle séance" },
          { href: "/coach/exercices", label: "Exercices" },
          { href: "/progression", label: "Progression" },
        ]
      : [
          { href: "/seances", label: "Mes séances" },
          { href: "/progression", label: "Progression" },
        ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Suivi Sport
            </Link>
            <nav className="flex gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-slate-600 hover:text-slate-900"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                role === "COACH"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {role === "COACH" ? "Coach" : "Athlète"}
            </span>
            <span className="hidden text-sm text-slate-500 sm:inline">
              {name ?? email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-slate-400 hover:text-slate-700"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
