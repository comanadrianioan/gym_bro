import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  FAB,
  List,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { getDb } from '../../src/db';
import { useAuth } from '../../src/context/AuthProvider';
import { nanoid } from '../../src/utils/uuid';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type WorkoutExerciseRow = { id: string; name: string; notes?: string | null };
type SetRow = { id: string; setNumber: number; weight: number; reps: number; rpe?: number | null; felt?: string | null };
type ExerciseRow = { id: string; name: string };

const setSchema = z.object({
  weight: z.coerce.number().min(0),
  reps: z.coerce.number().min(1),
  rpe: z.coerce.number().min(1).max(10).optional().or(z.literal(NaN)),
  felt: z.string().optional(),
});

type SetForm = {
  weight: number;
  reps: number;
  rpe?: number;
  felt?: string;
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [exercises, setExercises] = useState<WorkoutExerciseRow[]>([]);
  const [setsByWe, setSetsByWe] = useState<Record<string, SetRow[]>>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);

  // Exercise picker dialog
  const [exerciseDialogVisible, setExerciseDialogVisible] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseRow[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseRow[]>([]);
  const [search, setSearch] = useState('');

  const { control, handleSubmit, reset } = useForm<SetForm>({
    resolver: zodResolver(setSchema),
  });

  const load = async () => {
    const db = await getDb();
    const exs = await db.getAllAsync<WorkoutExerciseRow>(
      `SELECT we.id, e.name, we.notes 
       FROM workout_exercises we 
       JOIN exercises e ON e.id = we.exerciseId 
       WHERE we.workoutId = ? 
       ORDER BY we."order" ASC`,
      [id]
    );
    const map: Record<string, SetRow[]> = {};
    for (const we of exs) {
      map[we.id] = await db.getAllAsync<SetRow>(
        'SELECT id, setNumber, weight, reps, rpe, felt FROM sets WHERE workoutExerciseId = ? ORDER BY setNumber ASC',
        [we.id]
      );
    }
    setExercises(exs);
    setSetsByWe(map);
  };

  useEffect(() => {
    load();
  }, [id]);

  // Open dialog with all exercises
  const openExerciseDialog = async () => {
    const db = await getDb();
    const exs = await db.getAllAsync<ExerciseRow>('SELECT id, name FROM exercises ORDER BY name ASC');
    setAllExercises(exs);
    setFilteredExercises(exs);
    setSearch('');
    setExerciseDialogVisible(true);
  };

  // Filter exercises as user types
  useEffect(() => {
    const filtered = allExercises.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [search, allExercises]);

  // Add selected exercise to workout
  const handleSelectExercise = async (exerciseId: string) => {
    setExerciseDialogVisible(false);
    const db = await getDb();
    const now = new Date().toISOString();
    const weId = nanoid();
    await db.runAsync(
      'INSERT INTO workout_exercises (id, userId, workoutId, exerciseId, "order", notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [weId, userId, id, exerciseId, exercises.length + 1, null, now, now]
    );
    await load();
  };

  const onAddSet = async (values: SetForm) => {
    if (!addingFor) return;
    const db = await getDb();
    const now = new Date().toISOString();
    const current = setsByWe[addingFor] ?? [];
    await db.runAsync(
      'INSERT INTO sets (id, userId, workoutExerciseId, setNumber, weight, reps, rpe, felt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nanoid(), userId, addingFor, current.length + 1, values.weight, values.reps, values.rpe ?? null, values.felt ?? null, now, now]
    );
    setAddingFor(null);
    reset({ weight: 0, reps: 1, rpe: undefined, felt: '' });
    await load();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 🔙 Top Appbar with Back button */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Workout Details" />
      </Appbar.Header>

      {/* Workout content */}
      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <Card.Title title={item.name} />
            <Card.Content>
              {(setsByWe[item.id] ?? []).map((s) => (
                <Text key={s.id}>
                  Set {s.setNumber}: {s.weight} kg × {s.reps}
                  {s.rpe ? ` RPE ${s.rpe}` : ''}
                  {s.felt ? ` • ${s.felt}` : ''}
                </Text>
              ))}
              <Button onPress={() => setAddingFor(item.id)}>Add set</Button>
            </Card.Content>
          </Card>
        )}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={openExerciseDialog}
      />

      <Portal>
        {/* Add Set Dialog */}
        <Dialog visible={!!addingFor} onDismiss={() => setAddingFor(null)}>
          <Dialog.Title>Add Set</Dialog.Title>
          <Dialog.Content>
            <Controller
              control={control}
              name="weight"
              defaultValue={0}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Weight (kg)"
                  keyboardType="decimal-pad"
                  value={String(value)}
                  onChangeText={(t) => onChange(Number(t))}
                />
              )}
            />
            <Controller
              control={control}
              name="reps"
              defaultValue={1}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Reps"
                  keyboardType="number-pad"
                  value={String(value)}
                  onChangeText={(t) => onChange(Number(t))}
                />
              )}
            />
            <Controller
              control={control}
              name="rpe"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="RPE (1-10)"
                  keyboardType="decimal-pad"
                  value={value ? String(value) : ''}
                  onChangeText={(t) => onChange(t ? Number(t) : undefined)}
                />
              )}
            />
            <Controller
              control={control}
              name="felt"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Felt"
                  value={value ?? ''}
                  onChangeText={onChange}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSubmit(onAddSet)}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Select Exercise Dialog */}
        <Dialog
          visible={exerciseDialogVisible}
          onDismiss={() => setExerciseDialogVisible(false)}
        >
          <Dialog.Title>Select Exercise</Dialog.Title>
          <Dialog.Content style={{ maxHeight: 400 }}>
            <TextInput
              label="Search exercises..."
              value={search}
              onChangeText={setSearch}
              style={{ marginBottom: 8 }}
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  onPress={() => handleSelectExercise(item.id)}
                />
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExerciseDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}