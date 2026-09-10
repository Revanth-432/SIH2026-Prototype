import './global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { useAuthStore } from '../src/store/useAuthStore';
import { supabase } from '../src/lib/supabase';

// Disable react-freeze globally to permanently prevent touch freeze / unresponsive screens on Android
enableScreens(true);
enableFreeze(false);

export default function RootLayout() {
  const { session, role, hasCompletedOnboarding, isLoading, setSession, setLoading } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Synchronize Supabase authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  // 2. Navigation protection guard
  useEffect(() => {
    if (isLoading || !role) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = (segments as string[]).includes('onboarding');
    const isBuyer = role === 'BUYER' || role === 'B2B_BUYER';
    const subRoute = (segments as string[])[1];

    if (!session && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      router.replace('/(auth)/login');
    } else if (session) {
      if (!hasCompletedOnboarding) {
        // Authenticated user has not finished onboarding -> send to onboarding
        if (!isOnboarding) {
          router.replace('/(auth)/onboarding');
        }
      } else if (inAuthGroup) {
        // Authenticated & onboarded user inside auth screens -> route to respective home
        if (isBuyer) {
          router.replace('/(app)/buyer/feed');
        } else {
          router.replace('/(app)/dashboard');
        }
      } else if (segments[0] === '(app)') {
        // Strict boundary: prevent Seller from being in Buyer tabs and vice-versa
        if (!isBuyer && (subRoute === 'buyer' || subRoute === 'cart' || subRoute === 'buyer-orders')) {
          router.replace('/(app)/dashboard');
        } else if (isBuyer && (subRoute === 'dashboard' || subRoute === 'catalog' || subRoute === 'orders' || subRoute === 'capture' || subRoute === 'product')) {
          router.replace('/(app)/buyer/feed');
        }
      }
    }
  }, [session, role, hasCompletedOnboarding, isLoading, segments]);


  // Loading state with high-contrast, clean low-literacy indicator
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-artisan-canvas px-6">
        <StatusBar style="dark" />
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-artisan-primary shadow-md">
          <Text className="text-3xl font-bold text-white">कला</Text>
        </View>
        <Text className="mt-6 text-2xl font-bold text-artisan-slate">
          KalaSangam
        </Text>
        <Text className="mt-1 text-base text-artisan-muted">
          कला संगम • Artisan Platform
        </Text>
        <ActivityIndicator
          size="large"
          color="#C85A32"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          freezeOnBlur: false,
          contentStyle: { backgroundColor: '#FAF8F5' },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
