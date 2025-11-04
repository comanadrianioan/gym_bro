import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { z } from 'zod';
import { getDb } from '../db';

const tableSchema = z.object({
  exercises: z.array(z.any()),
  workouts: z.array(z.any()),
  workout_exercises: z.array(z.any()),
  sets: z.array(z.any()),
  app_settings: z.array(z.any()),
});

export async function importJsonReplaceAll() {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return false;
  const file = res.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri);
  const json = JSON.parse(content);
  const parsed = tableSchema.safeParse(json);
  if (!parsed.success) throw new Error('Invalid JSON backup');
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM sets; DELETE FROM workout_exercises; DELETE FROM workouts; DELETE FROM exercises; DELETE FROM app_settings;');
    const now = new Date().toISOString();
    for (const t of parsed.data.exercises) {
      await db.runAsync(
        'INSERT INTO exercises (id, userId, name, primaryMuscle, secondaryMuscles, equipment, unilateral, notes, archived, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.userId ?? 'local', t.name, t.primaryMuscle, t.secondaryMuscles ? JSON.stringify(t.secondaryMuscles) : null, t.equipment ?? null, t.unilateral ? 1 : 0, t.notes ?? null, t.archived ? 1 : 0, t.createdAt ?? now, t.updatedAt ?? now]
      );
    }
    for (const t of parsed.data.workouts) {
      await db.runAsync(
        'INSERT INTO workouts (id, userId, date, title, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.userId ?? 'local', t.date, t.title ?? null, t.notes ?? null, t.createdAt ?? now, t.updatedAt ?? now]
      );
    }
    for (const t of parsed.data.workout_exercises) {
      await db.runAsync(
        'INSERT INTO workout_exercises (id, userId, workoutId, exerciseId, "order", notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.userId ?? 'local', t.workoutId, t.exerciseId, t.order ?? 1, t.notes ?? null, t.createdAt ?? now, t.updatedAt ?? now]
      );
    }
    for (const t of parsed.data.sets) {
      await db.runAsync(
        'INSERT INTO sets (id, userId, workoutExerciseId, setNumber, weight, reps, rpe, felt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.id, t.userId ?? 'local', t.workoutExerciseId, t.setNumber, t.weight, t.reps, t.rpe ?? null, t.felt ?? null, t.createdAt ?? now, t.updatedAt ?? now]
      );
    }
    for (const t of parsed.data.app_settings) {
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (id, userId, unit, theme, cloudSyncEnabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.id ?? 'app-settings', t.userId ?? 'local', t.unit ?? 'kg', t.theme ?? 'system', t.cloudSyncEnabled ? 1 : 0, t.createdAt ?? now, t.updatedAt ?? now]
      );
    }
  });
  return true;
}


