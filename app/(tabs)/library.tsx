import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Searchbar, Chip, Card, Text } from 'react-native-paper';
import { getDb } from '../../src/db';
import { MuscleGroup } from '../../src/types';

const GROUPS: MuscleGroup[] = ['Back', 'Shoulders', 'Chest', 'Biceps', 'Triceps', 'Core', 'Legs'];

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[Library] Starting to load exercises...');
      console.log('[Library] Getting database...');
      const db = await getDb();
      console.log('[Library] Database obtained, querying...');
      const params: any[] = [];
      let sql = 'SELECT * FROM exercises WHERE archived IS NULL OR archived = 0';
      if (group) {
        sql += ' AND primaryMuscle = ?';
        params.push(group);
      }
      if (query) {
        sql += ' AND name LIKE ?';
        params.push(`%${query}%`);
      }
      sql += ' ORDER BY name ASC LIMIT 200';
      console.log('[Library] Executing query:', sql, params);
      const rows = await db.getAllAsync<any>(sql, params);
      console.log('[Library] Query result:', rows.length, 'exercises');
      setData(rows);
    } catch (err) {
      console.error('[Library] Error loading exercises:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [group, query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, gap: 8 }}>
        <Searchbar placeholder="Search exercises" value={query} onChangeText={setQuery} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GROUPS.map((g) => (
            <Chip key={g} selected={group === g} onPress={() => setGroup(group === g ? null : g)}>
              {g}
            </Chip>
          ))}
        </View>
      </View>
      {error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red', marginBottom: 8 }}>Error: {error}</Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>Check the browser console for details.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={data}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            <Text style={{ padding: 16 }}>
              {loading ? 'Loading exercises...' : 'No exercises found.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }}>
              <Card.Title title={item.name} subtitle={`${item.primaryMuscle}${item.equipment ? ' • ' + item.equipment : ''}`} />
            </Card>
          )}
        />
      )}
    </View>
  );
}


