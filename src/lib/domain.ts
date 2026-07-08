import type { SessionType, SessionStatus } from "@prisma/client";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  CARDIO: "Cardio",
  CROSSFIT: "CrossFit",
  HYROX: "Hyrox",
  MUSCULATION: "Musculation",
};

export const SESSION_TYPE_BADGE: Record<SessionType, string> = {
  CARDIO: "bg-sky-100 text-sky-800",
  CROSSFIT: "bg-orange-100 text-orange-800",
  HYROX: "bg-yellow-100 text-yellow-800",
  MUSCULATION: "bg-violet-100 text-violet-800",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  ASSIGNED: "À faire",
  COMPLETED: "Terminée",
};

export const SESSION_STATUS_BADGE: Record<SessionStatus, string> = {
  ASSIGNED: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDuration(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  if (min === 0) return `${sec}s`;
  return sec === 0 ? `${min} min` : `${min} min ${sec.toString().padStart(2, "0")}s`;
}

// Résume la prescription d'un exercice en une ligne lisible.
export function formatPrescription(target: {
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  targetDurationSec: number | null;
  targetDistanceM: number | null;
}): string {
  const parts: string[] = [];
  if (target.targetSets && target.targetReps) {
    parts.push(`${target.targetSets} × ${target.targetReps} reps`);
  } else if (target.targetSets) {
    parts.push(`${target.targetSets} séries`);
  } else if (target.targetReps) {
    parts.push(`${target.targetReps} reps`);
  }
  if (target.targetWeightKg) parts.push(`${target.targetWeightKg} kg`);
  if (target.targetDurationSec) parts.push(formatDuration(target.targetDurationSec));
  if (target.targetDistanceM) {
    parts.push(
      target.targetDistanceM >= 1000
        ? `${target.targetDistanceM / 1000} km`
        : `${target.targetDistanceM} m`,
    );
  }
  return parts.join(" · ");
}
