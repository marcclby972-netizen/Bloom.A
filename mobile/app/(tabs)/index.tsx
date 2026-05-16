import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'
import { tapHaptic } from '@/lib/haptics'

type ContextMode = 'personal' | 'organization'

/**
 * Home dashboard — adapts to personal / organization mode via the context
 * switcher at the top. For now both versions render mocked data; once the
 * Supabase schema is in place we'll wire it up.
 */
export default function HomeScreen() {
  const { user } = useAuth()
  const [mode, setMode] = useState<ContextMode>('personal')

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Context switcher */}
        <View className="px-5 pt-4 pb-3">
          <ContextSwitcher mode={mode} onChange={setMode} />
        </View>

        {/* Greeting */}
        <View className="px-5 mb-6">
          <Text className="text-ink-muted text-sm">Bon retour,</Text>
          <Text className="text-ink text-2xl font-bold mt-0.5">
            {(user?.user_metadata?.full_name as string | undefined) ||
              (user?.email?.split('@')[0] ?? '')}
          </Text>
        </View>

        {mode === 'personal' ? <PersonalDashboard /> : <OrganizationDashboard />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Context Switcher ────────────────────────────────────────────

function ContextSwitcher({
  mode, onChange,
}: { mode: ContextMode; onChange: (m: ContextMode) => void }) {
  const items: { id: ContextMode; label: string }[] = [
    { id: 'personal', label: 'Personnel' },
    { id: 'organization', label: 'Bloom Org' },
  ]
  return (
    <View className="flex-row bg-bg-elevated rounded-full p-1 border border-border self-start">
      {items.map((it) => {
        const active = mode === it.id
        return (
          <Pressable
            key={it.id}
            onPress={() => { tapHaptic(); onChange(it.id) }}
            className={'px-4 py-2 rounded-full ' + (active ? 'bg-brand' : '')}
          >
            <Text className={'text-xs font-semibold ' + (active ? 'text-brand-contrast' : 'text-ink-muted')}>
              {it.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── Personal Dashboard ──────────────────────────────────────────

function PersonalDashboard() {
  return (
    <View className="px-5 gap-3">
      <View className="flex-row gap-3">
        <KpiCard label="Temps aujourd'hui" value="2h 14" hint="3 sessions" />
        <KpiCard label="Tâches du jour" value="4/7" hint="2 en cours" />
      </View>

      <Card title="Cette semaine" subtitle="Objectif 40h">
        <Text className="text-ink text-3xl font-bold mt-2">28h 30</Text>
        <View className="h-2 bg-bg-subtle rounded-full mt-3 overflow-hidden">
          <View className="h-full bg-brand rounded-full" style={{ width: '71%' }} />
        </View>
        <Text className="text-ink-muted text-xs mt-2">71% de l&apos;objectif</Text>
      </Card>

      <Card title="Projets actifs" subtitle="3 en cours">
        <View className="gap-2 mt-2">
          <ProjectRow color="#7C5CFF" name="Bloom" time="12h 30" />
          <ProjectRow color="#22C55E" name="BeautyFlow" time="8h 15" />
          <ProjectRow color="#F59E0B" name="Side hustle" time="3h 45" />
        </View>
      </Card>

      <AiSummaryCard text="Tu as passé 60% de ton temps sur Bloom cette semaine. BeautyFlow prend du retard — pense à programmer une session." />
    </View>
  )
}

// ── Organization Dashboard ──────────────────────────────────────

function OrganizationDashboard() {
  return (
    <View className="px-5 gap-3">
      <View className="flex-row gap-3">
        <KpiCard label="MRR" value="4 800 €" hint="+12% mois" tone="ok" />
        <KpiCard label="Dépenses" value="1 240 €" hint="ce mois" />
      </View>
      <Card title="Trésorerie" subtitle="Compte courant">
        <Text className="text-ink text-3xl font-bold mt-2">42 100 €</Text>
        <Text className="text-ink-muted text-xs mt-1">Runway estimé : 18 mois</Text>
      </Card>

      <Card title="Contributions du mois" subtitle="Heures travaillées">
        <View className="gap-2 mt-3">
          <ContribRow name="Marc" pct={70} color="#7C5CFF" hours="98h" />
          <ContribRow name="Alex" pct={30} color="#22C55E" hours="42h" />
        </View>
        <View className="mt-3 p-3 rounded-xl bg-warn/10 border border-warn/30">
          <Text className="text-warn text-xs font-semibold">⚠️ Déséquilibre &gt; 20%</Text>
          <Text className="text-ink-muted text-xs mt-1">Pensez à organiser un point d&apos;équipe.</Text>
        </View>
      </Card>

      <Card title="Décisions en attente" subtitle="3 votes ouverts" badge="3">
        <View className="gap-2 mt-2">
          <DecisionRow title="Achat Macbook Pro" amount="2 400 €" />
          <DecisionRow title="Distribution mensuelle" amount="—" />
          <DecisionRow title="Souscription Notion Team" amount="180 €" />
        </View>
      </Card>

      <AiSummaryCard text="Marc a fait 70% des heures, Alex 30%. Pensez à en parler avant que ça ne devienne un sujet." />
    </View>
  )
}

// ── Reusable cards ──────────────────────────────────────────────

function KpiCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'ok' | 'warn' }) {
  return (
    <View className="flex-1 bg-bg-elevated rounded-2xl p-4 border border-border">
      <Text className="text-ink-muted text-[10px] uppercase tracking-wider">{label}</Text>
      <Text className={'text-xl font-bold mt-2 ' + (tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink')}>
        {value}
      </Text>
      {hint && <Text className="text-ink-subtle text-[10px] mt-1">{hint}</Text>}
    </View>
  )
}

function Card({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: string; children: React.ReactNode }) {
  return (
    <View className="bg-bg-elevated rounded-2xl p-4 border border-border">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-ink text-base font-semibold">{title}</Text>
          {subtitle && <Text className="text-ink-muted text-xs mt-0.5">{subtitle}</Text>}
        </View>
        {badge && (
          <View className="bg-brand rounded-full px-2 py-0.5">
            <Text className="text-brand-contrast text-[10px] font-bold">{badge}</Text>
          </View>
        )}
      </View>
      {children}
    </View>
  )
}

function ProjectRow({ color, name, time }: { color: string; name: string; time: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-ink text-sm flex-1">{name}</Text>
      <Text className="text-ink-muted text-xs">{time}</Text>
    </View>
  )
}

function ContribRow({ name, pct, color, hours }: { name: string; pct: number; color: string; hours: string }) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-ink text-sm">{name}</Text>
        <Text className="text-ink-muted text-xs">{pct}% · {hours}</Text>
      </View>
      <View className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  )
}

function DecisionRow({ title, amount }: { title: string; amount: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-ink text-sm flex-1">{title}</Text>
      <Text className="text-ink-muted text-xs">{amount}</Text>
    </View>
  )
}

function AiSummaryCard({ text }: { text: string }) {
  return (
    <View className="bg-brand-subtle rounded-2xl p-4 border border-brand/40">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-2 h-2 rounded-full bg-brand" />
        <Text className="text-brand text-[10px] font-bold uppercase tracking-wider">Iris · Résumé IA</Text>
      </View>
      <Text className="text-ink text-sm leading-relaxed">{text}</Text>
      <Pressable className="mt-3 self-start py-1.5 px-3 rounded-full bg-brand/20">
        <Text className="text-brand text-xs font-semibold">Voir le rapport complet →</Text>
      </Pressable>
    </View>
  )
}
