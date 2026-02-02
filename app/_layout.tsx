import { colors } from '@/src/theme/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NetworkProvider } from '../src/context/NetworkContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import './globals.css';

// Create a client
const queryClient = new QueryClient();

import { useNotifications } from '@/src/hooks/useNotifications';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  useNotifications(); // Initialize notifications
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // No session, redirect to welcome
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Has session, but currently in auth group, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.teal }}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2F1' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' }, 
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="link" options={{ headerShown: false }} />
        <Stack.Screen name="profile/index" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

import { DancingScript_400Regular, useFonts } from '@expo-google-fonts/dancing-script';
import { Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DancingScript': DancingScript_400Regular,
    'Outfit': Outfit_400Regular,
    'Outfit-Bold': Outfit_700Bold,
    'Quicksand': Quicksand_400Regular,
    'Quicksand-Medium': Quicksand_500Medium,
    'Quicksand-SemiBold': Quicksand_600SemiBold,
    'Quicksand-Bold': Quicksand_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Proceed even if fonts failed - better than blank screen
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

