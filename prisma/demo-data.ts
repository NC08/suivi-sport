/* Données de démonstration : ~10 semaines d'historique pour athlete@dev.local */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

async function main() {
  const coach = await prisma.user.findUniqueOrThrow({ where: { email: "coach@dev.local" } });
  const athlete = await prisma.user.findUniqueOrThrow({ where: { email: "athlete@dev.local" } });

  const ex = async (name: string) =>
    (await prisma.exercise.findUniqueOrThrow({ where: { name } })).id;
  const dc = await ex("Développé couché");
  const squat = await ex("Squat");
  const traction = await ex("Traction lestée");
  const fentes = await ex("Fentes");
  const hipThrust = await ex("Hip thrust");
  const course = await ex("Course à pied");
  const wallballs = await ex("Wall balls");
  const sled = await ex("Sled push");
  const burpees = await ex("Burpees");
  const kbSwing = await ex("Kettlebell swing");
  const thruster = await ex("Thruster");

  // Nettoie les anciennes données de démo de cet athlète
  await prisma.trainingSession.deleteMany({ where: { athleteId: athlete.id } });

  const thisMonday = mondayOf(new Date());
  const rnd = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

  for (let week = 9; week >= 0; week--) {
    const monday = new Date(thisMonday);
    monday.setUTCDate(monday.getUTCDate() - 7 * week);
    const progress = (9 - week) / 9; // 0 → 1
    const day = (offset: number) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + offset);
      return d;
    };

    // Lundi : muscu haut du corps — bloc classique
    const dcWeight = Math.round((70 + 15 * progress) / 2.5) * 2.5;
    await prisma.trainingSession.create({
      data: {
        title: "Haut du corps — force",
        type: "MUSCULATION",
        date: day(0),
        status: "COMPLETED",
        completedAt: day(0),
        sessionRpe: rnd(6, 8),
        coachId: coach.id,
        athleteId: athlete.id,
        blocks: {
          create: [
            {
              position: 1,
              format: "STANDARD",
              title: "Force",
              exercises: {
                create: [
                  {
                    position: 1, exerciseId: dc, targetSets: 4, targetReps: 8, targetWeightKg: dcWeight,
                    performanceSets: {
                      create: [8, 8, rnd(6, 8), rnd(5, 7)].map((reps, i) => ({
                        setNumber: i + 1, reps, weightKg: dcWeight, rpe: Math.min(10, 6 + i),
                      })),
                    },
                  },
                  {
                    position: 2, exerciseId: traction, targetSets: 4, targetReps: 6,
                    targetWeightKg: 10 + Math.round(10 * progress),
                    performanceSets: {
                      create: [6, 6, rnd(4, 6)].map((reps, i) => ({
                        setNumber: i + 1, reps, weightKg: 10 + Math.round(10 * progress), rpe: 7 + i,
                      })),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Mercredi : cardio — 5 km, 28 min → 24 min
    const runSec = Math.round(28 * 60 - 4 * 60 * progress + rnd(-40, 40));
    await prisma.trainingSession.create({
      data: {
        title: "Cardio — 5 km tempo",
        type: "CARDIO",
        date: day(2),
        status: "COMPLETED",
        completedAt: day(2),
        sessionRpe: rnd(7, 9),
        coachId: coach.id,
        athleteId: athlete.id,
        blocks: {
          create: [{
            position: 1,
            format: "STANDARD",
            exercises: {
              create: [{
                position: 1, exerciseId: course, targetDistanceM: 5000,
                performanceSets: {
                  create: [{ setNumber: 1, distanceM: 5000, durationSec: runSec, rpe: rnd(7, 9) }],
                },
              }],
            },
          }],
        },
      },
    });

    // Vendredi : muscu bas du corps — squat + superset fentes/hip thrust
    const squatWeight = Math.round((80 + 25 * progress) / 2.5) * 2.5;
    const lungeWeight = 2 * (10 + Math.round(6 * progress));
    const hipWeight = 60 + Math.round(20 * progress);
    await prisma.trainingSession.create({
      data: {
        title: "Bas du corps — force",
        type: "MUSCULATION",
        date: day(4),
        status: "COMPLETED",
        completedAt: day(4),
        sessionRpe: rnd(7, 9),
        coachId: coach.id,
        athleteId: athlete.id,
        blocks: {
          create: [
            {
              position: 1,
              format: "STANDARD",
              title: "Force",
              exercises: {
                create: [{
                  position: 1, exerciseId: squat, targetSets: 5, targetReps: 5, targetWeightKg: squatWeight,
                  performanceSets: {
                    create: [5, 5, 5, rnd(4, 5), rnd(3, 5)].map((reps, i) => ({
                      setNumber: i + 1, reps, weightKg: squatWeight, rpe: Math.min(10, 6 + i),
                    })),
                  },
                }],
              },
            },
            {
              position: 2,
              format: "SUPERSET",
              title: "Accessoires",
              rounds: 3,
              restSec: 90,
              exercises: {
                create: [
                  {
                    position: 1, exerciseId: fentes, targetReps: 12, targetWeightKg: lungeWeight,
                    performanceSets: {
                      create: [0, 1, 2].map((i) => ({
                        setNumber: i + 1, reps: 12, weightKg: lungeWeight,
                      })),
                    },
                  },
                  {
                    position: 2, exerciseId: hipThrust, targetReps: 10, targetWeightKg: hipWeight,
                    performanceSets: {
                      create: [0, 1, 2].map((i) => ({
                        setNumber: i + 1, reps: 10, weightKg: hipWeight,
                      })),
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Samedi : Hyrox (For Time) ou CrossFit (AMRAP) ; 2 semaines "ratées"
    const missed = week === 6 || week === 2;
    const isHyrox = week % 2 === 0;
    await prisma.trainingSession.create({
      data: {
        title: isHyrox ? "Hyrox — stations" : "WOD — AMRAP",
        type: isHyrox ? "HYROX" : "CROSSFIT",
        date: day(5),
        status: missed ? "ASSIGNED" : "COMPLETED",
        completedAt: missed ? null : day(5),
        sessionRpe: missed ? null : rnd(8, 10),
        coachId: coach.id,
        athleteId: athlete.id,
        blocks: {
          create: isHyrox
            ? [{
                position: 1,
                format: "FOR_TIME",
                title: "Stations",
                notes: "Enchaîner sans pause : sled, wall balls, burpees.",
                resultTimeSec: missed ? null : rnd(680, 760) - Math.round(90 * progress),
                resultRpe: missed ? null : rnd(8, 10),
                exercises: {
                  create: [
                    { position: 1, exerciseId: sled, targetDistanceM: 50, targetWeightKg: 102 },
                    { position: 2, exerciseId: wallballs, targetReps: 100, targetWeightKg: 9 },
                    { position: 3, exerciseId: burpees, targetReps: 40 },
                  ],
                },
              }]
            : [{
                position: 1,
                format: "AMRAP",
                title: "WOD",
                durationSec: 12 * 60,
                resultRounds: missed ? null : 4 + Math.round(2 * progress),
                resultExtraReps: missed ? null : rnd(0, 14),
                resultRpe: missed ? null : rnd(8, 10),
                resultNotes: missed ? null : "Thrusters à 30 kg.",
                exercises: {
                  create: [
                    { position: 1, exerciseId: thruster, targetReps: 10, targetWeightKg: 30 },
                    { position: 2, exerciseId: kbSwing, targetReps: 15, targetWeightKg: 24 },
                    { position: 3, exerciseId: burpees, targetReps: 10 },
                  ],
                },
              }],
        },
      },
    });
  }

  const count = await prisma.trainingSession.count({ where: { athleteId: athlete.id } });
  console.log(`${count} séances de démo créées.`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
