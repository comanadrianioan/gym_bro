import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { nanoid } from './utils/uuid';
import { Exercise, MuscleGroup } from './types';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    try {
      console.log('[DB] Opening database...');
      dbPromise = openDatabaseAsync('liftlog.db');
      console.log('[DB] Waiting for database promise...');
      
      // Add a timeout to detect if it's hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database open timeout after 10 seconds')), 10000)
      );
      
      const db = await Promise.race([dbPromise, timeoutPromise]) as SQLiteDatabase;
      console.log('[DB] Database opened, running migration...');
      await migrate(db);
      console.log('[DB] Migration complete');
    } catch (error) {
      console.error('[DB] Database initialization error:', error);
      console.error('[DB] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      dbPromise = null; // Reset so we can retry
      throw error;
    }
  } else {
    console.log('[DB] Using existing database promise');
  }
  return dbPromise!;
}

async function migrate(db: SQLiteDatabase) {
  try {
    console.log('[DB] Starting migration...');
    const sql = [
      'PRAGMA foreign_keys = ON;',
      'CREATE TABLE IF NOT EXISTS exercises (',
      '  id TEXT PRIMARY KEY NOT NULL,',
      '  userId TEXT NOT NULL,',
      '  name TEXT NOT NULL,',
      '  primaryMuscle TEXT NOT NULL,',
      '  secondaryMuscles TEXT,',
      '  equipment TEXT,',
      '  unilateral INTEGER,',
      '  notes TEXT,',
      '  archived INTEGER,',
      '  createdAt TEXT NOT NULL,',
      '  updatedAt TEXT NOT NULL',
      ');',
      'CREATE TABLE IF NOT EXISTS workouts (',
      '  id TEXT PRIMARY KEY NOT NULL,',
      '  userId TEXT NOT NULL,',
      '  date TEXT NOT NULL,',
      '  title TEXT,',
      '  notes TEXT,',
      '  createdAt TEXT NOT NULL,',
      '  updatedAt TEXT NOT NULL',
      ');',
      'CREATE TABLE IF NOT EXISTS workout_exercises (',
      '  id TEXT PRIMARY KEY NOT NULL,',
      '  userId TEXT NOT NULL,',
      '  workoutId TEXT NOT NULL,',
      '  exerciseId TEXT NOT NULL,',
      '  "order" INTEGER NOT NULL,',
      '  notes TEXT,',
      '  createdAt TEXT NOT NULL,',
      '  updatedAt TEXT NOT NULL,',
      '  FOREIGN KEY (workoutId) REFERENCES workouts(id) ON DELETE CASCADE,',
      '  FOREIGN KEY (exerciseId) REFERENCES exercises(id) ON DELETE CASCADE',
      ');',
      'CREATE TABLE IF NOT EXISTS sets (',
      '  id TEXT PRIMARY KEY NOT NULL,',
      '  userId TEXT NOT NULL,',
      '  workoutExerciseId TEXT NOT NULL,',
      '  setNumber INTEGER NOT NULL,',
      '  weight REAL NOT NULL,',
      '  reps INTEGER NOT NULL,',
      '  rpe REAL,',
      '  felt TEXT,',
      '  createdAt TEXT NOT NULL,',
      '  updatedAt TEXT NOT NULL,',
      '  FOREIGN KEY (workoutExerciseId) REFERENCES workout_exercises(id) ON DELETE CASCADE',
      ');',
      'CREATE TABLE IF NOT EXISTS app_settings (',
      '  id TEXT PRIMARY KEY NOT NULL,',
      '  userId TEXT NOT NULL,',
      '  unit TEXT NOT NULL,',
      '  theme TEXT NOT NULL,',
      '  cloudSyncEnabled INTEGER NOT NULL,',
      '  createdAt TEXT NOT NULL,',
      '  updatedAt TEXT NOT NULL',
      ');',
    ].join('\n');
    
    console.log('[DB] Executing schema SQL...');
    await db.execAsync(sql);
    console.log('[DB] Schema created, ensuring settings...');
    await ensureSettings(db);
    console.log('[DB] Ensuring seed exercises...');
    await ensureSeedExercises(db);
    console.log('[DB] Migration complete');
  } catch (error) {
    console.error('[DB] Migration error:', error);
    throw error;
  }
}

async function ensureSettings(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM app_settings WHERE id = ? LIMIT 1',
    ['app-settings']
  );
  if (!row) {
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO app_settings (id, userId, unit, theme, cloudSyncEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['app-settings', 'local', 'kg', 'system', 0, now, now]
    );
  }
}

const seed: Array<Pick<Exercise, 'name' | 'primaryMuscle' | 'equipment'>> = [
  // Back exercises
  { name: 'Deadlift', primaryMuscle: 'Back', equipment: 'Barbell' },
  { name: 'Barbell Row', primaryMuscle: 'Back', equipment: 'Barbell' },
  { name: 'T-Bar Row', primaryMuscle: 'Back', equipment: 'Barbell' },
  { name: 'Lat Pulldown', primaryMuscle: 'Back', equipment: 'Machine' },
  { name: 'Seated Cable Row', primaryMuscle: 'Back', equipment: 'Cable' },
  { name: 'Cable Pulldown', primaryMuscle: 'Back', equipment: 'Cable' },
  { name: 'One-Arm Dumbbell Row', primaryMuscle: 'Back', equipment: 'Dumbbell' },
  { name: 'Pull-up', primaryMuscle: 'Back', equipment: 'Bodyweight' },
  { name: 'Chin-up', primaryMuscle: 'Back', equipment: 'Bodyweight' },
  { name: 'Chest Supported Row', primaryMuscle: 'Back', equipment: 'Machine' },
  { name: 'Wide Grip Pull-up', primaryMuscle: 'Back', equipment: 'Bodyweight' },
  
  // Shoulders exercises
  { name: 'Overhead Press', primaryMuscle: 'Shoulders', equipment: 'Barbell' },
  { name: 'Dumbbell Shoulder Press', primaryMuscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Lateral Raise', primaryMuscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Front Raise', primaryMuscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Rear Delt Fly', primaryMuscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Cable Lateral Raise', primaryMuscle: 'Shoulders', equipment: 'Cable' },
  { name: 'Arnold Press', primaryMuscle: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Upright Row', primaryMuscle: 'Shoulders', equipment: 'Barbell' },
  { name: 'Pike Push-up', primaryMuscle: 'Shoulders', equipment: 'Bodyweight' },
  { name: 'Face Pull', primaryMuscle: 'Shoulders', equipment: 'Cable' },
  { name: 'Shrugs', primaryMuscle: 'Shoulders', equipment: 'Barbell' },
  { name: 'Behind Neck Press', primaryMuscle: 'Shoulders', equipment: 'Barbell' },
  
  // Chest exercises
  { name: 'Bench Press', primaryMuscle: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Bench Press', primaryMuscle: 'Chest', equipment: 'Barbell' },
  { name: 'Decline Bench Press', primaryMuscle: 'Chest', equipment: 'Barbell' },
  { name: 'Dumbbell Bench Press', primaryMuscle: 'Chest', equipment: 'Dumbbell' },
  { name: 'Incline Dumbbell Press', primaryMuscle: 'Chest', equipment: 'Dumbbell' },
  { name: 'Dumbbell Fly', primaryMuscle: 'Chest', equipment: 'Dumbbell' },
  { name: 'Cable Fly', primaryMuscle: 'Chest', equipment: 'Cable' },
  { name: 'Push-up', primaryMuscle: 'Chest', equipment: 'Bodyweight' },
  { name: 'Incline Push-up', primaryMuscle: 'Chest', equipment: 'Bodyweight' },
  { name: 'Decline Push-up', primaryMuscle: 'Chest', equipment: 'Bodyweight' },
  { name: 'Chest Dips', primaryMuscle: 'Chest', equipment: 'Bodyweight' },
  { name: 'Pec Deck', primaryMuscle: 'Chest', equipment: 'Machine' },
  
  // Biceps exercises
  { name: 'Bicep Curl', primaryMuscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Barbell Curl', primaryMuscle: 'Biceps', equipment: 'Barbell' },
  { name: 'Hammer Curl', primaryMuscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Cable Curl', primaryMuscle: 'Biceps', equipment: 'Cable' },
  { name: 'Preacher Curl', primaryMuscle: 'Biceps', equipment: 'Barbell' },
  { name: 'Concentration Curl', primaryMuscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Incline Dumbbell Curl', primaryMuscle: 'Biceps', equipment: 'Dumbbell' },
  { name: 'Cable Hammer Curl', primaryMuscle: 'Biceps', equipment: 'Cable' },
  { name: '21s', primaryMuscle: 'Biceps', equipment: 'Barbell' },
  { name: 'Spider Curl', primaryMuscle: 'Biceps', equipment: 'Barbell' },
  
  // Triceps exercises
  { name: 'Tricep Pushdown', primaryMuscle: 'Triceps', equipment: 'Cable' },
  { name: 'Overhead Tricep Extension', primaryMuscle: 'Triceps', equipment: 'Dumbbell' },
  { name: 'Close Grip Bench Press', primaryMuscle: 'Triceps', equipment: 'Barbell' },
  { name: 'Tricep Dips', primaryMuscle: 'Triceps', equipment: 'Bodyweight' },
  { name: 'Skull Crusher', primaryMuscle: 'Triceps', equipment: 'Barbell' },
  { name: 'Diamond Push-up', primaryMuscle: 'Triceps', equipment: 'Bodyweight' },
  { name: 'Cable Overhead Extension', primaryMuscle: 'Triceps', equipment: 'Cable' },
  { name: 'Tricep Kickback', primaryMuscle: 'Triceps', equipment: 'Dumbbell' },
  { name: 'Rope Pushdown', primaryMuscle: 'Triceps', equipment: 'Cable' },
  { name: 'Bench Dips', primaryMuscle: 'Triceps', equipment: 'Bodyweight' },
  
  // Core exercises
  { name: 'Hanging Leg Raise', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Plank', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Crunches', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Russian Twist', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Mountain Climbers', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Leg Raises', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Ab Wheel Rollout', primaryMuscle: 'Core', equipment: 'Other' },
  { name: 'Cable Crunch', primaryMuscle: 'Core', equipment: 'Cable' },
  { name: 'Dead Bug', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Side Plank', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Bicycle Crunches', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  { name: 'Lying Leg Raise', primaryMuscle: 'Core', equipment: 'Bodyweight' },
  
  // Legs exercises
  { name: 'Back Squat', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Front Squat', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Leg Press', primaryMuscle: 'Legs', equipment: 'Machine' },
  { name: 'Romanian Deadlift', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Bulgarian Split Squat', primaryMuscle: 'Legs', equipment: 'Dumbbell' },
  { name: 'Lunges', primaryMuscle: 'Legs', equipment: 'Dumbbell' },
  { name: 'Leg Curl', primaryMuscle: 'Legs', equipment: 'Machine' },
  { name: 'Leg Extension', primaryMuscle: 'Legs', equipment: 'Machine' },
  { name: 'Calf Raise', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Goblet Squat', primaryMuscle: 'Legs', equipment: 'Dumbbell' },
  { name: 'Hack Squat', primaryMuscle: 'Legs', equipment: 'Machine' },
  { name: 'Walking Lunges', primaryMuscle: 'Legs', equipment: 'Dumbbell' },
  { name: 'Sumo Deadlift', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Hip Thrust', primaryMuscle: 'Legs', equipment: 'Barbell' },
  { name: 'Seated Calf Raise', primaryMuscle: 'Legs', equipment: 'Machine' },
  { name: 'Stiff Leg Deadlift', primaryMuscle: 'Legs', equipment: 'Barbell' }
];

async function ensureSeedExercises(db: SQLiteDatabase) {
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM exercises');
  if (!count || count.c > 0) return;
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const ex of seed) {
      await db.runAsync(
        'INSERT INTO exercises (id, userId, name, primaryMuscle, secondaryMuscles, equipment, unilateral, notes, archived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [nanoid(), 'local', ex.name, ex.primaryMuscle, null, ex.equipment ?? null, 0, null, 0, now, now]
      );
    }
  });
}


