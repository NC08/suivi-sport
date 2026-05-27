import type { Session } from '../types';
import { generateId } from './storage';

/**
 * Generates realistic demo sessions for the last 3 months
 * so the app looks alive on first load.
 */
export function generateSeedData(): Session[] {
  const sessions: Session[] = [];
  const today = new Date();

  const dateStr = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // ---- MUSCULATION sessions ----
  const musculationDays = [84, 77, 70, 63, 56, 49, 42, 35, 28, 21, 14, 7, 2];
  const benchProgression = [70, 72.5, 72.5, 75, 75, 77.5, 80, 80, 82.5, 82.5, 85, 85, 87.5];
  const squatProgression = [90, 90, 92.5, 95, 95, 97.5, 100, 100, 102.5, 105, 105, 107.5, 110];

  musculationDays.forEach((day, i) => {
    sessions.push({
      id: generateId(),
      type: 'musculation',
      date: dateStr(day),
      title: 'Séance Push/Pull',
      totalDuration: 65,
      exercises: [
        {
          id: generateId(),
          name: 'Développé couché',
          sets: [
            { setNumber: 1, weight: benchProgression[i] - 10, reps: 8 },
            { setNumber: 2, weight: benchProgression[i], reps: 5 },
            { setNumber: 3, weight: benchProgression[i], reps: 5 },
            { setNumber: 4, weight: benchProgression[i], reps: 4 },
          ],
        },
        {
          id: generateId(),
          name: 'Squat',
          sets: [
            { setNumber: 1, weight: squatProgression[i] - 15, reps: 8 },
            { setNumber: 2, weight: squatProgression[i], reps: 5 },
            { setNumber: 3, weight: squatProgression[i], reps: 5 },
            { setNumber: 4, weight: squatProgression[i], reps: 4 },
          ],
        },
        {
          id: generateId(),
          name: 'Rowing barre',
          sets: [
            { setNumber: 1, weight: 60 + i * 1.5, reps: 8 },
            { setNumber: 2, weight: 65 + i * 1.5, reps: 6 },
            { setNumber: 3, weight: 65 + i * 1.5, reps: 6 },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    });
  });

  // ---- CARDIO sessions ----
  const cardioDays = [80, 73, 66, 59, 52, 45, 38, 31, 24, 17, 10, 4];
  const runDist = [5000, 5200, 5500, 5800, 6000, 6200, 6500, 6800, 7000, 7200, 7500, 8000];
  const runTime = [1680, 1700, 1740, 1770, 1800, 1800, 1820, 1840, 1850, 1860, 1890, 1920];

  cardioDays.forEach((day, i) => {
    sessions.push({
      id: generateId(),
      type: 'cardio',
      date: dateStr(day),
      title: 'Course à pied',
      totalDuration: Math.round(runTime[i] / 60),
      exercises: [
        {
          id: generateId(),
          name: 'Course à pied',
          totalDistance: runDist[i],
          totalDuration: runTime[i],
          sets: [
            {
              setNumber: 1,
              distance: runDist[i],
              duration: runTime[i],
              heartRate: 155 + Math.floor(Math.random() * 10),
              calories: Math.round(runDist[i] * 0.07),
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    });
  });

  // ---- HYROX sessions ----
  const hyroxDays = [75, 47, 19, 5];
  const hyroxTimes = [5400, 5100, 4920, 4800]; // total race time in sec

  hyroxDays.forEach((day, i) => {
    sessions.push({
      id: generateId(),
      type: 'hyrox',
      date: dateStr(day),
      title: 'Simulation Hyrox',
      totalDuration: Math.round(hyroxTimes[i] / 60),
      exercises: [
        {
          id: generateId(),
          name: 'SkiErg',
          totalDistance: 1000,
          totalDuration: 240 - i * 8,
          sets: [{ setNumber: 1, distance: 1000, duration: 240 - i * 8 }],
        },
        {
          id: generateId(),
          name: 'Sled Push',
          totalDistance: 50,
          sets: [{ setNumber: 1, distance: 50, weight: 102, duration: 90 - i * 5 }],
        },
        {
          id: generateId(),
          name: 'Rowing',
          totalDistance: 1000,
          totalDuration: 230 - i * 6,
          sets: [{ setNumber: 1, distance: 1000, duration: 230 - i * 6 }],
        },
        {
          id: generateId(),
          name: 'Wall Balls',
          sets: [{ setNumber: 1, reps: 100, weight: 6 }],
        },
      ],
      createdAt: new Date().toISOString(),
    });
  });

  // ---- CROSSTRAINING sessions ----
  const crossDays = [72, 60, 50, 40, 30, 20, 8, 1];
  const thrusterW = [30, 32.5, 32.5, 35, 35, 37.5, 40, 40];

  crossDays.forEach((day, i) => {
    sessions.push({
      id: generateId(),
      type: 'crosstraining',
      date: dateStr(day),
      title: 'WOD du jour',
      totalDuration: 45,
      exercises: [
        {
          id: generateId(),
          name: 'Thrusters',
          sets: [
            { setNumber: 1, weight: thrusterW[i], reps: 15 },
            { setNumber: 2, weight: thrusterW[i], reps: 12 },
            { setNumber: 3, weight: thrusterW[i], reps: 10 },
          ],
        },
        {
          id: generateId(),
          name: 'Box Jumps',
          sets: [
            { setNumber: 1, reps: 20 },
            { setNumber: 2, reps: 20 },
            { setNumber: 3, reps: 15 },
          ],
        },
        {
          id: generateId(),
          name: 'Kettlebell Swing',
          sets: [
            { setNumber: 1, weight: 24 + Math.floor(i / 3) * 4, reps: 21 },
            { setNumber: 2, weight: 24 + Math.floor(i / 3) * 4, reps: 21 },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    });
  });

  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}
