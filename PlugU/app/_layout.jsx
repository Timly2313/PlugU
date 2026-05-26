import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/authContext";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncPersister } from "../lib/queryClient";
import OnboardingScreen from "./OnboardingScreen";

function AppContent() {
  const {
    isAuthenticated,
    isLoading,
    isProfileLoading,
    profile,
    refreshProfile,
  } = useAuth();

  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait for both loading states to finish
    if (isLoading || isProfileLoading) return;

    const inTabsGroup   = segments[0] === "(tabs)";
    const inPublicRoute =
      segments[0] === "LoginScreen"  ||
      segments[0] === "SignUpScreen"  ||
      segments[0] === "index"         ||
      segments[0] === undefined;      // bare root

    if (!isAuthenticated) {
      // Not logged in — only redirect away from protected tabs
      if (inTabsGroup) router.replace("/LoginScreen");
      return;
    }

    // Logged in but profile not loaded yet — wait
    if (!profile) return;

    if (!profile.onboarding_completed) {
      // Onboarding handled by render below — don't route, just let it render
      return;
    }

    // Fully authenticated + onboarded — only redirect if on a public/root route
    if (inPublicRoute) {
      router.replace("/(tabs)/HomeScreen");
    }
  }, [isAuthenticated, isLoading, isProfileLoading, profile, segments]);

  // ── Full screen loading (session check) ────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  // ── Not authenticated — render login/signup routes ─────────────────────────
  if (!isAuthenticated) return <Slot />;

  // ── Profile loading ────────────────────────────────────────────────────────
  if (isProfileLoading || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={{ marginTop: 12 }}>Loading profile...</Text>
      </View>
    );
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (!profile.onboarding_completed) {
    return (
      <OnboardingScreen
        onComplete={refreshProfile}
        onSkip={refreshProfile}
      />
    );
  }

  // ── Authenticated + onboarded ──────────────────────────────────────────────
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