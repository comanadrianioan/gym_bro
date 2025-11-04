import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, List, Switch } from 'react-native-paper';
import { getDb } from '../../src/db';
import { useAuth } from '../../src/context/AuthProvider';
import { exportJson, exportXlsx } from '../../src/services/export';
import { importJsonReplaceAll } from '../../src/services/import';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [unitKg, setUnitKg] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);

  useEffect(() => {
    const load = async () => {
      const db = await getDb();
      const row = await db.getFirstAsync<any>('SELECT unit, cloudSyncEnabled FROM app_settings WHERE id = ?', ['app-settings']);
      if (row) {
        setUnitKg(row.unit === 'kg');
        setCloudSync(!!row.cloudSyncEnabled);
      }
    };
    load();
  }, []);

  const updateSetting = async (field: 'unit' | 'cloudSyncEnabled', value: any) => {
    const db = await getDb();
    const now = new Date().toISOString();
    if (field === 'unit') {
      await db.runAsync('UPDATE app_settings SET unit = ?, updatedAt = ? WHERE id = ?', [value, now, 'app-settings']);
    } else {
      await db.runAsync('UPDATE app_settings SET cloudSyncEnabled = ?, updatedAt = ? WHERE id = ?', [value ? 1 : 0, now, 'app-settings']);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Units (kg/lb)"
          right={() => (
            <Switch
              value={unitKg}
              onValueChange={async (v) => {
                setUnitKg(v);
                await updateSetting('unit', v ? 'kg' : 'lb');
              }}
            />
          )}
        />
        <List.Item
          title="Cloud Sync"
          description="Mirror local data to Supabase"
          right={() => (
            <Switch
              value={cloudSync}
              onValueChange={async (v) => {
                setCloudSync(v);
                await updateSetting('cloudSyncEnabled', v);
              }}
            />
          )}
        />
      </List.Section>
      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item title="Export JSON" onPress={exportJson as any} />
        <List.Item title="Export Excel (.xlsx)" onPress={exportXlsx as any} />
        <List.Item title="Import JSON (replace all)" onPress={importJsonReplaceAll as any} />
      </List.Section>
      <View style={{ padding: 16 }}>
        <Button mode="outlined" onPress={signOut}>
          Sign out
        </Button>
      </View>
    </View>
  );
}


