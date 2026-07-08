"use client";

import { useState, useTransition } from "react";
import { savePerformance, type PerformanceSetInput } from "@/server/actions";

type SetRow = {
  key: number;
  reps: string;
  weightKg: string;
  durationSec: string;
  distanceM: string;
  rpe: string;
  notes: string;
};

export type ExistingSet = {
  reps: number | null;
  weightKg: number | null;
  durationSec: number | null;
  distanceM: number | null;
  rpe: number | null;
  notes: string | null;
};

function toRow(key: number, set?: ExistingSet): SetRow {
  return {
    key,
    reps: set?.reps?.toString() ?? "",
    weightKg: set?.weightKg?.toString() ?? "",
    durationSec: set?.durationSec?.toString() ?? "",
    distanceM: set?.distanceM?.toString() ?? "",
    rpe: set?.rpe?.toString() ?? "",
    notes: set?.notes ?? "",
  };
}

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function toFloat(value: string): number | null {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function PerformanceEditor({
  sessionExerciseId,
  existingSets,
  defaultSetCount,
  readOnly,
}: {
  sessionExerciseId: string;
  existingSets: ExistingSet[];
  defaultSetCount: number;
  readOnly: boolean;
}) {
  const initialRows =
    existingSets.length > 0
      ? existingSets.map((s, i) => toRow(i, s))
      : Array.from({ length: Math.max(1, defaultSetCount) }, (_, i) => toRow(i));

  const [rows, setRows] = useState<SetRow[]>(initialRows);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateRow(key: number, patch: Partial<SetRow>) {
    setMessage(null);
    setRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function save() {
    const sets: PerformanceSetInput[] = rows.map((r) => ({
      reps: toInt(r.reps),
      weightKg: toFloat(r.weightKg),
      durationSec: toInt(r.durationSec),
      distanceM: toFloat(r.distanceM),
      rpe: toInt(r.rpe),
      notes: r.notes.trim() || null,
    }));
    startTransition(async () => {
      const result = await savePerformance(sessionExerciseId, sets);
      setMessage(result.error ?? "Enregistré ✓");
    });
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-400";

  return (
    <div className="mt-3">
      <div className="grid grid-cols-[2rem_repeat(5,1fr)_1.5fr] items-center gap-2 text-xs text-slate-400">
        <span>#</span>
        <span>Reps</span>
        <span>Kg</span>
        <span>Temps (s)</span>
        <span>Dist. (m)</span>
        <span>RPE</span>
        <span>Notes</span>
      </div>
      <div className="mt-1 space-y-1.5">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid grid-cols-[2rem_repeat(5,1fr)_1.5fr] items-center gap-2"
          >
            <span className="text-sm text-slate-400">{index + 1}</span>
            <input
              inputMode="numeric"
              disabled={readOnly}
              value={row.reps}
              onChange={(e) => updateRow(row.key, { reps: e.target.value })}
              className={inputClass}
            />
            <input
              inputMode="decimal"
              disabled={readOnly}
              value={row.weightKg}
              onChange={(e) => updateRow(row.key, { weightKg: e.target.value })}
              className={inputClass}
            />
            <input
              inputMode="numeric"
              disabled={readOnly}
              value={row.durationSec}
              onChange={(e) => updateRow(row.key, { durationSec: e.target.value })}
              className={inputClass}
            />
            <input
              inputMode="decimal"
              disabled={readOnly}
              value={row.distanceM}
              onChange={(e) => updateRow(row.key, { distanceM: e.target.value })}
              className={inputClass}
            />
            <input
              inputMode="numeric"
              disabled={readOnly}
              value={row.rpe}
              onChange={(e) => updateRow(row.key, { rpe: e.target.value })}
              className={inputClass}
              placeholder="1-10"
            />
            <div className="flex items-center gap-1">
              <input
                disabled={readOnly}
                value={row.notes}
                onChange={(e) => updateRow(row.key, { notes: e.target.value })}
                className={inputClass}
              />
              {!readOnly && rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                  className="px-1 text-slate-300 hover:text-red-600"
                  aria-label="Supprimer la série"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setRows((r) => [...r, toRow(Math.max(...r.map((x) => x.key)) + 1)])
            }
            className="text-sm text-slate-500 hover:text-indigo-600"
          >
            + Série
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && (
            <span
              className={`text-sm ${message.includes("✓") ? "text-emerald-600" : "text-red-600"}`}
            >
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
