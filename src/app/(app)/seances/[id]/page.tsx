import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { completeSession } from "@/server/actions";
import { PerformanceEditor } from "@/components/PerformanceEditor";
import { BlockResultForm } from "@/components/BlockResultForm";
import {
  BLOCK_FORMAT_LABELS,
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABELS,
  SESSION_TYPE_BADGE,
  SESSION_TYPE_LABELS,
  formatBlockHeader,
  formatDate,
  formatPrescription,
} from "@/lib/domain";

const TIMED_FORMATS = ["AMRAP", "FOR_TIME", "EMOM"] as const;

export default async function AthleteSessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const authSession = await auth();
  if (!authSession?.user) redirect("/login");
  const { id } = await params;

  const session = await prisma.trainingSession.findUnique({
    where: { id },
    include: {
      coach: { select: { name: true, email: true } },
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
  if (!session || session.athleteId !== authSession.user.id) notFound();

  const isCompleted = session.status === "COMPLETED";

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
        {formatDate(session.date)} · coach : {session.coach.name ?? session.coach.email}
      </p>
      {session.coachNotes && (
        <p className="mt-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
          {session.coachNotes}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {session.blocks.map((block, blockIndex) => {
          const header = formatBlockHeader(block);
          const isTimed = (TIMED_FORMATS as readonly string[]).includes(block.format);
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

              <div className="mt-3 space-y-4">
                {block.exercises.map((se) => (
                  <div key={se.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-medium">{se.exercise.name}</h3>
                      <span className="text-sm font-medium text-indigo-700">
                        {formatPrescription(se) || "libre"}
                      </span>
                    </div>
                    {se.instructions && (
                      <p className="mt-0.5 text-sm text-slate-500">{se.instructions}</p>
                    )}
                    {!isTimed && (
                      <PerformanceEditor
                        sessionExerciseId={se.id}
                        existingSets={se.performanceSets}
                        defaultSetCount={se.targetSets ?? block.rounds ?? 1}
                        readOnly={isCompleted}
                      />
                    )}
                  </div>
                ))}
              </div>

              {isTimed && (
                <BlockResultForm
                  blockId={block.id}
                  format={block.format}
                  existing={block}
                  totalMinutes={
                    block.format === "EMOM" && block.durationSec
                      ? Math.round(block.durationSec / 60)
                      : null
                  }
                  readOnly={isCompleted}
                />
              )}
            </section>
          );
        })}
      </div>

      {isCompleted ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Séance terminée ✓</p>
          {session.sessionRpe && <p className="mt-1">RPE global : {session.sessionRpe}/10</p>}
          {session.athleteNotes && <p className="mt-1">{session.athleteNotes}</p>}
        </div>
      ) : (
        <form
          action={completeSession}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-4"
        >
          <h2 className="font-semibold">Terminer la séance</h2>
          <p className="text-sm text-slate-500">
            Enregistrez d&apos;abord vos réalisations bloc par bloc, puis clôturez
            la séance.
          </p>
          <input type="hidden" name="sessionId" value={session.id} />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">RPE global (1-10)</span>
              <select
                name="sessionRpe"
                className="rounded-lg border border-slate-300 px-3 py-2"
                defaultValue=""
              >
                <option value="">—</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium">Ressenti</span>
              <input
                name="athleteNotes"
                placeholder="Comment s'est passée la séance ?"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Terminer ✓
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
