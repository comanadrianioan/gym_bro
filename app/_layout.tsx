import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider } from '../src/providers/AppProvider';
import { useAuth } from '../src/context/AuthProvider';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { sessionChecked, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!sessionChecked) return;
    if (!session) {
      router.replace('/(auth)/login');
    }
  }, [sessionChecked, session]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[id]" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
    </AppProvider>
  );
}


