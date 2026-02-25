import React, { createContext, useContext, useEffect, useState } from "react";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const [locationState, setLocationState] = useState({
    permission: "unknown", // "granted" | "denied"
    coords: null,
  });

  /* ------------------------------------------------ */
  /* 📍 GET USER LOCATION */
  /* ------------------------------------------------ */
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setLocationState({
        permission: "denied",
        coords: null,
      });
      return false;
    }

    const location = await Location.getCurrentPositionAsync({});

    setLocationState({
      permission: "granted",
      coords: location.coords,
    });

    return true;
  };

  /* ------------------------------------------------ */
  /* 🔐 SESSION HANDLING */
  /* ------------------------------------------------ */
  useEffect(() => {
    const initializeApp = async () => {
      // Restore session
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      setState((prev) => ({
        ...prev,
        session,
        user: session?.user || null,
        isAuthenticated: !!session,
        isLoading: false,
      }));

      // Ask for location immediately
      await requestLocationPermission();
    };

    initializeApp();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user || null,
        isAuthenticated: !!session,
        isLoading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);
  /* ------------------------------------------------ */
  /* 📍 UPDATE LOCATION AFTER LOGIN */
  /* ------------------------------------------------ */
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateLocation = async () => {
      try {
        const coords = await getUserLocation();

        await supabase.rpc("update_user_location", {
          lat: coords.latitude,
          lng: coords.longitude,
        });
      } catch (err) {
        console.log("Location update failed:", err.message);
      }
    };

    updateLocation();
  }, [state.isAuthenticated]);

  /* ------------------------------------------------ */
  /* 🔓 SIGN IN */
  /* ------------------------------------------------ */
  const signIn = async (credentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    setState((prev) => ({ ...prev, isLoading: false }));

    if (error) throw error;
  };

  /* ------------------------------------------------ */
  /* 🆕 SIGN UP (WITH LOCATION METADATA) */
  /* ------------------------------------------------ */
  const signUp = async (credentials) => {
    if (locationState.permission !== "granted") {
      throw new Error("Location permission is required to use PlugU.");
    }

    if (!locationState.coords) {
      throw new Error("Unable to get your location. Please try again.");
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName,
            username: credentials.email.split("@")[0],
            latitude: locationState.coords.latitude,
            longitude: locationState.coords.longitude,
          },
        },
      });

      if (error) throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };
  /* ------------------------------------------------ */
  /* 🚪 SIGN OUT */
  /* ------------------------------------------------ */
  const signOutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /* ------------------------------------------------ */
  /* 🔑 PASSWORD RESET */
  /* ------------------------------------------------ */
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "plugu://reset-password",
    });

    if (error) throw error;
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;

    const session = data.session;

    setState((prev) => ({
      ...prev,
      session,
      user: session?.user || null,
      isAuthenticated: !!session,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut: signOutUser,
        resetPassword,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;