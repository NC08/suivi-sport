"use client";

import { useState, useTransition } from "react";
import { saveBlockResult } from "@/server/actions";
import type { BlockFormat } from "@prisma/client";

type Existing = {
  resultTimeSec: number | null;
  resultRounds: number | null;
  resultExtraReps: number | null;
  resultRpe: number | null;
  resultNotes: string | null;
};

function toInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-400";

// Saisie du résultat global d'un bloc chronométré, adaptée au format :
// For Time → temps ; AMRAP → tours + reps ; EMOM → minutes réussies.
export function BlockResultForm({
  blockId,
  format,
  existing,
  totalMinutes,
  readOnly,
}: {
  blockId: string;
  format: BlockFormat;
  existing: Existing;
  totalMinutes: number | null; // EMOM : durée totale en minutes
  readOnly: boolean;
}) {
  const [minutes, setMinutes] = useState(
    existing.resultTimeSec !== null
      ? Math.floor(existing.resultTimeSec / 60).toString()
      : "",
  );
  const [seconds, setSeconds] = useState(
    existing.resultTimeSec !== null
      ? (existing.resultTimeSec % 60).toString()
      : "",
  );
  const [rounds, setRounds] = useState(existing.resultRounds?.toString() ?? "");
  const [extraReps, setExtraReps] = useState(
    existing.resultExtraReps?.toString() ?? "",
  );
  const [rpe, setRpe] = useState(existing.resultRpe?.toString() ?? "");
  const [notes, setNotes] = useState(existing.resultNotes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    const min = toInt(minutes);
    const sec = toInt(seconds);
    const timeSec =
      min !== null || sec !== null ? (min ?? 0) * 60 + (sec ?? 0) : null;
    startTransition(async () => {
      const result = await saveBlockResult(blockId, {
        resultTimeSec: format === "FOR_TIME" ? timeSec : null,
        resultRounds: toInt(rounds),
        resultExtraReps: format === "AMRAP" ? toInt(extraReps) : null,
        resultRpe: toInt(rpe),
        resultNotes: notes.trim() || null,
      });
      setMessage(result.error ?? "Enregistré ✓");
    });
  }

  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3">
      <div className="flex flex-wrap items-end gap-3">
        {format === "FOR_TIME" && (
          <div className="text-xs">
            <span className="mb-1 block text-slate-500">Temps réalisé</span>
            <div className="flex items-center gap-1">
              <input
                inputMode="numeric"
                disabled={readOnly}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={`${inputClass} w-16`}
                placeholder="min"
              />
              <span className="text-slate-400">:</span>
              <input
                inputMode="numeric"
                disabled={readOnly}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className={`${inputClass} w-16`}
                placeholder="sec"
              />
            </div>
          </div>
        )}
        {format === "AMRAP" && (
          <>
            <label className="w-24 text-xs">
              <span className="mb-1 block text-slate-500">Tours complets</span>
              <input
                inputMode="numeric"
                disabled={readOnly}
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="w-24 text-xs">
              <span className="mb-1 block text-slate-500">+ reps</span>
              <input
                inputMode="numeric"
                disabled={readOnly}
                value={extraReps}
                onChange={(e) => setExtraReps(e.target.value)}
                className={inputClass}
              />
            </label>
          </>
        )}
        {format === "EMOM" && (
          <label className="w-32 text-xs">
            <span className="mb-1 block text-slate-500">
              Minutes réussies{totalMinutes ? ` / ${totalMinutes}` : ""}
            </span>
            <input
              inputMode="numeric"
              disabled={readOnly}
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="w-20 text-xs">
          <span className="mb-1 block text-slate-500">RPE (1-10)</span>
          <input
            inputMode="numeric"
            disabled={readOnly}
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="min-w-40 flex-1 text-xs">
          <span className="mb-1 block text-slate-500">Notes</span>
          <input
            disabled={readOnly}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Charges utilisées, stratégie, ressenti…"
            className={inputClass}
          />
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending ? "…" : "Enregistrer"}
          </button>
        )}
        {message && (
          <span
            className={`text-sm ${message.includes("✓") ? "text-emerald-600" : "text-red-600"}`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
