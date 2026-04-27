import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnboardingScreen from "./OnboardingScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, isProfileLoading, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (isAuthenticated && profile?.onboarding_completed) {
      // Authenticated + onboarding done → push to home if not already there
      if (!inAuthGroup) {
        router.replace("/(tabs)/HomeScreen");
      }
    } else if (!isAuthenticated) {
      // Not authenticated → push to login if not already on an auth screen
      if (inAuthGroup) {
        router.replace("/LoginScreen");
      }
    }
  }, [isAuthenticated, isLoading, isProfileLoading, profile]);

  // 1. Auth loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  // 2. Not authenticated → render auth screens (login/signup) via Slot
  if (!isAuthenticated) {
    return <Slot />;
  }

  // 3. Authenticated but profile still loading
  if (isProfileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  // 4. Onboarding not completed
  if (!profile?.onboarding_completed) {
    return (
      <OnboardingScreen
        onComplete={refreshProfile}
        onSkip={refreshProfile}
      />
    );
  }

  // 5. Fully ready → render main app
  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}