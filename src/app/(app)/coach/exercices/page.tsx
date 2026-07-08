import { prisma } from "@/lib/prisma";
import { createExercise } from "@/server/actions";

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const byCategory = new Map<string, typeof exercises>();
  for (const exercise of exercises) {
    const key = exercise.category ?? "Autre";
    byCategory.set(key, [...(byCategory.get(key) ?? []), exercise]);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">
        Bibliothèque d&apos;exercices
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Les exercices sont réutilisables dans toutes les séances : la progression
        est suivie par exercice, quel que soit le nombre de séances où il apparaît.
      </p>

      <form
        action={createExercise}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">Nom</span>
          <input
            name="name"
            required
            minLength={2}
            placeholder="Ex : Développé incliné"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Catégorie</span>
          <select
            name="category"
            required
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option>Musculation</option>
            <option>Cardio</option>
            <option>Hyrox</option>
            <option>CrossFit</option>
            <option>Autre</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ajouter
        </button>
      </form>

      <div className="mt-8 space-y-6">
        {[...byCategory.entries()].map(([category, list]) => (
          <section key={category}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {category} · {list.length}
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {list.map((exercise) => (
                <li
                  key={exercise.id}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
                >
                  {exercise.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
