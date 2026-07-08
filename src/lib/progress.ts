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
