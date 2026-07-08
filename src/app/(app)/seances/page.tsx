import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_BADGE,
  SESSION_TYPE_LABELS,
  formatDate,
} from "@/lib/domain";

export default async function AthleteSessions() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "COACH") redirect("/coach");

  const sessions = await prisma.trainingSession.findMany({
    where: { athleteId: session.user.id },
    orderBy: { date: "desc" },
    include: { _count: { select: { exercises: true } } },
  });

  const todo = sessions.filter((s) => s.status === "ASSIGNED");
  const done = sessions.filter((s) => s.status === "COMPLETED");

  const SessionCard = ({ s }: { s: (typeof sessions)[number] }) => (
    <Link
      href={`/seances/${s.id}`}
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{s.title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_TYPE_BADGE[s.type]}`}
          >
            {SESSION_TYPE_LABELS[s.type]}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(s.date)} · {s._count.exercises} exercice
          {s._count.exercises > 1 ? "s" : ""}
        </p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${SESSION_STATUS_BADGE[s.status]}`}
      >
        {SESSION_STATUS_LABELS[s.status]}
      </span>
    </Link>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Mes séances</h1>

      {sessions.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Aucune séance assignée pour l&apos;instant.
        </p>
      )}

      {todo.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            À faire
          </h2>
          <ul className="mt-2 space-y-3">
            {todo.map((s) => (
              <li key={s.id}>
                <SessionCard s={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Terminées
          </h2>
          <ul className="mt-2 space-y-3">
            {done.map((s) => (
              <li key={s.id}>
                <SessionCard s={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
