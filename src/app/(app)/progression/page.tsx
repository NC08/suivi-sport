import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getExerciseProgress,
  getTimedBlockGroups,
  getTimedBlockProgress,
  getTrackedExercises,
  getWeeklyOverview,
} from "@/lib/progress";
import { ParamSelect } from "@/components/ParamSelect";
import {
  ExerciseStrengthChart,
  ExerciseTimeChart,
  ExerciseVolumeChart,
  TimedBlockChart,
  WeeklyRpeChart,
  WeeklySessionsChart,
  WeeklyVolumeChart,
} from "@/components/ProgressCharts";
import { SESSION_TYPE_LABELS } from "@/lib/domain";
import type { SessionType } from "@prisma/client";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string; exercice?: string; bloc?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;

  // Le coach choisit l'athlète ; l'athlète voit sa propre progression.
  let athleteId = session.user.id;
  let athletes: { id: string; name: string | null; email: string }[] = [];
  if (session.user.role === "COACH") {
    athletes = await prisma.user.findMany({
      where: { role: "ATHLETE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    if (athletes.length === 0) {
      return (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progression</h1>
          <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aucun athlète pour l&apos;instant.
          </p>
        </div>
      );
    }
    athleteId =
      athletes.find((a) => a.id === params.athlete)?.id ?? athletes[0].id;
  }

  const [weekly, trackedExercises, timedBlockGroups] = await Promise.all([
    getWeeklyOverview(athleteId),
    getTrackedExercises(athleteId),
    getTimedBlockGroups(athleteId),
  ]);

  const selectedBlockGroup =
    timedBlockGroups.find((g) => g.key === params.bloc) ?? timedBlockGroups[0];
  const timedBlockPoints = selectedBlockGroup
    ? await getTimedBlockProgress(athleteId, selectedBlockGroup.key)
    : [];

  const exerciseId =
    trackedExercises.find((e) => e.id === params.exercice)?.id ??
    trackedExercises[0]?.id;
  const exercisePoints = exerciseId
    ? await getExerciseProgress(athleteId, exerciseId)
    : [];

  const hasStrength = exercisePoints.some((p) => p.maxWeightKg !== null);
  const hasVolume = exercisePoints.some((p) => p.volumeKg !== null);
  const hasTime = exercisePoints.some((p) => p.totalDurationSec !== null);

  const types = Object.keys(SESSION_TYPE_LABELS) as SessionType[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progression</h1>
          <p className="mt-1 text-sm text-slate-500">
            12 dernières semaines (lundi → dimanche).
          </p>
        </div>
        {session.user.role === "COACH" && (
          <ParamSelect
            param="athlete"
            label="Athlète"
            value={athleteId}
            options={athletes.map((a) => ({
              value: a.id,
              label: a.name ?? a.email,
            }))}
          />
        )}
      </div>

      <div className="mt-6 space-y-4">
        <WeeklySessionsChart data={weekly} />
        <div className="grid gap-4 sm:grid-cols-2">
          <WeeklyRpeChart data={weekly} />
          <WeeklyVolumeChart data={weekly} />
        </div>

        {/* Vue tableau : les mêmes chiffres que les graphiques, lisibles sans couleur. */}
        <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">
            Données hebdomadaires (tableau)
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-1 pr-2 font-medium">Semaine du</th>
                  {types.map((t) => (
                    <th key={t} className="py-1 pr-2 font-medium">
                      {SESSION_TYPE_LABELS[t]}
                    </th>
                  ))}
                  <th className="py-1 pr-2 font-medium">Assignées</th>
                  <th className="py-1 pr-2 font-medium">RPE moy.</th>
                  <th className="py-1 font-medium">Tonnage</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {weekly.map((w) => (
                  <tr key={w.weekStart} className="border-t border-slate-100">
                    <td className="py-1.5 pr-2">{w.label}</td>
                    {types.map((t) => (
                      <td key={t} className="py-1.5 pr-2">
                        {w.completedByType[t] || "—"}
                      </td>
                    ))}
                    <td className="py-1.5 pr-2">{w.assigned || "—"}</td>
                    <td className="py-1.5 pr-2">{w.avgRpe ?? "—"}</td>
                    <td className="py-1.5">
                      {w.volumeKg
                        ? `${Math.round(w.volumeKg).toLocaleString("fr-FR")} kg`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Par exercice</h2>
            <p className="mt-1 text-sm text-slate-500">
              Toutes les séances où l&apos;exercice apparaît, quelle que soit la
              séance.
            </p>
          </div>
          {trackedExercises.length > 0 && exerciseId && (
            <ParamSelect
              param="exercice"
              label="Exercice"
              value={exerciseId}
              options={trackedExercises.map((e) => ({
                value: e.id,
                label: e.name,
                group: e.category,
              }))}
            />
          )}
        </div>

        {exercisePoints.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Aucune réalisation saisie pour l&apos;instant — les graphiques
            apparaîtront après les premières séances.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {hasStrength && <ExerciseStrengthChart data={exercisePoints} />}
            <div className="grid gap-4 sm:grid-cols-2">
              {hasVolume && <ExerciseVolumeChart data={exercisePoints} />}
              {hasTime && <ExerciseTimeChart data={exercisePoints} />}
            </div>
          </div>
        )}
      </div>

      {timedBlockGroups.length > 0 && selectedBlockGroup && (
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Blocs chronométrés
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                WODs comparés à format et composition identiques (mêmes
                exercices, mêmes cibles).
              </p>
            </div>
            <ParamSelect
              param="bloc"
              label="Bloc"
              value={selectedBlockGroup.key}
              options={timedBlockGroups.map((g) => ({
                value: g.key,
                label: `${g.label} (${g.count})`,
              }))}
            />
          </div>
          <div className="mt-6">
            <TimedBlockChart
              format={selectedBlockGroup.format}
              data={timedBlockPoints}
            />
          </div>
        </div>
      )}
    </div>
  );
}
