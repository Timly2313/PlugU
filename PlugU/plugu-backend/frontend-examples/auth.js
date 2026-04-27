// PlugU - Auth Module (React Native / Expo)
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Sign up
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) throw error;
  return data;
}

// Sign in
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Update user location
export async function updateUserLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;

  const { coords } = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = coords;

  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      latitude,
      longitude,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
  return { latitude, longitude };
}
