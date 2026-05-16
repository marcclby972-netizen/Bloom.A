import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tapHaptic } from '@/lib/haptics'

/**
 * Projects list (stub).
 * TODO: wire to Supabase `projects` table, drill-down screen with tabs
 * (Tâches / Temps / Membres), swipe actions for tasks.
 */
export default function ProjectsScreen() {
  const projects = [
    { id: 'p1', name: 'Bloom', color: '#7C5CFF', status: 'active', tasks: 12, time: '42h' },
    { id: 'p2', name: 'BeautyFlow', color: '#22C55E', status: 'active', tasks: 8, time: '28h' },
    { id: 'p3', name: 'Side hustle', color: '#F59E0B', status: 'paused', tasks: 3, time: '6h' },
  ]
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-ink text-2xl font-bold">Projets</Text>
            <Text className="text-ink-muted text-xs">{projects.length} actifs</Text>
          </View>
          <Pressable
            onPress={tapHaptic}
            className="bg-brand rounded-full h-10 w-10 items-center justify-center"
          >
            <Text className="text-brand-contrast text-xl font-light">+</Text>
          </Pressable>
        </View>

        <View className="px-5 gap-2 mt-2">
          {projects.map((p) => (
            <Pressable
              key={p.id}
              onPress={tapHaptic}
              className="bg-bg-elevated rounded-2xl p-4 border border-border active:bg-bg-subtle"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <Text className="text-ink text-base font-semibold flex-1">{p.name}</Text>
                <Text className="text-ink-muted text-xs uppercase tracking-wider">{p.status}</Text>
              </View>
              <View className="flex-row gap-4 mt-3">
                <Text className="text-ink-muted text-xs">{p.tasks} tâches</Text>
                <Text className="text-ink-muted text-xs">{p.time} cumulés</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
