import type { Session, SessionType, MetricKey } from '../types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface CTForTimePoint {
  date: string;
  rawDate: string;
  finalTime: number; // seconds
  sessionId: string;
}

export interface CTAmrapPoint {
  date: string;
  rawDate: string;
  score: number; // rounds + partial fraction
  roundsCompleted: number;
  sessionId: string;
}

export interface ChartPoint {
  date: string;
  rawDate: string;
  value: number;
  sessionId: string;
  label: string;
}

/**
 * Returns the best (max) value of a given metric for a specific exercise
 * across all sessions of the specified type.
 */
export function getExerciseProgressData(
  sessions: Session[],
  sessionType: SessionType,
  exerciseName: string,
  metric: MetricKey
): ChartPoint[] {
  const filtered = sessions
    .filter(s => s.type === sessionType)
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: ChartPoint[] = [];

  for (const session of filtered) {
    const exercise = session.exercises.find(
      e => e.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (!exercise) continue;

    let value: number | undefined;

    if (metric === 'distance' && exercise.totalDistance !== undefined) {
      value = exercise.totalDistance;
    } else if (metric === 'duration' && exercise.totalDuration !== undefined) {
      value = exercise.totalDuration;
    } else {
      // pick best set value
      const values = exercise.sets
        .map(s => s[metric] as number | undefined)
        .filter((v): v is number => v !== undefined);
      if (values.length > 0) {
        value = Math.max(...values);
      }
    }

    if (value !== undefined) {
      points.push({
        date: format(parseISO(session.date), 'd MMM yy', { locale: fr }),
        rawDate: session.date,
        value,
        sessionId: session.id,
        label: `${format(parseISO(session.date), 'dd/MM/yyyy')} — ${value}`,
      });
    }
  }

  return points;
}

/** Returns total volume (weight × reps) per session for a given exercise */
export function getExerciseVolumeData(
  sessions: Session[],
  sessionType: SessionType,
  exerciseName: string
): ChartPoint[] {
  const filtered = sessions
    .filter(s => s.type === sessionType)
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: ChartPoint[] = [];

  for (const session of filtered) {
    const exercise = session.exercises.find(
      e => e.name.toLowerCase() === exerciseName.toLowerCase()
    );
    if (!exercise) continue;

    const volume = exercise.sets.reduce((sum, s) => {
      if (s.weight !== undefined && s.reps !== undefined) {
        return sum + s.weight * s.reps;
      }
      return sum;
    }, 0);

    if (volume > 0) {
      points.push({
        date: format(parseISO(session.date), 'd MMM yy', { locale: fr }),
        rawDate: session.date,
        value: volume,
        sessionId: session.id,
        label: `${format(parseISO(session.date), 'dd/MM/yyyy')} — ${volume} kg`,
      });
    }
  }

  return points;
}

/** Count sessions per type */
export function getSessionCountByType(sessions: Session[]): { name: string; value: number; color: string }[] {
  const counts: Record<SessionType, number> = {
    cardio: 0,
    musculation: 0,
    hyrox: 0,
    crosstraining: 0,
  };
  for (const s of sessions) counts[s.type]++;

  const colors: Record<SessionType, string> = {
    cardio: '#ef4444',
    musculation: '#3b82f6',
    hyrox: '#10b981',
    crosstraining: '#f59e0b',
  };

  const labels: Record<SessionType, string> = {
    cardio: 'Cardio',
    musculation: 'Musculation',
    hyrox: 'Hyrox',
    crosstraining: 'Cross-Training',
  };

  return (Object.entries(counts) as [SessionType, number][])
    .filter(([, v]) => v > 0)
    .map(([type, value]) => ({ name: labels[type], value, color: colors[type] }));
}

/** Sessions per week for the last N weeks */
export function getWeeklySessionData(sessions: Session[], weeks = 12): { week: string; count: number }[] {
  const result: { week: string; count: number }[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7 - (now.getDay() + 6) % 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const count = sessions.filter(s => {
      const d = parseISO(s.date);
      return d >= weekStart && d <= weekEnd;
    }).length;

    result.push({
      week: format(weekStart, 'd MMM', { locale: fr }),
      count,
    });
  }

  return result;
}

/** All unique exercise names across sessions of a given type */
export function getExercisesForType(sessions: Session[], type: SessionType): string[] {
  const names = new Set<string>();
  for (const s of sessions.filter(s => s.type === type)) {
    for (const e of s.exercises) names.add(e.name);
  }
  return Array.from(names).sort();
}

/** Unique exercise names from ForTime blocs across CT sessions */
export function getCTForTimeExercises(sessions: Session[]): string[] {
  const names = new Set<string>();
  for (const s of sessions.filter(s => s.type === 'crosstraining')) {
    for (const bloc of s.ctBlocs ?? []) {
      if (bloc.blocType === 'forTime' && bloc.exerciseName.trim()) {
        names.add(bloc.exerciseName.trim());
      }
    }
  }
  return Array.from(names).sort();
}

/** FinalTime (seconds) per session for a given ForTime exercise name */
export function getCTForTimeProgressData(sessions: Session[], exerciseName: string): CTForTimePoint[] {
  const filtered = sessions
    .filter(s => s.type === 'crosstraining')
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: CTForTimePoint[] = [];
  for (const session of filtered) {
    for (const bloc of session.ctBlocs ?? []) {
      if (
        bloc.blocType === 'forTime' &&
        bloc.exerciseName.toLowerCase() === exerciseName.toLowerCase() &&
        bloc.finalTime !== undefined
      ) {
        points.push({
          date: format(parseISO(session.date), 'd MMM yy', { locale: fr }),
          rawDate: session.date,
          finalTime: bloc.finalTime,
          sessionId: session.id,
        });
        break;
      }
    }
  }
  return points;
}

/** Unique AMRAP workouts (keyed by sorted exercise names) */
export function getCTAmrapWorkouts(sessions: Session[]): { key: string; label: string }[] {
  const map = new Map<string, string>();
  for (const s of sessions.filter(s => s.type === 'crosstraining')) {
    for (const bloc of s.ctBlocs ?? []) {
      if (bloc.blocType === 'amrap') {
        const names = bloc.exercises.map(e => e.name.trim()).filter(Boolean);
        if (names.length > 0) {
          const key = names.join('|');
          map.set(key, names.join(', '));
        }
      }
    }
  }
  return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
}

/** AMRAP score (rounds + partial fraction) per session for a given workout key */
export function getCTAmrapProgressData(sessions: Session[], workoutKey: string): CTAmrapPoint[] {
  const filtered = sessions
    .filter(s => s.type === 'crosstraining')
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: CTAmrapPoint[] = [];
  for (const session of filtered) {
    for (const bloc of session.ctBlocs ?? []) {
      if (bloc.blocType === 'amrap') {
        const names = bloc.exercises.map(e => e.name.trim()).filter(Boolean);
        const key = names.join('|');
        if (key === workoutKey && bloc.roundsCompleted !== undefined) {
          const partial = (bloc.partialRoundExercises ?? 0) / Math.max(bloc.exercises.length, 1);
          points.push({
            date: format(parseISO(session.date), 'd MMM yy', { locale: fr }),
            rawDate: session.date,
            score: bloc.roundsCompleted + partial,
            roundsCompleted: bloc.roundsCompleted,
            sessionId: session.id,
          });
          break;
        }
      }
    }
  }
  return points;
}
