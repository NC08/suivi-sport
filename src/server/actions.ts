"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié.");
  return session.user;
}

async function requireCoach() {
  const user = await requireUser();
  if (user.role !== "COACH") throw new Error("Action réservée au coach.");
  return user;
}

// ── Bibliothèque d'exercices ────────────────────────────────────

const exerciseSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court"),
  category: z.string().trim().min(1, "Catégorie requise"),
});

export async function createExercise(formData: FormData) {
  await requireCoach();
  const parsed = exerciseSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
  });
  await prisma.exercise.upsert({
    where: { name: parsed.name },
    update: { category: parsed.category },
    create: parsed,
  });
  revalidatePath("/coach/exercices");
  revalidatePath("/coach/seances/new");
}

// ── Création / assignation d'une séance ─────────────────────────

const sessionExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().positive().nullable(),
  targetReps: z.number().int().positive().nullable(),
  targetWeightKg: z.number().positive().nullable(),
  targetDurationSec: z.number().int().positive().nullable(),
  targetDistanceM: z.number().positive().nullable(),
  instructions: z.string().trim().max(500).nullable(),
});

const createSessionSchema = z.object({
  title: z.string().trim().min(2, "Titre requis"),
  type: z.enum(["CARDIO", "CROSSFIT", "HYROX", "MUSCULATION"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  athleteId: z.string().min(1, "Athlète requis"),
  coachNotes: z.string().trim().max(2000).nullable(),
  exercises: z.array(sessionExerciseSchema).min(1, "Ajoutez au moins un exercice"),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export async function createTrainingSession(
  input: CreateSessionInput,
): Promise<{ error: string } | never> {
  const coach = await requireCoach();
  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { exercises, date, ...data } = parsed.data;

  const athlete = await prisma.user.findUnique({ where: { id: data.athleteId } });
  if (!athlete || athlete.role !== "ATHLETE") {
    return { error: "Athlète introuvable." };
  }

  const created = await prisma.trainingSession.create({
    data: {
      title: data.title,
      type: data.type,
      date: new Date(date),
      coachNotes: data.coachNotes,
      coachId: coach.id,
      athleteId: data.athleteId,
      exercises: {
        create: exercises.map((ex, index) => ({ ...ex, position: index + 1 })),
      },
    },
  });

  revalidatePath("/coach");
  revalidatePath("/seances");
  redirect(`/coach/seances/${created.id}`);
}

// ── Saisie des réalisations (athlète) ───────────────────────────

const performanceSetSchema = z.object({
  reps: z.number().int().min(0).nullable(),
  weightKg: z.number().min(0).nullable(),
  durationSec: z.number().int().min(0).nullable(),
  distanceM: z.number().min(0).nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  notes: z.string().trim().max(500).nullable(),
});

export type PerformanceSetInput = z.infer<typeof performanceSetSchema>;

export async function savePerformance(
  sessionExerciseId: string,
  sets: PerformanceSetInput[],
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const parsed = z.array(performanceSetSchema).max(30).safeParse(sets);
  if (!parsed.success) return { error: "Saisie invalide." };

  const sessionExercise = await prisma.sessionExercise.findUnique({
    where: { id: sessionExerciseId },
    include: { session: true },
  });
  if (!sessionExercise || sessionExercise.session.athleteId !== user.id) {
    return { error: "Séance introuvable." };
  }

  // On ne garde que les séries où au moins une métrique est renseignée.
  const filled = parsed.data.filter(
    (s) =>
      s.reps !== null ||
      s.weightKg !== null ||
      s.durationSec !== null ||
      s.distanceM !== null ||
      s.rpe !== null ||
      (s.notes !== null && s.notes !== ""),
  );

  await prisma.$transaction([
    prisma.performanceSet.deleteMany({ where: { sessionExerciseId } }),
    prisma.performanceSet.createMany({
      data: filled.map((s, index) => ({
        ...s,
        sessionExerciseId,
        setNumber: index + 1,
      })),
    }),
  ]);

  revalidatePath(`/seances/${sessionExercise.sessionId}`);
  revalidatePath(`/coach/seances/${sessionExercise.sessionId}`);
  return { ok: true };
}

export async function completeSession(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  const rpeRaw = String(formData.get("sessionRpe") ?? "");
  const athleteNotes = String(formData.get("athleteNotes") ?? "").trim();

  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
  });
  if (!trainingSession || trainingSession.athleteId !== user.id) {
    throw new Error("Séance introuvable.");
  }

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      sessionRpe: rpeRaw ? Number(rpeRaw) : null,
      athleteNotes: athleteNotes || null,
    },
  });

  revalidatePath("/seances");
  revalidatePath(`/seances/${sessionId}`);
  revalidatePath("/coach");
}
