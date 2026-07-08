"use client";

import { useState, useTransition } from "react";
import {
  createTrainingSession,
  updateTrainingSession,
  type CreateSessionInput,
} from "@/server/actions";
import { BLOCK_FORMAT_LABELS, SESSION_TYPE_LABELS } from "@/lib/domain";
import type { BlockFormat, SessionType } from "@prisma/client";

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

type BlockRow = {
  key: number;
  format: BlockFormat;
  title: string;
  rounds: string;
  durationMin: string; // AMRAP / EMOM : minutes
  workSec: string; // INTERVALS : effort en secondes
  restSec: string;
  notes: string;
  exercises: ExerciseRow[];
};

let nextKey = 1;
const emptyExercise = (): ExerciseRow => ({
  key: nextKey++,
  exerciseId: "",
  targetSets: "",
  targetReps: "",
  targetWeightKg: "",
  targetDurationSec: "",
  targetDistanceM: "",
  instructions: "",
});

const emptyBlock = (): BlockRow => ({
  key: nextKey++,
  format: "STANDARD",
  title: "",
  rounds: "",
  durationMin: "",
  workSec: "",
  restSec: "",
  notes: "",
  exercises: [emptyExercise()],
});

// Reconstruit l'état du formulaire depuis une séance existante
// (duplication ou édition).
function blocksFromInput(blocks: CreateSessionInput["blocks"]): BlockRow[] {
  return blocks.map((b) => ({
    key: nextKey++,
    format: b.format,
    title: b.title ?? "",
    rounds: b.rounds?.toString() ?? "",
    durationMin:
      b.format !== "INTERVALS" && b.durationSec
        ? Math.round(b.durationSec / 60).toString()
        : "",
    workSec: b.format === "INTERVALS" && b.durationSec ? b.durationSec.toString() : "",
    restSec: b.restSec?.toString() ?? "",
    notes: b.notes ?? "",
    exercises: b.exercises.map((e) => ({
      key: nextKey++,
      exerciseId: e.exerciseId,
      targetSets: e.targetSets?.toString() ?? "",
      targetReps: e.targetReps?.toString() ?? "",
      targetWeightKg: e.targetWeightKg?.toString() ?? "",
      targetDurationSec: e.targetDurationSec?.toString() ?? "",
      targetDistanceM: e.targetDistanceM?.toString() ?? "",
      instructions: e.instructions ?? "",
    })),
  }));
}

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toFloat(value: string): number | null {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Quels paramètres de bloc afficher selon le format.
const BLOCK_PARAMS: Record<
  BlockFormat,
  { rounds?: string; durationMin?: string; workSec?: string; restSec?: string }
> = {
  STANDARD: {},
  SUPERSET: { rounds: "Tours", restSec: "Récup (s)" },
  INTERVALS: { rounds: "Répétitions", workSec: "Effort (s)", restSec: "Récup (s)" },
  AMRAP: { durationMin: "Durée (min)" },
  FOR_TIME: { rounds: "Tours (optionnel)" },
  EMOM: { durationMin: "Durée (min)" },
};

// Indication sur le sens de "Reps" selon le format.
const REPS_HINT: Record<BlockFormat, string> = {
  STANDARD: "Reps",
  SUPERSET: "Reps / tour",
  INTERVALS: "Reps",
  AMRAP: "Reps / tour",
  FOR_TIME: "Reps (total)",
  EMOM: "Reps / min",
};

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export function SessionForm({
  exercises,
  athletes,
  defaultDate,
  initial,
  sessionId,
}: {
  exercises: ExerciseOption[];
  athletes: AthleteOption[];
  defaultDate: string;
  initial?: CreateSessionInput; // pré-remplissage (duplication / édition)
  sessionId?: string; // présent = mode édition
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<SessionType>(initial?.type ?? "MUSCULATION");
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [athleteId, setAthleteId] = useState(
    initial?.athleteId ?? athletes[0]?.id ?? "",
  );
  const [coachNotes, setCoachNotes] = useState(initial?.coachNotes ?? "");
  const [blocks, setBlocks] = useState<BlockRow[]>(() =>
    initial ? blocksFromInput(initial.blocks) : [emptyBlock()],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = [...new Set(exercises.map((e) => e.category ?? "Autre"))];

  function updateBlock(key: number, patch: Partial<BlockRow>) {
    setBlocks((bs) => bs.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function updateExercise(blockKey: number, exKey: number, patch: Partial<ExerciseRow>) {
    setBlocks((bs) =>
      bs.map((b) =>
        b.key === blockKey
          ? {
              ...b,
              exercises: b.exercises.map((e) =>
                e.key === exKey ? { ...e, ...patch } : e,
              ),
            }
          : b,
      ),
    );
  }

  function submit() {
    setError(null);
    const payload: CreateSessionInput = {
      title,
      type,
      date,
      athleteId,
      coachNotes: coachNotes.trim() || null,
      blocks: blocks.map((b) => ({
        format: b.format,
        title: b.title.trim() || null,
        rounds: toInt(b.rounds),
        durationSec:
          b.format === "INTERVALS"
            ? toInt(b.workSec)
            : toInt(b.durationMin) !== null
              ? toInt(b.durationMin)! * 60
              : null,
        restSec: toInt(b.restSec),
        notes: b.notes.trim() || null,
        exercises: b.exercises
          .filter((e) => e.exerciseId)
          .map((e) => ({
            exerciseId: e.exerciseId,
            targetSets: toInt(e.targetSets),
            targetReps: toInt(e.targetReps),
            targetWeightKg: toFloat(e.targetWeightKg),
            targetDurationSec: toInt(e.targetDurationSec),
            targetDistanceM: toFloat(e.targetDistanceM),
            instructions: e.instructions.trim() || null,
          })),
      })),
    };
    if (payload.blocks.some((b) => b.exercises.length === 0)) {
      setError("Chaque bloc doit contenir au moins un exercice.");
      return;
    }
    startTransition(async () => {
      const result = sessionId
        ? await updateTrainingSession(sessionId, payload)
        : await createTrainingSession(payload);
      if (result?.error) setError(result.error);
    });
  }

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
        <h2 className="font-semibold">Blocs</h2>
        <p className="text-sm text-slate-500">
          Une séance se compose de blocs : classique (séries), superset,
          intervalles, AMRAP, For Time ou EMOM.
        </p>

        <div className="mt-3 space-y-4">
          {blocks.map((block, blockIndex) => {
            const params = BLOCK_PARAMS[block.format];
            return (
              <div
                key={block.key}
                className="rounded-xl border border-slate-300 bg-white"
              >
                <div className="flex flex-wrap items-end gap-3 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                    {blockIndex + 1}
                  </span>
                  <label className="text-xs">
                    <span className="mb-1 block text-slate-500">Format</span>
                    <select
                      value={block.format}
                      onChange={(e) =>
                        updateBlock(block.key, { format: e.target.value as BlockFormat })
                      }
                      className={inputClass}
                    >
                      {Object.entries(BLOCK_FORMAT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1 text-xs">
                    <span className="mb-1 block text-slate-500">
                      Intitulé (optionnel)
                    </span>
                    <input
                      value={block.title}
                      onChange={(e) => updateBlock(block.key, { title: e.target.value })}
                      placeholder='Ex : "WOD", "Finisher"'
                      className={inputClass}
                    />
                  </label>
                  {params.rounds && (
                    <label className="w-24 text-xs">
                      <span className="mb-1 block text-slate-500">{params.rounds}</span>
                      <input
                        inputMode="numeric"
                        value={block.rounds}
                        onChange={(e) => updateBlock(block.key, { rounds: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  )}
                  {params.durationMin && (
                    <label className="w-24 text-xs">
                      <span className="mb-1 block text-slate-500">{params.durationMin}</span>
                      <input
                        inputMode="numeric"
                        value={block.durationMin}
                        onChange={(e) =>
                          updateBlock(block.key, { durationMin: e.target.value })
                        }
                        className={inputClass}
                      />
                    </label>
                  )}
                  {params.workSec && (
                    <label className="w-24 text-xs">
                      <span className="mb-1 block text-slate-500">{params.workSec}</span>
                      <input
                        inputMode="numeric"
                        value={block.workSec}
                        onChange={(e) => updateBlock(block.key, { workSec: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  )}
                  {params.restSec && (
                    <label className="w-24 text-xs">
                      <span className="mb-1 block text-slate-500">{params.restSec}</span>
                      <input
                        inputMode="numeric"
                        value={block.restSec}
                        onChange={(e) => updateBlock(block.key, { restSec: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  )}
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBlocks((bs) => bs.filter((b) => b.key !== block.key))}
                      className="ml-auto text-sm text-slate-400 hover:text-red-600"
                    >
                      Retirer le bloc
                    </button>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  {block.exercises.map((row) => (
                    <div key={row.key} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-3">
                        <select
                          value={row.exerciseId}
                          onChange={(e) =>
                            updateExercise(block.key, row.key, { exerciseId: e.target.value })
                          }
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
                        {block.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBlock(block.key, {
                                exercises: block.exercises.filter((e) => e.key !== row.key),
                              })
                            }
                            className="shrink-0 text-sm text-slate-400 hover:text-red-600"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {block.format === "STANDARD" && (
                          <label className="text-xs">
                            <span className="mb-1 block text-slate-500">Séries</span>
                            <input
                              inputMode="numeric"
                              value={row.targetSets}
                              onChange={(e) =>
                                updateExercise(block.key, row.key, { targetSets: e.target.value })
                              }
                              className={inputClass}
                            />
                          </label>
                        )}
                        <label className="text-xs">
                          <span className="mb-1 block text-slate-500">
                            {REPS_HINT[block.format]}
                          </span>
                          <input
                            inputMode="numeric"
                            value={row.targetReps}
                            onChange={(e) =>
                              updateExercise(block.key, row.key, { targetReps: e.target.value })
                            }
                            className={inputClass}
                          />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block text-slate-500">Charge (kg)</span>
                          <input
                            inputMode="decimal"
                            value={row.targetWeightKg}
                            onChange={(e) =>
                              updateExercise(block.key, row.key, {
                                targetWeightKg: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </label>
                        <label className="text-xs">
                          <span className="mb-1 block text-slate-500">Temps (sec)</span>
                          <input
                            inputMode="numeric"
                            value={row.targetDurationSec}
                            onChange={(e) =>
                              updateExercise(block.key, row.key, {
                                targetDurationSec: e.target.value,
                              })
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
                              updateExercise(block.key, row.key, {
                                targetDistanceM: e.target.value,
                              })
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
                          onChange={(e) =>
                            updateExercise(block.key, row.key, { instructions: e.target.value })
                          }
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(block.key, {
                        exercises: [...block.exercises, emptyExercise()],
                      })
                    }
                    className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                  >
                    + Exercice
                  </button>

                  <label className="block text-xs">
                    <span className="mb-1 block text-slate-500">Notes du bloc</span>
                    <input
                      value={block.notes}
                      onChange={(e) => updateBlock(block.key, { notes: e.target.value })}
                      placeholder="Ex : pénalité, échauffement spécifique…"
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setBlocks((bs) => [...bs, emptyBlock()])}
          className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
        >
          + Ajouter un bloc
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
        {isPending
          ? "Enregistrement…"
          : sessionId
            ? "Enregistrer les modifications"
            : "Créer et assigner la séance"}
      </button>
    </div>
  );
}
