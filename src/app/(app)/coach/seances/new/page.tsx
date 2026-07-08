import { prisma } from "@/lib/prisma";
import { SessionForm } from "@/components/SessionForm";

export default async function NewSessionPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Nouvelle séance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Composez la séance à partir de la bibliothèque d&apos;exercices, puis
        assignez-la à un athlète.
      </p>
      <div className="mt-6">
        <SessionForm exercises={exercises} athletes={athletes} defaultDate={today} />
      </div>
    </div>
  );
}
