import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase } from '@/lib/supabase'
import { errorHaptic, successHaptic, tapHaptic } from '@/lib/haptics'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmail = async () => {
    if (!email.trim() || !password) return
    tapHaptic()
    setLoading(true)
    try {
      const fn =
        mode === 'signin'
          ? supabase.auth.signInWithPassword({ email: email.trim(), password })
          : supabase.auth.signUp({ email: email.trim(), password })
      const { error } = await fn
      if (error) throw error
      successHaptic()
      // AuthGate in root layout will redirect to /(tabs) once session is set;
      // for signup we route to /setup so user picks solo vs org.
      if (mode === 'signup') {
        router.replace('/(public)/setup')
      }
    } catch (e) {
      errorHaptic()
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Connexion échouée')
    } finally {
      setLoading(false)
    }
  }

  const handleApple = async () => {
    tapHaptic()
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (!credential.identityToken) {
        throw new Error('Pas de token retourné par Apple')
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })
      if (error) throw error
      successHaptic()
      // New users land in setup; existing users skip directly to tabs via AuthGate
      router.replace('/(public)/setup')
    } catch (e) {
      // User cancelled — silent
      if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        return
      }
      errorHaptic()
      Alert.alert('Apple Sign In', e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pt-10 pb-8">
            {/* Back */}
            <Pressable onPress={() => router.back()} hitSlop={12} className="mb-8">
              <Text className="text-ink-muted text-sm">← Retour</Text>
            </Pressable>

            {/* Heading */}
            <Text className="text-ink text-3xl font-bold mb-2">
              {mode === 'signin' ? 'Connexion' : 'Créer mon compte'}
            </Text>
            <Text className="text-ink-muted text-base mb-10">
              {mode === 'signin'
                ? 'Retrouve tes projets et ton équipe.'
                : 'Démarre en 30 secondes. 14 jours gratuits.'}
            </Text>

            {/* Apple Sign In — iOS only, native button */}
            {Platform.OS === 'ios' && (
              <>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={16}
                  style={{ width: '100%', height: 56 }}
                  onPress={handleApple}
                />

                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-border" />
                  <Text className="text-ink-subtle text-xs mx-3 uppercase tracking-wider">
                    ou par email
                  </Text>
                  <View className="flex-1 h-px bg-border" />
                </View>
              </>
            )}

            {/* Email + password */}
            <View className="gap-3">
              <TextInput
                placeholder="email@exemple.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                className="bg-bg-elevated text-ink rounded-2xl px-4 h-14 text-base border border-border"
              />
              <TextInput
                placeholder="mot de passe"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="bg-bg-elevated text-ink rounded-2xl px-4 h-14 text-base border border-border"
              />
            </View>

            <Pressable
              onPress={handleEmail}
              disabled={loading || !email.trim() || password.length < 6}
              className="mt-5 bg-brand rounded-2xl h-14 items-center justify-center active:opacity-80 disabled:opacity-40"
            >
              <Text className="text-brand-contrast font-semibold text-base">
                {loading ? '…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
              </Text>
            </Pressable>

            {/* Switch mode */}
            <Pressable
              onPress={() => { tapHaptic(); setMode(mode === 'signin' ? 'signup' : 'signin') }}
              className="mt-6 items-center py-2"
            >
              <Text className="text-ink-muted text-sm">
                {mode === 'signin'
                  ? "Pas encore de compte ? Créer un compte"
                  : 'Déjà un compte ? Se connecter'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
