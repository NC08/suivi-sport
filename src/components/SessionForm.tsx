"use client";

import { useState, useTransition } from "react";
import {
  createTrainingSession,
  type CreateSessionInput,
} from "@/server/actions";
import { SESSION_TYPE_LABELS } from "@/lib/domain";
import type { SessionType } from "@prisma/client";

type ExerciseOption = { id: string; name: string; category: string | null };
type AthleteOption = { id: string; name: string | null; email: string };

type ExerciseRow = {
  key: number;
  exerciseId: string;
  targetSets: string;
  targetReps: string;
  targetWeightKg: string;
  targetDurationSec: string;
  targetDistanceM: string;
  instructions: string;
};

const emptyRow = (key: number): ExerciseRow => ({
  key,
  exerciseId: "",
  targetSets: "",
  targetReps: "",
  targetWeightKg: "",
  targetDurationSec: "",
  targetDistanceM: "",
  instructions: "",
});

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toFloat(value: string): number | null {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function SessionForm({
  exercises,
  athletes,
  defaultDate,
}: {
  exercises: ExerciseOption[];
  athletes: AthleteOption[];
  defaultDate: string;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SessionType>("MUSCULATION");
  const [date, setDate] = useState(defaultDate);
  const [athleteId, setAthleteId] = useState(athletes[0]?.id ?? "");
  const [coachNotes, setCoachNotes] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>([emptyRow(0)]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = [...new Set(exercises.map((e) => e.category ?? "Autre"))];

  function updateRow(key: number, patch: Partial<ExerciseRow>) {
    setRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError(null);
    const payload: CreateSessionInput = {
      title,
      type,
      date,
      athleteId,
      coachNotes: coachNotes.trim() || null,
      exercises: rows
        .filter((r) => r.exerciseId)
        .map((r) => ({
          exerciseId: r.exerciseId,
          targetSets: toInt(r.targetSets),
          targetReps: toInt(r.targetReps),
          targetWeightKg: toFloat(r.targetWeightKg),
          targetDurationSec: toInt(r.targetDurationSec),
          targetDistanceM: toFloat(r.targetDistanceM),
          instructions: r.instructions.trim() || null,
        })),
    };
    if (payload.exercises.length === 0) {
      setError("Ajoutez au moins un exercice.");
      return;
    }
    startTransition(async () => {
      const result = await createTrainingSession(payload);
      if (result?.error) setError(result.error);
    });
  }

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Haut du corps — force"
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Type de séance</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SessionType)}
            className={inputClass}
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Athlète</span>
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className={inputClass}
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Consignes générales</span>
          <textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            rows={2}
            placeholder="Échauffement, intentions de la séance…"
            className={inputClass}
          />
        </label>
      </div>

      <div>
        <h2 className="font-semibold">Exercices</h2>
        <p className="text-sm text-slate-500">
          Ne remplissez que les cibles pertinentes (séries × reps et charge en
          musculation, temps ou distance en cardio…).
        </p>
        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  <select
                    value={row.exerciseId}
                    onChange={(e) => updateRow(row.key, { exerciseId: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">— Choisir un exercice —</option>
                    {categories.map((category) => (
                      <optgroup key={category} label={category}>
                        {exercises
                          .filter((e) => (e.category ?? "Autre") === category)
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                    className="text-sm text-slate-400 hover:text-red-600"
                  >
                    Retirer
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Séries</span>
                  <input
                    inputMode="numeric"
                    value={row.targetSets}
                    onChange={(e) => updateRow(row.key, { targetSets: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Reps</span>
                  <input
                    inputMode="numeric"
                    value={row.targetReps}
                    onChange={(e) => updateRow(row.key, { targetReps: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Charge (kg)</span>
                  <input
                    inputMode="decimal"
                    value={row.targetWeightKg}
                    onChange={(e) => updateRow(row.key, { targetWeightKg: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Temps (sec)</span>
                  <input
                    inputMode="numeric"
                    value={row.targetDurationSec}
                    onChange={(e) =>
                      updateRow(row.key, { targetDurationSec: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-slate-500">Distance (m)</span>
                  <input
                    inputMode="decimal"
                    value={row.targetDistanceM}
                    onChange={(e) =>
                      updateRow(row.key, { targetDistanceM: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="mt-3 block text-xs">
                <span className="mb-1 block text-slate-500">
                  Consignes (tempo, variation, allure…)
                </span>
                <input
                  value={row.instructions}
                  onChange={(e) => updateRow(row.key, { instructions: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((r) => [...r, emptyRow(Math.max(...r.map((x) => x.key)) + 1)])}
          className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
        >
          + Ajouter un exercice
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isPending ? "Création…" : "Créer et assigner la séance"}
      </button>
    </div>
  );
}
