import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { utils, write } from 'xlsx';
import { getDb } from '../db';

async function queryAll() {
  const db = await getDb();
  const exercises = await db.getAllAsync('SELECT * FROM exercises');
  const workouts = await db.getAllAsync('SELECT * FROM workouts');
  const workout_exercises = await db.getAllAsync('SELECT * FROM workout_exercises');
  const sets = await db.getAllAsync('SELECT * FROM sets');
  const app_settings = await db.getAllAsync('SELECT * FROM app_settings');
  return { exercises, workouts, workout_exercises, sets, app_settings };
}

export async function exportJson() {
  const data = await queryAll();
  const uri = FileSystem.cacheDirectory + `liftlog-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  return uri;
}

export async function exportXlsx() {
  const data = await queryAll();
  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.json_to_sheet(data.exercises), 'exercises');
  utils.book_append_sheet(wb, utils.json_to_sheet(data.workouts), 'workouts');
  utils.book_append_sheet(wb, utils.json_to_sheet(data.workout_exercises), 'workout_exercises');
  utils.book_append_sheet(wb, utils.json_to_sheet(data.sets), 'sets');
  utils.book_append_sheet(wb, utils.json_to_sheet(data.app_settings), 'app_settings');
  const wbout = write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.cacheDirectory + `liftlog-export-${Date.now()}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
  return uri;
}


