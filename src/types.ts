export type MuscleGroup = 'Back' | 'Shoulders' | 'Chest' | 'Biceps' | 'Triceps' | 'Core' | 'Legs';

export interface BaseRow {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise extends BaseRow {
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment?: 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight' | 'Kettlebell' | 'Other';
  unilateral?: boolean;
  notes?: string;
  archived?: boolean;
}

export interface Workout extends BaseRow {
  date: string;
  title?: string;
  notes?: string;
}

export interface WorkoutExercise extends BaseRow {
  workoutId: string;
  exerciseId: string;
  order: number;
  notes?: string;
}

export interface SetEntry extends BaseRow {
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  felt?: string;
}

export interface AppSettings extends BaseRow {
  id: 'app-settings';
  unit: 'kg' | 'lb';
  theme: 'light' | 'dark' | 'system';
  cloudSyncEnabled: boolean;
}


