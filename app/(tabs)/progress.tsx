import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';
import { getDb } from '../../src/db';

type Point = { x: Date; y: number };

export default function ProgressScreen() {
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const load = async () => {
      const db = await getDb();
      const rows = await db.getAllAsync<{ date: string; volume: number }>(
        `SELECT date(date) as date, SUM(weight*reps) as volume FROM sets s
         JOIN workout_exercises we ON we.id = s.workoutExerciseId
         JOIN workouts w ON w.id = we.workoutId
         GROUP BY date(date)
         ORDER BY date(date)`
      );
      setPoints(rows.map((r) => ({ x: new Date(r.date), y: r.volume })));
    };
    load();
  }, []);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>
        Volume Over Time
      </Text>
      <VictoryChart theme={VictoryTheme.material}>
        <VictoryLine data={points} interpolation="monotoneX" />
      </VictoryChart>
    </View>
  );
}


