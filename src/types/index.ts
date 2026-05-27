export type SessionType = 'cardio' | 'musculation' | 'hyrox' | 'crosstraining';

export interface ExerciseSet {
  setNumber: number;
  weight?: number;
  reps?: number;
  duration?: number;      // seconds
  distance?: number;      // meters
  rpm?: number;
  heartRate?: number;
  calories?: number;
  notes?: string;
}

// One interval within a cardio bloc
export interface CardioInterval {
  id: string;
  niveau?: number;
  rpmStart?: number;
  rpmEnd?: number;
  wattsStart?: number;
  wattsEnd?: number;
  position?: 'normal' | 'danseuse';
  danseuseDuration?: number;  // seconds in danseuse position
  recoveryAfter?: number;     // minutes of recovery after this interval
  isAvgBlock?: boolean;       // "5mins moy 83rpm 95watt" type block
  avgDuration?: number;       // minutes (for avg blocks)
  avgRpm?: number;
  avgWatts?: number;
  notes?: string;
}

// One bloc = group of intervals + optional recovery after the bloc
export interface CardioBloc {
  id: string;
  intervals: CardioInterval[];
  recoveryAfter?: number;  // minutes between this bloc and next
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  totalDuration?: number;
  totalDistance?: number;
  notes?: string;
  recoveryAfter?: number;
}

export interface Session {
  id: string;
  type: SessionType;
  date: string;
  title?: string;
  exercises: Exercise[];
  totalDuration?: number;   // minutes
  notes?: string;
  createdAt: string;
  // Cardio-specific
  warmupDuration?: number;
  cooldownDuration?: number;
  cardioBlocs?: CardioBloc[];
  machine?: string;
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  cardio: 'Cardio',
  musculation: 'Musculation',
  hyrox: 'Hyrox',
  crosstraining: 'Cross-Training',
};

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  cardio: '#ef4444',
  musculation: '#3b82f6',
  hyrox: '#10b981',
  crosstraining: '#f59e0b',
};

export const SESSION_TYPE_BG: Record<SessionType, string> = {
  cardio: 'bg-red-100 text-red-800 border-red-200',
  musculation: 'bg-blue-100 text-blue-800 border-blue-200',
  hyrox: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  crosstraining: 'bg-amber-100 text-amber-800 border-amber-200',
};

export const SESSION_TYPE_GRADIENT: Record<SessionType, string> = {
  cardio: 'from-red-500 to-red-600',
  musculation: 'from-blue-500 to-blue-600',
  hyrox: 'from-emerald-500 to-emerald-600',
  crosstraining: 'from-amber-500 to-amber-600',
};

export const SUGGESTED_EXERCISES: Record<SessionType, string[]> = {
  cardio: ['Vélo', 'Course à pied', 'Rameur', 'Corde à sauter', 'Elliptique', 'Natation', 'Ski erg'],
  musculation: ['Squat', 'Développé couché', 'Soulevé de terre', 'Tractions', 'Dips', 'Curl biceps', 'Presse à cuisses', 'Rowing barre', 'Développé militaire', 'Leg press'],
  hyrox: ['SkiErg', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Rowing', 'Farmers Carry', 'Sandbag Lunges', 'Wall Balls', 'Run 1km'],
  crosstraining: ['Thrusters', 'Box Jumps', 'Kettlebell Swing', 'Double Under', 'Muscle Up', 'Handstand Push Up', 'Toes to Bar', 'Power Clean', 'Wall Walk', 'Assault Bike'],
};

export const CARDIO_MACHINES = ['Vélo', 'Rameur', 'Tapis de course', 'Elliptique', 'Ski Erg', 'Assault Bike'];

export type MetricKey = 'weight' | 'reps' | 'duration' | 'distance' | 'rpm' | 'heartRate' | 'calories';

export const METRIC_LABELS: Record<MetricKey, string> = {
  weight: 'Poids (kg)',
  reps: 'Répétitions',
  duration: 'Durée (sec)',
  distance: 'Distance (m)',
  rpm: 'RPM',
  heartRate: 'FC (bpm)',
  calories: 'Calories',
};

export const METRIC_UNITS: Record<MetricKey, string> = {
  weight: 'kg',
  reps: 'reps',
  duration: 's',
  distance: 'm',
  rpm: 'rpm',
  heartRate: 'bpm',
  calories: 'kcal',
};

export const SESSION_METRICS: Record<SessionType, MetricKey[]> = {
  cardio: ['duration', 'distance', 'heartRate', 'calories', 'rpm'],
  musculation: ['weight', 'reps', 'duration'],
  hyrox: ['duration', 'distance', 'weight', 'reps'],
  crosstraining: ['weight', 'reps', 'duration', 'distance', 'calories'],
};
