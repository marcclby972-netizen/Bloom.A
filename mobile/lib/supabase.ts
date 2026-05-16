import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

/**
 * Supabase client for the mobile app.
 *
 * Uses the same project as the web app — auth, RLS, and database are shared.
 * Env vars are loaded via Expo Constants (set EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env).
 *
 * Sessions are persisted in AsyncStorage so the user stays signed in across
 * app restarts. Auto-refresh is enabled so the token rotates in the background.
 */

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra?.supabaseUrl || ''
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra?.supabaseAnonKey || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Don't throw — we want the app to boot and show a friendly error.
  console.warn(
    '[Bloom] Supabase env vars missing. Add EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env to enable auth.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // mobile uses deep links, not URL fragments
  },
})
