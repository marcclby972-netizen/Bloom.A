import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, AppState } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import { tapHaptic, heavyTap, successHaptic } from '@/lib/haptics'

/**
 * Chrono — Phase 4 of the brief.
 *
 * Persistent timer that keeps ticking when the app is backgrounded by
 * storing the start time and re-computing elapsed on resume. Live Activity
 * + iOS widget will require a native module addition (see README).
 *
 * Uses a big animated circle; minimal controls.
 */
export default function ChronoScreen() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0) // seconds
  const startRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)

  // Tick every 1s while running
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(accumulatedRef.current + Math.floor((Date.now() - startRef.current) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Re-sync when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && running && startRef.current !== null) {
        setElapsed(accumulatedRef.current + Math.floor((Date.now() - startRef.current) / 1000))
      }
    })
    return () => sub.remove()
  }, [running])

  const start = () => {
    heavyTap()
    startRef.current = Date.now()
    setRunning(true)
  }
  const pause = () => {
    tapHaptic()
    if (startRef.current !== null) {
      accumulatedRef.current += Math.floor((Date.now() - startRef.current) / 1000)
      startRef.current = null
    }
    setRunning(false)
  }
  const stop = () => {
    successHaptic()
    pause()
    // TODO: insert time_entry into Supabase here
    accumulatedRef.current = 0
    setElapsed(0)
  }

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Animated ring (simple stroke-dashoffset based on minutes)
  const radius = 130
  const stroke = 4
  const c = 2 * Math.PI * radius
  const progress = (elapsed % 3600) / 3600

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-ink text-2xl font-bold">Chrono</Text>
        <Text className="text-ink-muted text-xs mt-0.5">
          Continue à tourner même app fermée
        </Text>
      </View>

      {/* Big circular display */}
      <View className="flex-1 items-center justify-center">
        <View style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={300} height={300} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={150} cy={150} r={radius} stroke="#26262F" strokeWidth={stroke} fill="none" />
            <Circle
              cx={150}
              cy={150}
              r={radius}
              stroke="#7C5CFF"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
              fill="none"
            />
          </Svg>
          <Text className="text-ink text-5xl font-light tracking-tight">{fmt(elapsed)}</Text>
          {running && (
            <View className="flex-row items-center gap-1.5 mt-3">
              <View className="w-1.5 h-1.5 rounded-full bg-ok" />
              <Text className="text-ok text-[10px] uppercase tracking-widest">En cours</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View className="px-6 pb-10">
        {!running ? (
          <Pressable
            onPress={start}
            className="bg-brand rounded-full h-16 items-center justify-center active:opacity-80"
          >
            <Text className="text-brand-contrast text-base font-semibold">Démarrer</Text>
          </Pressable>
        ) : (
          <View className="flex-row gap-3">
            <Pressable
              onPress={pause}
              className="flex-1 bg-bg-elevated border border-border rounded-full h-16 items-center justify-center active:opacity-80"
            >
              <Text className="text-ink text-base font-semibold">Pause</Text>
            </Pressable>
            <Pressable
              onPress={stop}
              className="flex-1 bg-danger rounded-full h-16 items-center justify-center active:opacity-80"
            >
              <Text className="text-white text-base font-semibold">Stop</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
