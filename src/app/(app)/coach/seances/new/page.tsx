import { prisma } from "@/lib/prisma";
import { SessionForm } from "@/components/SessionForm";
import { sessionToFormInput } from "@/lib/session-form";
import type { CreateSessionInput } from "@/server/actions";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const [exercises, athletes] = await Promise.all([
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

  const today = new Date().toISOString().slice(0, 10);

  // Duplication : pré-remplit le formulaire depuis une séance existante.
  let initial: CreateSessionInput | undefined;
  let duplicatedFrom: string | undefined;
  if (from) {
    const source = await prisma.trainingSession.findUnique({
      where: { id: from },
      include: { blocks: { include: { exercises: true } } },
    });
    if (source) {
      initial = sessionToFormInput(source, { date: today });
      duplicatedFrom = source.title;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Nouvelle séance</h1>
      <p className="mt-1 text-sm text-slate-500">
        {duplicatedFrom
          ? `Copie de « ${duplicatedFrom} » — ajustez la date et les cibles avant de créer.`
          : "Composez la séance par blocs à partir de la bibliothèque d'exercices, puis assignez-la à un athlète."}
      </p>
      <div className="mt-6">
        <SessionForm
          exercises={exercises}
          athletes={athletes}
          defaultDate={today}
          initial={initial}
        />
      </div>
    </div>
  );
}
