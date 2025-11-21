import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      setAuth((prev) => ({
        ...prev,
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      }));

      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    };

    loadSession();

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuth({
          session,
          user: session?.user ?? null,
          profile: null,
          loading: false,
        });

        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch profile from your table
  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setAuth((prev) => ({ ...prev, profile: data }));
  };

  // EMAIL + PASSWORD LOGIN
  const login = async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
    });

      return { data, error };
    };

  // LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setAuth({
      user: null,
      session: null,
      profile: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, signUp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
