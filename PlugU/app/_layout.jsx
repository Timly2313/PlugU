import React from "react";
import { View, Text, Button } from "react-native";
import { Slot } from "expo-router";
import { AuthProvider, useAuth } from "../context/authContext";
import LocationPermissionScreen from "./LocationPermissionScreen";

function AppContent() {
  const { locationState } = useAuth();

  // Safety check
  if (!locationState) return null;

  if (locationState.permission === "denied") {
    return <LocationPermissionScreen />;
  }

  if (locationState.permission === "unknown") {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}