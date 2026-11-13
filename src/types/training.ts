export type GoalDistance = '5K' | '10K' | '21K';
export type FitnessLevel = 'Pemula' | 'Menengah' | 'Pro';
export type DayName =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export type WorkoutType =
  | 'easy'
  | 'interval'
  | 'tempo'
  | 'long'
  | 'badminton'
  | 'rest';

export interface UserProfile {
  name: string;
  goal: GoalDistance;
  level: FitnessLevel;
  runFreq: 2 | 3 | 4;
  badmintonDays: DayName[];
  dob: string;
  weight: number;
  easyPaceSec: number;
  restingHr: number;
  createdAt: string;
}

export interface HeartRateZone {
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  name: string;
  description: string;
  minBpm: number;
  maxBpm: number;
  pctRange: string;
}

export interface WorkoutSegment {
  id: string;
  label: string;
  durationSec: number;
  targetPace: string;
  targetZone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  kind: 'warmup' | 'work' | 'recover' | 'cooldown';
}

export interface PlannedSession {
  id: string;
  week: number;
  day: DayName;
  dayIndex: number;
  title: string;
  type: WorkoutType;
  durationMin: number;
  distanceKm: number;
  targetPace: string;
  targetZone: string;
  description: string;
  segments?: WorkoutSegment[];
  conflictNote?: string;
}

export interface TrainingWeek {
  week: number;
  phase: string;
  totalRunKm: number;
  totalBadmintonMin: number;
  sessions: PlannedSession[];
}

export interface TrainingBlock {
  totalWeeks: number;
  coachInsight: string;
  weeks: TrainingWeek[];
}

export interface ActivitySplit {
  lap: number;
  label: string;
  distanceKm: number;
  durationSec: number;
  paceSec: number;
  avgHr: number;
}

export interface ActivityLog {
  id: string;
  dateIso: string;
  sessionId?: string;
  title: string;
  type: 'run' | 'badminton';
  durationMin: number;
  distanceKm: number;
  avgPaceSec: number;
  avgHr: number;
  rpe: number;
  shoeId?: string;
  notes?: string;
  evaluation: string;
  tasModeUsed: boolean;
  splits?: ActivitySplit[];
}

export interface ShoeItem {
  id: string;
  brandModel: string;
  currentKm: number;
  maxKm: number;
  isPrimary: boolean;
  addedAt: string;
}

export interface FatigueStatus {
  status: 'Aman' | 'Waspada' | 'Risiko Tinggi';
  title: string;
  readinessPct: number;
  weeklyLoadScore: number;
  targetLoadCap: number;
  advice: string;
}
