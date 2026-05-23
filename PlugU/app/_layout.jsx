import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/authContext";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncPersister } from "../lib/queryClient";
import OnboardingScreen from "./OnboardingScreen";

function AppContent() {
  const { isAuthenticated, isLoading, isProfileLoading, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inLoginScreen = segments[0] === "LoginScreen";

    if (isAuthenticated && profile?.onboarding_completed) {
      // Authenticated + onboarded → go to home
      if (!inAuthGroup) router.replace("/(tabs)/HomeScreen");
    } else if (isAuthenticated && !profile?.onboarding_completed) {
      // Authenticated but not onboarded → ensure we're not stuck in tabs or login
      if (inAuthGroup || inLoginScreen) router.replace("/");
    } else if (!isAuthenticated) {
      // Not authenticated → go to login
      if (inAuthGroup) router.replace("/LoginScreen");
    }
  }, [isAuthenticated, isLoading, isProfileLoading, profile, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return <Slot />;

  if (isProfileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile?.onboarding_completed) {
    return <OnboardingScreen onComplete={refreshProfile} onSkip={refreshProfile} />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncPersister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: "",
      }}
      onSuccess={() => console.log("[QueryCache] Restored from storage")}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}