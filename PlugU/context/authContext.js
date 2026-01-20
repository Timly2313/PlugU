import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------------------------- */
  /* Load initial session */
  /* ---------------------------------- */
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ---------------------------------- */
  /* Fetch profile */
  /* ---------------------------------- */
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error) {
      setProfile(data);
    }
  }, []);

  /* 🔹 NEW: refresh profile manually */
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  /* 🔹 OPTIONAL: optimistic profile update */
  const setProfileOptimistic = useCallback((updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  /* ---------------------------------- */
  /* Auth actions */
  /* ---------------------------------- */
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  /* ---------------------------------- */
  /* Context value */
  /* ---------------------------------- */
  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,

      login,
      signUp,
      logout,

      refreshProfile,          // ✅ NEW
      setProfileOptimistic,    // ✅ OPTIONAL

      isAuthenticated: !!user,
    }),
    [
      session,
      user,
      profile,
      loading,
      login,
      signUp,
      logout,
      refreshProfile,
      setProfileOptimistic,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* ---------------------------------- */
/* Custom hook */
 /* ---------------------------------- */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
