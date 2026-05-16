import { View, Text, Pressable, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { tapHaptic, errorHaptic } from '@/lib/haptics'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Tu seras déconnecté de ce compte.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          errorHaptic()
          await signOut()
        },
      },
    ])
  }

  const initial = (user?.email || '?')[0]?.toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-4 pb-3">
          <Text className="text-ink text-2xl font-bold">Profil</Text>
        </View>

        {/* User card */}
        <View className="px-5 mb-4">
          <View className="bg-bg-elevated rounded-2xl p-5 border border-border flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-brand items-center justify-center">
              <Text className="text-brand-contrast text-xl font-bold">{initial}</Text>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-ink text-base font-semibold" numberOfLines={1}>
                {(user?.user_metadata?.full_name as string | undefined) ||
                  user?.email?.split('@')[0] || ''}
              </Text>
              <Text className="text-ink-muted text-xs" numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Plan card */}
        <View className="px-5 mb-4">
          <View className="bg-bg-elevated rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-ink-muted text-[10px] uppercase tracking-wider">Plan actuel</Text>
                <Text className="text-ink text-base font-semibold mt-1">Bloom Pro</Text>
                <Text className="text-ink-muted text-xs mt-0.5">8,60 € / mois</Text>
              </View>
              <Pressable onPress={tapHaptic} className="bg-brand rounded-full px-4 py-2">
                <Text className="text-brand-contrast text-xs font-semibold">Gérer</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Settings list */}
        <View className="px-5">
          <SettingsRow icon="🔔" label="Notifications" onPress={tapHaptic} />
          <SettingsRow icon="🌗" label="Apparence" onPress={tapHaptic} />
          <SettingsRow icon="🔒" label="Sécurité" onPress={tapHaptic} />
          <SettingsRow icon="👥" label="Équipe & accès" onPress={tapHaptic} />
          <SettingsRow icon="🧾" label="Facturation" onPress={tapHaptic} />
          <SettingsRow icon="ℹ️" label="À propos" onPress={tapHaptic} />
        </View>

        {/* Sign out */}
        <View className="px-5 mt-6">
          <Pressable
            onPress={handleSignOut}
            className="bg-bg-elevated border border-danger/40 rounded-2xl py-4 items-center active:bg-danger/10"
          >
            <Text className="text-danger text-sm font-semibold">Déconnexion</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function SettingsRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-bg-elevated rounded-2xl p-4 border border-border mb-2 flex-row items-center gap-3 active:bg-bg-subtle"
    >
      <Text className="text-xl">{icon}</Text>
      <Text className="text-ink text-base flex-1">{label}</Text>
      <Text className="text-ink-subtle text-base">›</Text>
    </Pressable>
  )
}
