import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Flag to track if initial session has been loaded
let isInitialized = false;

export const markSupabaseInitialized = () => {
  isInitialized = true;
};

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. We delay this until after initial
// session check to prevent race conditions on cold start.
AppState.addEventListener('change', (state: AppStateStatus) => {
  // Only start auto-refresh after the app has initialized
  if (!isInitialized) return;
  
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
