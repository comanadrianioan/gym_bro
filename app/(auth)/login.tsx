import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupabaseClient } from '../../src/supabase';
import { useRouter } from 'expo-router';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const { control, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (err) setError(err.message);
    if (data?.session) router.replace('/(tabs)');
    setLoading(false);
  };

  const onMagic = async () => {
    const email = (await control.getValues().email) as string | undefined;
    if (!email) {
      setError('Enter email for magic link');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) setError(err.message);
    else setError('Magic link sent. Check your inbox.');
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 12 }}>
      <Text variant="headlineMedium">LiftLog Mobile</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput label="Password" secureTextEntry value={value} onChangeText={onChange} />
        )}
      />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      <Button mode="contained" loading={loading} onPress={handleSubmit(onSubmit)}>
        Sign in
      </Button>
      <Button onPress={onMagic} disabled={loading}>Send magic link</Button>
      <Button onPress={() => router.replace('/(tabs)')}>Continue offline</Button>
    </View>
  );
}