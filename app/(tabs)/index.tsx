import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Button, Card, FAB, Text } from 'react-native-paper';
import { getDb } from '../../src/db';
import { nanoid } from '../../src/utils/uuid';
import { useAuth } from '../../src/context/AuthProvider';
import { useRouter } from 'expo-router';

type WorkoutRow = { id: string; date: string; title?: string | null };

export default function HomeScreen() {
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const { userId } = useAuth();
  const router = useRouter();

  const load = async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<WorkoutRow>(
      'SELECT id, date, title FROM workouts WHERE userId = ? ORDER BY date DESC LIMIT 50',
      [userId]
    );
    setWorkouts(rows);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const startWorkout = async () => {
    const db = await getDb();
    const id = nanoid();
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO workouts (id, userId, date, title, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, now, 'Workout', null, now, now]
    );
    await load();
    router.push(`/workout/${id}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: 12 }}
        data={workouts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ padding: 16 }}>No workouts yet.</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }} onPress={() => router.push(`/workout/${item.id}`)}>
            <Card.Title title={item.title ?? 'Workout'} subtitle={new Date(item.date).toLocaleString()} />
          </Card>
        )}
      />
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }} onPress={startWorkout} />
    </View>
  );
}


