import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  BLOCK_FORMAT_LABELS,
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_BADGE,
  SESSION_TYPE_LABELS,
  formatBlockHeader,
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
      blocks: {
        orderBy: { position: "asc" },
        include: {
          exercises: {
            orderBy: { position: "asc" },
            include: {
              exercise: true,
              performanceSets: { orderBy: { setNumber: "asc" } },
            },
          },
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
        <span className="ml-auto flex gap-2">
          <Link
            href={`/coach/seances/${session.id}/edit`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
          >
            Modifier
          </Link>
          <Link
            href={`/coach/seances/new?from=${session.id}`}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
          >
            Dupliquer
          </Link>
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
        {session.blocks.map((block, blockIndex) => {
          const header = formatBlockHeader(block);
          const hasResult =
            block.resultTimeSec !== null ||
            block.resultRounds !== null ||
            block.resultRpe !== null ||
            block.resultNotes !== null;
          return (
            <section
              key={block.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="font-semibold">
                  {blockIndex + 1}. {block.title ?? BLOCK_FORMAT_LABELS[block.format]}
                </h2>
                {header && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {header}
                  </span>
                )}
              </div>
              {block.notes && (
                <p className="mt-1 text-sm text-slate-500">{block.notes}</p>
              )}

              <div className="mt-3 space-y-3">
                {block.exercises.map((se) => (
                  <div key={se.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-medium">{se.exercise.name}</h3>
                      <span className="text-sm text-slate-500">
                        {formatPrescription(se) || "libre"}
                      </span>
                    </div>
                    {se.instructions && (
                      <p className="mt-0.5 text-sm text-slate-500">{se.instructions}</p>
                    )}

                    {se.performanceSets.length > 0 && (
                      <table className="mt-2 w-full text-sm">
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
                        <tbody className="tabular-nums">
                          {se.performanceSets.map((set) => (
                            <tr key={set.id} className="border-t border-slate-100">
                              <td className="py-1.5 pr-2 text-slate-400">{set.setNumber}</td>
                              <td className="py-1.5 pr-2">{set.reps ?? "—"}</td>
                              <td className="py-1.5 pr-2">
                                {set.weightKg !== null ? `${set.weightKg} kg` : "—"}
                              </td>
                              <td className="py-1.5 pr-2">
                                {set.durationSec !== null
                                  ? formatDuration(set.durationSec)
                                  : "—"}
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
                    )}
                  </div>
                ))}
              </div>

              {hasResult && (
                <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <span className="font-medium">Résultat : </span>
                  {block.format === "FOR_TIME" && block.resultTimeSec !== null && (
                    <span>{formatDuration(block.resultTimeSec)}</span>
                  )}
                  {block.format === "AMRAP" && block.resultRounds !== null && (
                    <span>
                      {block.resultRounds} tours
                      {block.resultExtraReps ? ` + ${block.resultExtraReps} reps` : ""}
                    </span>
                  )}
                  {block.format === "EMOM" && block.resultRounds !== null && (
                    <span>
                      {block.resultRounds} minutes réussies
                      {block.durationSec
                        ? ` / ${Math.round(block.durationSec / 60)}`
                        : ""}
                    </span>
                  )}
                  {block.resultRpe !== null && <span> · RPE {block.resultRpe}/10</span>}
                  {block.resultNotes && <span> · {block.resultNotes}</span>}
                </div>
              )}
            </section>
          );
        })}
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
