import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { successHaptic, tapHaptic } from '@/lib/haptics'

type Tab = 'today' | 'planned' | 'done'

/**
 * To-do (stub).
 * TODO: wire to Supabase `todos` table, implement swipe-right-to-complete
 * and swipe-left-to-delete via react-native-gesture-handler.
 */
export default function TodosScreen() {
  const [tab, setTab] = useState<Tab>('today')
  const [todos, setTodos] = useState([
    { id: '1', title: 'Finir le mockup dashboard', done: false, when: 'today' as Tab, priority: 'high' },
    { id: '2', title: 'Appeler Alex pour le pacte', done: false, when: 'today' as Tab, priority: 'medium' },
    { id: '3', title: 'Préparer la prez de jeudi', done: false, when: 'planned' as Tab, priority: 'medium' },
    { id: '4', title: 'Push commit cookie banner', done: true, when: 'done' as Tab, priority: 'low' },
  ])

  const toggle = (id: string) => {
    successHaptic()
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done, when: !t.done ? 'done' : 'today' } : t)))
  }

  const visible = todos.filter((t) => t.when === tab)

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-ink text-2xl font-bold">To-do</Text>
      </View>

      {/* Tabs */}
      <View className="px-5 mb-4">
        <View className="flex-row bg-bg-elevated rounded-full p-1 border border-border">
          {(['today', 'planned', 'done'] as Tab[]).map((id) => {
            const active = tab === id
            const label = id === 'today' ? "Aujourd'hui" : id === 'planned' ? 'Planifié' : 'Terminé'
            return (
              <Pressable
                key={id}
                onPress={() => { tapHaptic(); setTab(id) }}
                className={'flex-1 py-2 rounded-full ' + (active ? 'bg-brand' : '')}
              >
                <Text className={'text-center text-xs font-semibold ' + (active ? 'text-brand-contrast' : 'text-ink-muted')}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 8 }}>
        {visible.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-6xl mb-3">✨</Text>
            <Text className="text-ink-muted text-sm">
              {tab === 'today' ? 'Rien pour aujourd\'hui' : tab === 'planned' ? 'Aucune tâche planifiée' : 'Rien terminé encore'}
            </Text>
          </View>
        ) : (
          visible.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => toggle(t.id)}
              className="bg-bg-elevated rounded-2xl p-4 border border-border flex-row items-center gap-3 active:bg-bg-subtle"
            >
              <View className={
                'w-5 h-5 rounded-md border-2 items-center justify-center ' +
                (t.done ? 'border-brand bg-brand' : 'border-ink-muted')
              }>
                {t.done && <Text className="text-brand-contrast text-xs">✓</Text>}
              </View>
              <Text className={'flex-1 text-base ' + (t.done ? 'text-ink-muted line-through' : 'text-ink')}>
                {t.title}
              </Text>
              {t.priority === 'high' && <View className="w-1.5 h-1.5 rounded-full bg-danger" />}
              {t.priority === 'medium' && <View className="w-1.5 h-1.5 rounded-full bg-warn" />}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
