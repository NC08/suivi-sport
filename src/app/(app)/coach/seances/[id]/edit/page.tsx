import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionForm } from "@/components/SessionForm";
import { hasAthleteData, sessionToFormInput } from "@/lib/session-form";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, exercises, athletes] = await Promise.all([
    prisma.trainingSession.findUnique({
      where: { id },
      include: {
        blocks: {
          include: { exercises: { include: { performanceSets: true } } },
        },
      },
    }),
    prisma.exercise.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
    prisma.user.findMany({
      where: { role: "ATHLETE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!session) notFound();

  const hasData = hasAthleteData(session);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Modifier la séance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Les blocs sont remplacés par le contenu du formulaire.
      </p>
      {hasData && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠ L&apos;athlète a déjà saisi des réalisations sur cette séance :
          enregistrer les modifications les supprimera.
        </p>
      )}
      <div className="mt-6">
        <SessionForm
          exercises={exercises}
          athletes={athletes}
          defaultDate={session.date.toISOString().slice(0, 10)}
          initial={sessionToFormInput(session)}
          sessionId={session.id}
        />
      </div>
    </div>
  );
}
