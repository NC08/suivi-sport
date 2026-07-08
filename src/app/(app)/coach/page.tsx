import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_BADGE,
  SESSION_TYPE_LABELS,
  formatDate,
} from "@/lib/domain";

export default async function CoachDashboard() {
  const sessions = await prisma.trainingSession.findMany({
    orderBy: { date: "desc" },
    include: {
      athlete: { select: { name: true, email: true } },
      blocks: { select: { _count: { select: { exercises: true } } } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Séances</h1>
        <Link
          href="/coach/seances/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nouvelle séance
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Aucune séance pour l&apos;instant. Créez la première !
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/coach/seances/${s.id}`}
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
                    {formatDate(s.date)} · {s.athlete.name ?? s.athlete.email} ·{" "}
                    {(() => {
                      const n = s.blocks.reduce((sum, b) => sum + b._count.exercises, 0);
                      return `${n} exercice${n > 1 ? "s" : ""}`;
                    })()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${SESSION_STATUS_BADGE[s.status]}`}
                >
                  {SESSION_STATUS_LABELS[s.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
