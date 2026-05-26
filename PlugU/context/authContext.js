import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState({
    user:             null,
    session:          null,
    isLoading:        true,
    isProfileLoading: false, // ← start false, only true when actively fetching
    isAuthenticated:  false,
  });

  const currentUserIdRef  = useRef(null);
  const profileFetchingRef = useRef(false); // ← prevent concurrent fetches

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setState((prev) => ({ ...prev, isProfileLoading: false }));
      return null;
    }

    // Prevent duplicate concurrent fetches for the same user
    if (profileFetchingRef.current) return null;
    profileFetchingRef.current = true;

    setState((prev) => ({ ...prev, isProfileLoading: true }));

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("Profile fetch error:", error.message);
        setProfile(null);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.log("Unexpected profile fetch error:", err.message);
      setProfile(null);
      return null;
    } finally {
      // Always resolve — no more stuck loading state
      profileFetchingRef.current = false;
      setState((prev) => ({ ...prev, isProfileLoading: false }));
    }
  }, []);

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    if (!currentUserIdRef.current) throw new Error("No user logged in");
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", currentUserIdRef.current)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      return { data: null, error };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // ── Refresh profile ────────────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (currentUserIdRef.current) {
      profileFetchingRef.current = false; // allow re-fetch on manual refresh
      await fetchProfile(currentUserIdRef.current);
    }
  }, [fetchProfile]);

  // ── Initialize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.log("Session error:", error.message);

        const session    = data?.session;
        const userId     = session?.user?.id || null;
        currentUserIdRef.current = userId;

        // Set auth state first — profile loading handled by fetchProfile
        setState({
          session,
          user:             session?.user || null,
          isAuthenticated:  !!session,
          isLoading:        false,
          isProfileLoading: !!userId, // true only if we have a user to fetch
        });

        if (userId) {
          await fetchProfile(userId);
        }
      } catch (err) {
        console.log("Init error:", err.message);
        setState((prev) => ({
          ...prev,
          isLoading:        false,
          isProfileLoading: false,
        }));
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const incomingUserId = session?.user?.id || null;
        const isSameUser     = incomingUserId && incomingUserId === currentUserIdRef.current;
        currentUserIdRef.current = incomingUserId;

        if (!session) {
          // Signed out — clear everything immediately
          setProfile(null);
          profileFetchingRef.current = false;
          setState({
            session:          null,
            user:             null,
            isAuthenticated:  false,
            isLoading:        false,
            isProfileLoading: false,
          });
          return;
        }

        setState((prev) => ({
          ...prev,
          session,
          user:             session.user,
          isAuthenticated:  true,
          isLoading:        false,
          // Only show profile loading if it's a new user
          isProfileLoading: !isSameUser,
        }));

        if (!isSameUser) {
          profileFetchingRef.current = false; // reset so new user can fetch
          await fetchProfile(incomingUserId);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth methods ───────────────────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setState((prev) => ({ ...prev, isLoading: false }));
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password, fullName }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, username: email.split("@")[0] } },
      });
      if (error) throw error;
      return data;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "plugu://reset-password",
    });
    if (error) throw error;
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    const session = data.session;
    setState((prev) => ({
      ...prev,
      session,
      user:            session?.user || null,
      isAuthenticated: !!session,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn, signUp, signOut,
        resetPassword, updatePassword, refreshSession,
        profile, updateProfile, refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export default AuthContext;