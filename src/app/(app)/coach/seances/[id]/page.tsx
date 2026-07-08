import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_BADGE,
  SESSION_TYPE_LABELS,
  formatDate,
  formatDuration,
  formatPrescription,
} from "@/lib/domain";

export default async function CoachSessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await prisma.trainingSession.findUnique({
    where: { id },
    include: {
      athlete: { select: { name: true, email: true } },
      exercises: {
        orderBy: { position: "asc" },
        include: {
          exercise: true,
          performanceSets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });
  if (!session) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_TYPE_BADGE[session.type]}`}
        >
          {SESSION_TYPE_LABELS[session.type]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${SESSION_STATUS_BADGE[session.status]}`}
        >
          {SESSION_STATUS_LABELS[session.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {formatDate(session.date)} · assignée à{" "}
        {session.athlete.name ?? session.athlete.email}
      </p>
      {session.coachNotes && (
        <p className="mt-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          {session.coachNotes}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {session.exercises.map((se) => (
          <section
            key={se.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">
                {se.position}. {se.exercise.name}
              </h2>
              <span className="text-sm text-slate-500">
                {formatPrescription(se) || "libre"}
              </span>
            </div>
            {se.instructions && (
              <p className="mt-1 text-sm text-slate-500">{se.instructions}</p>
            )}

            {se.performanceSets.length > 0 ? (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-1 pr-2 font-medium">Série</th>
                    <th className="py-1 pr-2 font-medium">Reps</th>
                    <th className="py-1 pr-2 font-medium">Charge</th>
                    <th className="py-1 pr-2 font-medium">Temps</th>
                    <th className="py-1 pr-2 font-medium">Distance</th>
                    <th className="py-1 pr-2 font-medium">RPE</th>
                    <th className="py-1 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {se.performanceSets.map((set) => (
                    <tr key={set.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-400">{set.setNumber}</td>
                      <td className="py-1.5 pr-2">{set.reps ?? "—"}</td>
                      <td className="py-1.5 pr-2">
                        {set.weightKg !== null ? `${set.weightKg} kg` : "—"}
                      </td>
                      <td className="py-1.5 pr-2">
                        {set.durationSec !== null ? formatDuration(set.durationSec) : "—"}
                      </td>
                      <td className="py-1.5 pr-2">
                        {set.distanceM !== null ? `${set.distanceM} m` : "—"}
                      </td>
                      <td className="py-1.5 pr-2">{set.rpe ?? "—"}</td>
                      <td className="py-1.5 text-slate-500">{set.notes ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-sm italic text-slate-400">
                Pas encore de réalisation saisie.
              </p>
            )}
          </section>
        ))}
      </div>

      {(session.athleteNotes || session.sessionRpe) && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <h2 className="font-semibold text-emerald-900">Retour de l&apos;athlète</h2>
          {session.sessionRpe && (
            <p className="mt-1 text-emerald-900">RPE global : {session.sessionRpe}/10</p>
          )}
          {session.athleteNotes && (
            <p className="mt-1 text-emerald-900">{session.athleteNotes}</p>
          )}
        </div>
      )}
    </div>
  );
}
