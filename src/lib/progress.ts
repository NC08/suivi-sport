import { prisma } from "@/lib/prisma";
import type { SessionType } from "@prisma/client";

// ── Agrégats hebdomadaires (régularité, RPE, volume) ────────────

export type WeeklyPoint = {
  weekStart: string; // ISO (lundi)
  label: string; // "08/07"
  completedByType: Record<SessionType, number>;
  notCompleted: number; // assignées non terminées
  assigned: number;
  avgRpe: number | null;
  volumeKg: number; // tonnage : Σ (reps × charge)
};

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function shortLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export async function getWeeklyOverview(
  athleteId: string,
  weekCount = 12,
): Promise<WeeklyPoint[]> {
  const firstMonday = mondayOf(new Date());
  firstMonday.setUTCDate(firstMonday.getUTCDate() - 7 * (weekCount - 1));

  const sessions = await prisma.trainingSession.findMany({
    where: { athleteId, date: { gte: firstMonday } },
    include: {
      blocks: {
        select: {
          exercises: {
            select: { performanceSets: { select: { reps: true, weightKg: true } } },
          },
        },
      },
    },
  });

  const weeks: WeeklyPoint[] = Array.from({ length: weekCount }, (_, i) => {
    const weekStart = new Date(firstMonday);
    weekStart.setUTCDate(weekStart.getUTCDate() + 7 * i);
    return {
      weekStart: weekStart.toISOString().slice(0, 10),
      label: shortLabel(weekStart),
      completedByType: { CARDIO: 0, CROSSFIT: 0, HYROX: 0, MUSCULATION: 0 },
      notCompleted: 0,
      assigned: 0,
      avgRpe: null,
      volumeKg: 0,
    };
  });

  const rpes = new Map<number, number[]>();
  for (const session of sessions) {
    const index = Math.floor(
      (mondayOf(session.date).getTime() - firstMonday.getTime()) / (7 * 86400_000),
    );
    const week = weeks[index];
    if (!week) continue;
    week.assigned += 1;
    if (session.status === "COMPLETED") {
      week.completedByType[session.type] += 1;
      if (session.sessionRpe) {
        rpes.set(index, [...(rpes.get(index) ?? []), session.sessionRpe]);
      }
    } else {
      week.notCompleted += 1;
    }
    for (const exercise of session.blocks.flatMap((b) => b.exercises)) {
      for (const set of exercise.performanceSets) {
        if (set.reps && set.weightKg) week.volumeKg += set.reps * set.weightKg;
      }
    }
  }
  for (const [index, values] of rpes) {
    weeks[index].avgRpe =
      Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
  return weeks;
}

// ── Progression par exercice ────────────────────────────────────

export type ExercisePoint = {
  date: string; // ISO
  label: string; // "08/07"
  sessionTitle: string;
  maxWeightKg: number | null;
  e1rmKg: number | null; // 1RM estimé (Epley)
  volumeKg: number | null;
  totalDurationSec: number | null;
  totalDistanceM: number | null;
};

export async function getExerciseProgress(
  athleteId: string,
  exerciseId: string,
): Promise<ExercisePoint[]> {
  const occurrences = await prisma.sessionExercise.findMany({
    where: { exerciseId, block: { session: { athleteId } } },
    include: {
      block: { select: { session: { select: { date: true, title: true } } } },
      performanceSets: true,
    },
    orderBy: { block: { session: { date: "asc" } } },
  });

  const points: ExercisePoint[] = [];
  for (const occurrence of occurrences) {
    const sets = occurrence.performanceSets;
    if (sets.length === 0) continue;

    let maxWeight: number | null = null;
    let e1rm: number | null = null;
    let volume: number | null = null;
    let duration: number | null = null;
    let distance: number | null = null;

    for (const set of sets) {
      if (set.weightKg !== null) {
        maxWeight = Math.max(maxWeight ?? 0, set.weightKg);
        if (set.reps) {
          // Formule d'Epley : charge × (1 + reps / 30)
          const estimate = set.weightKg * (1 + set.reps / 30);
          e1rm = Math.max(e1rm ?? 0, Math.round(estimate * 10) / 10);
          volume = (volume ?? 0) + set.reps * set.weightKg;
        }
      }
      if (set.durationSec !== null) duration = (duration ?? 0) + set.durationSec;
      if (set.distanceM !== null) distance = (distance ?? 0) + set.distanceM;
    }

    points.push({
      date: occurrence.block.session.date.toISOString().slice(0, 10),
      label: shortLabel(occurrence.block.session.date),
      sessionTitle: occurrence.block.session.title,
      maxWeightKg: maxWeight,
      e1rmKg: e1rm,
      volumeKg: volume,
      totalDurationSec: duration,
      totalDistanceM: distance,
    });
  }
  return points;
}

// ── Progression des blocs chronométrés (AMRAP, For Time, EMOM) ──
//
// Deux blocs sont "comparables" s'ils ont le même format et la même
// composition (mêmes exercices, mêmes reps/distances cibles) : on ne
// compare un temps For Time qu'à format identique.

export type TimedBlockGroup = {
  key: string;
  format: "AMRAP" | "FOR_TIME" | "EMOM";
  label: string; // ex : "For Time — Sled push, Wall balls, Burpees"
  count: number; // nombre de résultats enregistrés
};

export type TimedBlockPoint = {
  date: string;
  label: string;
  sessionTitle: string;
  timeSec: number | null; // For Time
  rounds: number | null; // AMRAP : tours complets ; EMOM : minutes réussies
  extraReps: number | null;
  totalReps: number | null; // AMRAP : score en répétitions totales
  totalMinutes: number | null; // EMOM : durée prescrite
  rpe: number | null;
};

type TimedBlock = Awaited<ReturnType<typeof fetchTimedBlocks>>[number];

function fetchTimedBlocks(athleteId: string) {
  return prisma.sessionBlock.findMany({
    where: {
      format: { in: ["AMRAP", "FOR_TIME", "EMOM"] },
      session: { athleteId },
      OR: [{ resultTimeSec: { not: null } }, { resultRounds: { not: null } }],
    },
    include: {
      session: { select: { date: true, title: true } },
      exercises: {
        orderBy: { position: "asc" },
        select: {
          exerciseId: true,
          targetReps: true,
          targetDistanceM: true,
          exercise: { select: { name: true } },
        },
      },
    },
    orderBy: { session: { date: "asc" } },
  });
}

function blockKey(block: TimedBlock): string {
  const composition = block.exercises
    .map((e) => `${e.exerciseId}:${e.targetReps ?? ""}:${e.targetDistanceM ?? ""}`)
    .join(",");
  return `${block.format}|${composition}`;
}

function blockLabel(block: TimedBlock): string {
  const names = block.exercises.map((e) => e.exercise.name).join(", ");
  const header =
    block.format === "FOR_TIME"
      ? "For Time"
      : block.format === "AMRAP"
        ? `AMRAP ${block.durationSec ? Math.round(block.durationSec / 60) : "?"} min`
        : `EMOM ${block.durationSec ? Math.round(block.durationSec / 60) : "?"} min`;
  return `${header} — ${names}`;
}

export async function getTimedBlockGroups(
  athleteId: string,
): Promise<TimedBlockGroup[]> {
  const blocks = await fetchTimedBlocks(athleteId);
  const groups = new Map<string, TimedBlockGroup>();
  for (const block of blocks) {
    const key = blockKey(block);
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else {
      groups.set(key, {
        key,
        format: block.format as TimedBlockGroup["format"],
        label: blockLabel(block),
        count: 1,
      });
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

export async function getTimedBlockProgress(
  athleteId: string,
  key: string,
): Promise<TimedBlockPoint[]> {
  const blocks = await fetchTimedBlocks(athleteId);
  return blocks
    .filter((block) => blockKey(block) === key)
    .map((block) => {
      const repsPerRound = block.exercises.reduce(
        (sum, e) => sum + (e.targetReps ?? 0),
        0,
      );
      return {
        date: block.session.date.toISOString().slice(0, 10),
        label: shortLabel(block.session.date),
        sessionTitle: block.session.title,
        timeSec: block.resultTimeSec,
        rounds: block.resultRounds,
        extraReps: block.resultExtraReps,
        totalReps:
          block.format === "AMRAP" && block.resultRounds !== null
            ? block.resultRounds * repsPerRound + (block.resultExtraReps ?? 0)
            : null,
        totalMinutes:
          block.format === "EMOM" && block.durationSec
            ? Math.round(block.durationSec / 60)
            : null,
        rpe: block.resultRpe,
      };
    });
}

// Exercices ayant au moins une réalisation pour cet athlète.
export async function getTrackedExercises(athleteId: string) {
  return prisma.exercise.findMany({
    where: {
      sessionExercises: {
        some: { block: { session: { athleteId } }, performanceSets: { some: {} } },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true },
  });
}
