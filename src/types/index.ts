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
  danseuseDuration?: number;
  recoveryAfter?: number;
  isAvgBlock?: boolean;
  avgDuration?: number;
  avgRpm?: number;
  avgWatts?: number;
  notes?: string;
}

export interface CardioBloc {
  id: string;
  intervals: CardioInterval[];
  recoveryAfter?: number;
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

// ── Musculation types ──────────────────────────────────────────

export interface MuscuSet {
  setNumber: number;
  weight?: number;
  targetReps?: number;
  actualReps?: number;
}

export interface MuscuExercise {
  id: string;
  itemType: 'exercise';
  name: string;
  sets: MuscuSet[];
  recoveryAfter?: number;
  recoveryIsAvg?: boolean;
  variation?: string;
  notes?: string;
}

export interface SupersetExercise {
  id: string;
  name: string;
  weight?: number;
  targetReps?: number;
  actualRepsByRound?: (number | undefined)[];
  variation?: string;
  notes?: string;
}

export interface MuscuSuperset {
  id: string;
  itemType: 'superset';
  exercises: SupersetExercise[];
  rounds: number;
  recoveryAfter?: number;
  recoveryIsAvg?: boolean;
  notes?: string;
}

export type MuscuItem = MuscuExercise | MuscuSuperset;

export const MUSCU_VARIATIONS = ['Sans banc', 'Avec banc', 'Debout', 'Assis', 'Incliné', 'Décliné', 'Prise large', 'Prise serrée', 'Unilatéral', 'Pronation', 'Supination'];

export const MUSCU_EXERCISES = [
  'Traction lestée', 'Traction', 'Tirage horizontal allongé', 'Tirage poulie verticale',
  'Poulie', 'Curl marteau', 'Curl biceps', 'Curl haltères',
  'Développé couché', 'Développé militaire', 'Développé haltères',
  'Squat', 'Squat haltères', 'Leg press', 'Fentes', 'Soulevé de terre',
  'Hip thrust', 'Rowing barre', 'Rowing haltères', 'Face pull',
  'Dips', 'Triceps poulie', 'Triceps haltères',
  'Shrug', 'Élévations latérales', 'Élévations frontales',
  'Gainage', 'Crunch', 'Ab wheel',
];

// ── Cross-Training types ───────────────────────────────────────

export type CTGrip = 'pronation' | 'supination' | 'neutre';

export interface CTBreak {
  repsDone: number;
  grip?: CTGrip;
}

export interface CTForTimeBloc {
  id: string;
  blocType: 'forTime';
  exerciseName: string;
  targetReps?: number;
  penaltyDesc?: string;
  penaltyRounds?: number;
  segmentInterval?: number;
  segmentTimes?: number[];
  breaks: CTBreak[];
  finalTime?: number;
  recoveryAfter?: string;
  notes?: string;
}

export interface CTAmrapExercise {
  id: string;
  name: string;
  targetReps?: number;
  targetCals?: number;
  weight?: number;
  notes?: string;
}

export interface CTAmrapBloc {
  id: string;
  blocType: 'amrap';
  exercises: CTAmrapExercise[];
  duration?: number;
  roundsCompleted?: number;
  partialRoundExercises?: number;
  recoveryAfter?: string;
  notes?: string;
}

export interface CTFinisherExercise {
  id: string;
  name: string;
  metric?: 'reps' | 'km' | 'cal';
  targetReps?: number;
  targetDistance?: number; // km
  targetCals?: number;
  weight?: number;
  variant?: string;
  notes?: string;
}

export interface CTFinisherBloc {
  id: string;
  blocType: 'finisher';
  exercises: CTFinisherExercise[];
  finalTime?: number;
  label?: string;
  notes?: string;
}

export interface CTEmomExercise {
  id: string;
  name: string;
  isRest?: boolean;
  targetRepsMin?: number;
  targetRepsMax?: number;
  actualReps: (number | undefined)[];
  notes?: string;
}

export interface CTEmomBloc {
  id: string;
  blocType: 'emom';
  totalMinutes: number;
  exercises: CTEmomExercise[];
  notes?: string;
}

export interface CTDeathByInterval {
  effortSecs: number;
  restSecs: number;
  avgWatts?: number;
  avgRpm?: number;
}

export interface CTDeathByBlock {
  id: string;
  machine?: string;
  intervals: CTDeathByInterval[];
}

export interface CTDeathByBloc {
  id: string;
  blocType: 'deathBy';
  blocks: CTDeathByBlock[];
  recoveryBetween?: number;
  notes?: string;
}

export type CTBloc = CTForTimeBloc | CTAmrapBloc | CTFinisherBloc | CTEmomBloc | CTDeathByBloc;

export const CT_EXERCISES = [
  'Tractions', 'Tractions lestées', 'Push-ups', 'Burpees', 'Squats', 'Jump squat',
  'Push press', 'Sit up', 'Fentes arrière', 'Wall ball', 'Thruster',
  'Cross mountain climbers', 'Rameur abs', 'Snatch', 'Power clean', 'Clean', 'Deadlift',
  'Kettlebell swing', 'Box jump', 'Double under', 'Assault bike', 'Ski erg',
  'Rameur', 'Muscle up', 'Handstand push-up', 'Toes to bar', 'Wall walk',
  'Dips', 'GHD sit up', 'Pistol squat', 'Bar muscle up', 'Ring dip',
];

// ── Hyrox types ────────────────────────────────────────────────

export interface HyroxExercise {
  id: string;
  name: string;
  target?: number;
  unit?: 'm' | 'reps' | 'cal';
  weight?: number;
}

export interface HyroxStation {
  id: string;
  exercises: HyroxExercise[];
  trExercise?: string;
  trReps?: number;
  overtime?: number; // seconds over time cap; undefined = ok
}

export interface HyroxStationsBloc {
  id: string;
  blocType: 'hyroxStations';
  workTimeMins: number;
  recoveryMins: number;
  stations: HyroxStation[];
  notes?: string;
}

export interface HyroxPartnerAmrapExercise {
  id: string;
  name: string;
  targetReps?: number;
  targetCals?: number;
}

export interface HyroxPartnerAmrapBloc {
  id: string;
  blocType: 'partnerAmrap';
  p1Exercise: string;
  p1IsDistance?: boolean;
  p1Total?: number;
  p2Exercises: HyroxPartnerAmrapExercise[];
  p2TotalRounds?: number;
  p2PartialExercises?: number;
  duration?: number;
  recoveryAfter?: string;
  notes?: string;
}

export interface HyroxPartnerFinisherBloc {
  id: string;
  blocType: 'partnerFinisher';
  mainExercise: string;
  mainTotal?: number;
  overtime?: number; // seconds over time cap
  penaltyDesc?: string;
  penaltyRounds?: number;
  duration?: number;
  notes?: string;
}

export type HyroxBloc = HyroxStationsBloc | HyroxPartnerAmrapBloc | HyroxPartnerFinisherBloc | CTForTimeBloc | CTFinisherBloc;

export const HYROX_EXERCISES = [
  'Ski erg', 'Rameur', 'Farmer carry', 'Sled push', 'Sled pull',
  'Sandbag lunges', 'Wall balls', 'Burpee broad jump', 'Run',
  'Thruster', 'KB swing', 'Box jump over', 'Walking lunges',
  'Snatch', 'DB snatch', 'Push-up hand release', 'Sit up',
  'Cross mountain climbers', 'Air squat', 'Jumping jacks',
  'Burpees', 'Push-ups',
];

// ── Session ────────────────────────────────────────────────────

export interface Session {
  id: string;
  type: SessionType;
  date: string;
  title?: string;
  exercises: Exercise[];
  totalDuration?: number;
  notes?: string;
  createdAt: string;
  // Cardio-specific
  warmupDuration?: number;
  cooldownDuration?: number;
  cardioBlocs?: CardioBloc[];
  machine?: string;
  // Musculation-specific
  muscuItems?: MuscuItem[];
  // Cross-training specific
  warmupDone?: boolean;
  ctBlocs?: CTBloc[];
  // Hyrox-specific
  hyroxBlocs?: HyroxBloc[];
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
  musculation: MUSCU_EXERCISES,
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
