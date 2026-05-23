import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/authContext";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncPersister } from "../lib/queryClient"; // ← add asyncPersister
import OnboardingScreen from "./OnboardingScreen";

function AppContent() {
  const { isAuthenticated, isLoading, isProfileLoading, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || isProfileLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (isAuthenticated && profile?.onboarding_completed) {
      if (!inAuthGroup) router.replace("/(tabs)/HomeScreen");
    } else if (!isAuthenticated) {
      if (inAuthGroup) router.replace("/LoginScreen");
    }
  }, [isAuthenticated, isLoading, isProfileLoading, profile]);

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
        buster: "", // bump to a new string (e.g. app version) to wipe cache on update
      }}
      onSuccess={() => console.log("[QueryCache] Restored from storage")}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}