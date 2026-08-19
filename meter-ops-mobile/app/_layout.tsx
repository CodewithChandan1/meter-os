import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { MeterProvider, useMeters } from '@/context/MeterContext';

import { ToastProvider } from '@/context/ToastContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore splash error */
});

const queryClient = new QueryClient();

import { Pressable, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

function HeaderProfileRight() {
  const colors = useColors();
  return (
    <Pressable
      testID="header-profile-native"
      onPress={() => router.push('/(tabs)/profile')}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      }}
    >
      <Text style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: '700' }}>CM</Text>
    </Pressable>
  );
}

function RootLayoutNav() {
  const { user, isHydrated } = useMeters();

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/auth/sign-in');
    }
  }, [isHydrated, user]);

  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="meter/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="meter/assign" options={{ headerShown: true, title: 'Assign Meter', presentation: 'modal', headerRight: () => <HeaderProfileRight /> }} />
      <Stack.Screen name="meter/install" options={{ headerShown: true, title: 'Install Meter', presentation: 'modal', headerRight: () => <HeaderProfileRight /> }} />
      <Stack.Screen name="meter/cancel" options={{ headerShown: true, title: 'Cancel Meter', presentation: 'formSheet' }} />
      <Stack.Screen name="meter/add-standard" options={{ headerShown: true, title: 'Add Standard Meter', headerRight: () => <HeaderProfileRight /> }} />
      <Stack.Screen name="meter/add-temp" options={{ headerShown: true, title: 'Add Temporary Meter', headerRight: () => <HeaderProfileRight /> }} />
      <Stack.Screen name="meter/add-choice" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications', presentation: 'modal' }} />
      <Stack.Screen name="chat" options={{ headerShown: true, title: 'Chat', headerRight: () => <HeaderProfileRight /> }} />
      <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="auth/security-setup" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

import { CustomSplashScreen } from '@/components/CustomSplashScreen';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <CustomSplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MeterProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ToastProvider>
                  <RootLayoutNav />
                </ToastProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </MeterProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
