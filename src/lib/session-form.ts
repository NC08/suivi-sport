import type { Prisma } from "@prisma/client";
import type { CreateSessionInput } from "@/server/actions";

export type SessionWithBlocks = Prisma.TrainingSessionGetPayload<{
  include: { blocks: { include: { exercises: true } } };
}>;

// Convertit une séance existante en valeurs initiales du formulaire
// (duplication ou édition).
export function sessionToFormInput(
  session: SessionWithBlocks,
  overrides?: { date?: string },
): CreateSessionInput {
  return {
    title: session.title,
    type: session.type,
    date: overrides?.date ?? session.date.toISOString().slice(0, 10),
    athleteId: session.athleteId,
    coachNotes: session.coachNotes,
    blocks: [...session.blocks]
      .sort((a, b) => a.position - b.position)
      .map((block) => ({
        format: block.format,
        title: block.title,
        rounds: block.rounds,
        durationSec: block.durationSec,
        restSec: block.restSec,
        notes: block.notes,
        exercises: [...block.exercises]
          .sort((a, b) => a.position - b.position)
          .map((ex) => ({
            exerciseId: ex.exerciseId,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetWeightKg: ex.targetWeightKg,
            targetDurationSec: ex.targetDurationSec,
            targetDistanceM: ex.targetDistanceM,
            instructions: ex.instructions,
          })),
      })),
  };
}

// Une séance porte-t-elle déjà des saisies de l'athlète ?
export function hasAthleteData(session: {
  blocks: {
    resultTimeSec: number | null;
    resultRounds: number | null;
    resultRpe: number | null;
    exercises: { performanceSets: unknown[] }[];
  }[];
}): boolean {
  return session.blocks.some(
    (block) =>
      block.resultTimeSec !== null ||
      block.resultRounds !== null ||
      block.resultRpe !== null ||
      block.exercises.some((ex) => ex.performanceSets.length > 0),
  );
}
