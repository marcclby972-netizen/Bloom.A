import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/lib/auth'
import '@/global.css'

/**
 * Root layout — wraps the entire app with:
 * - GestureHandler / SafeAreaProvider (required by expo-router on iOS)
 * - AuthProvider (Supabase session)
 * - AuthGate (redirects between (public) and (tabs) based on auth)
 *
 * Dark mode is the default per the brief.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

/**
 * Watches the current segment + auth state and redirects accordingly.
 * - Unauthed user in /(tabs) → push to /welcome
 * - Authed user in /(public) → push to /(tabs)
 */
function AuthGate() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(tabs)'
    const inPublicGroup = segments[0] === '(public)'

    if (!user && inAuthGroup) {
      router.replace('/(public)/welcome')
    } else if (user && (inPublicGroup || segments.length === 0)) {
      router.replace('/(tabs)')
    }
  }, [user, loading, segments, router])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0B0B0F' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
