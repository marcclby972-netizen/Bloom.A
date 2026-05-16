import { useState } from 'react'
import { View, Text, Pressable, Alert, TextInput, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { errorHaptic, successHaptic, tapHaptic } from '@/lib/haptics'

type Mode = 'solo' | 'team' | null

export default function Setup() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(null)
  const [orgName, setOrgName] = useState('')
  const [invites, setInvites] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)

  const addInvite = () => {
    tapHaptic()
    setInvites((prev) => [...prev, ''])
  }
  const updateInvite = (i: number, v: string) =>
    setInvites((prev) => prev.map((e, idx) => (idx === i ? v : e)))

  const finish = async () => {
    tapHaptic()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pas de session active')

      if (mode === 'team') {
        // Create organization row (table: organizations { id, name, created_by, created_at })
        const { data: org, error: orgErr } = await supabase
          .from('organizations')
          .insert({ name: orgName.trim() || 'Mon organisation', created_by: user.id })
          .select()
          .single()
        if (orgErr) throw orgErr

        // Add self as founder member
        await supabase.from('organization_members').insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'founder',
          status: 'active',
        })

        // Queue email invites (table: organization_invites { org_id, email, role })
        const validInvites = invites.map((e) => e.trim()).filter(Boolean)
        if (validInvites.length > 0) {
          await supabase.from('organization_invites').insert(
            validInvites.map((email) => ({
              organization_id: org.id,
              email,
              role: 'collaborator',
              invited_by: user.id,
            }))
          )
        }
      }

      // Mark onboarded in user metadata so we don't re-show this screen
      await supabase.auth.updateUser({
        data: { onboarded: true, mode: mode || 'solo' },
      })

      successHaptic()
      router.replace('/(tabs)')
    } catch (e) {
      errorHaptic()
      Alert.alert(
        'Configuration',
        e instanceof Error ? e.message : 'Erreur lors de la création'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-10 pb-8">
          <Text className="text-ink text-3xl font-bold mb-2">Une dernière question.</Text>
          <Text className="text-ink-muted text-base mb-10">
            Tu utilises Bloom seul, ou avec des associés ?
          </Text>

          {/* Mode picker */}
          <View className="gap-3 mb-8">
            <Pressable
              onPress={() => { tapHaptic(); setMode('solo') }}
              className={
                'rounded-2xl p-5 border ' +
                (mode === 'solo' ? 'border-brand bg-brand-subtle' : 'border-border bg-bg-elevated')
              }
            >
              <Text className="text-3xl mb-2">👤</Text>
              <Text className="text-ink text-lg font-semibold mb-1">Seul</Text>
              <Text className="text-ink-muted text-sm">
                Pour suivre mon temps, mes projets et mes revenus en freelance.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { tapHaptic(); setMode('team') }}
              className={
                'rounded-2xl p-5 border ' +
                (mode === 'team' ? 'border-brand bg-brand-subtle' : 'border-border bg-bg-elevated')
              }
            >
              <Text className="text-3xl mb-2">🤝</Text>
              <Text className="text-ink text-lg font-semibold mb-1">Avec des associés</Text>
              <Text className="text-ink-muted text-sm">
                Pour piloter une équipe — contributions visibles, votes, journal immuable.
              </Text>
            </Pressable>
          </View>

          {/* Team-only fields */}
          {mode === 'team' && (
            <View className="mb-8">
              <Text className="text-ink-muted uppercase tracking-wider text-xs mb-2">
                Nom de l&apos;organisation
              </Text>
              <TextInput
                placeholder="ex : Bloom"
                placeholderTextColor="#6B7280"
                value={orgName}
                onChangeText={setOrgName}
                className="bg-bg-elevated text-ink rounded-2xl px-4 h-14 text-base border border-border mb-6"
              />

              <Text className="text-ink-muted uppercase tracking-wider text-xs mb-2">
                Inviter des co-fondateurs <Text className="text-ink-subtle normal-case">(optionnel)</Text>
              </Text>
              <View className="gap-2">
                {invites.map((email, i) => (
                  <TextInput
                    key={i}
                    placeholder="email@exemple.com"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={(v) => updateInvite(i, v)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="bg-bg-elevated text-ink rounded-2xl px-4 h-14 text-base border border-border"
                  />
                ))}
              </View>
              <Pressable onPress={addInvite} className="mt-3 self-start py-2 px-4 rounded-full bg-bg-subtle">
                <Text className="text-ink-muted text-xs">+ Ajouter un co-fondateur</Text>
              </Pressable>
            </View>
          )}

          {/* CTA */}
          <Pressable
            onPress={finish}
            disabled={!mode || saving || (mode === 'team' && !orgName.trim())}
            className="bg-brand rounded-2xl h-14 items-center justify-center active:opacity-80 disabled:opacity-40"
          >
            <Text className="text-brand-contrast font-semibold text-base">
              {saving ? '…' : "Terminer"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
