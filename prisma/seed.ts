import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Bibliothèque d'exercices de départ, par catégorie.
const EXERCISES: { name: string; category: string }[] = [
  // Musculation — haut du corps
  { name: "Développé couché", category: "Musculation" },
  { name: "Développé militaire", category: "Musculation" },
  { name: "Développé haltères", category: "Musculation" },
  { name: "Traction", category: "Musculation" },
  { name: "Traction lestée", category: "Musculation" },
  { name: "Tirage poulie verticale", category: "Musculation" },
  { name: "Tirage horizontal", category: "Musculation" },
  { name: "Rowing barre", category: "Musculation" },
  { name: "Dips", category: "Musculation" },
  { name: "Curl biceps", category: "Musculation" },
  { name: "Triceps poulie", category: "Musculation" },
  { name: "Élévations latérales", category: "Musculation" },
  // Musculation — bas du corps
  { name: "Squat", category: "Musculation" },
  { name: "Soulevé de terre", category: "Musculation" },
  { name: "Leg press", category: "Musculation" },
  { name: "Fentes", category: "Musculation" },
  { name: "Hip thrust", category: "Musculation" },
  // Cardio
  { name: "Course à pied", category: "Cardio" },
  { name: "Vélo / RPM", category: "Cardio" },
  { name: "Rameur", category: "Cardio" },
  { name: "SkiErg", category: "Cardio" },
  { name: "Assault bike", category: "Cardio" },
  // Hyrox / stations
  { name: "Sled push", category: "Hyrox" },
  { name: "Sled pull", category: "Hyrox" },
  { name: "Burpee broad jump", category: "Hyrox" },
  { name: "Farmers carry", category: "Hyrox" },
  { name: "Sandbag lunges", category: "Hyrox" },
  { name: "Wall balls", category: "Hyrox" },
  // CrossFit
  { name: "Thruster", category: "CrossFit" },
  { name: "Kettlebell swing", category: "CrossFit" },
  { name: "Box jump", category: "CrossFit" },
  { name: "Burpees", category: "CrossFit" },
  { name: "Toes to bar", category: "CrossFit" },
  { name: "Double unders", category: "CrossFit" },
  { name: "Clean & jerk", category: "CrossFit" },
  { name: "Snatch", category: "CrossFit" },
];

async function main() {
  for (const exercise of EXERCISES) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    });
  }
  console.log(`Bibliothèque : ${EXERCISES.length} exercices présents.`);

  // Comptes de développement (connexion dev sans Google, cf. AUTH_DEV_LOGIN)
  if (process.env.AUTH_DEV_LOGIN === "true") {
    await prisma.user.upsert({
      where: { email: "coach@dev.local" },
      update: { role: "COACH" },
      create: { email: "coach@dev.local", name: "Coach (dev)", role: "COACH" },
    });
    await prisma.user.upsert({
      where: { email: "athlete@dev.local" },
      update: {},
      create: { email: "athlete@dev.local", name: "Athlète (dev)", role: "ATHLETE" },
    });
    console.log("Comptes dev : coach@dev.local / athlete@dev.local");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
