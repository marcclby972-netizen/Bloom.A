import { useRef, useState } from 'react'
import {
  View, Text, ScrollView, Pressable, useWindowDimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { tapHaptic } from '@/lib/haptics'

type Slide = {
  emoji: string
  title: string
  subtitle: string
  body: string
}

const SLIDES: Slide[] = [
  {
    emoji: '⏱',
    title: 'Sache où part ton temps.',
    subtitle: 'Time tracking natif',
    body:
      'Lance le chrono d\'un tap. Continue à tourner même app fermée, sur la Dynamic Island et sur ton lock screen.',
  },
  {
    emoji: '🤝',
    title: 'Plus de conflits d\'associés.',
    subtitle: 'Dashboard partagé',
    body:
      'Qui a bossé combien. Qui a payé quoi. Qui mérite quoi. Tout est visible, en temps réel, par tous tes co-fondateurs.',
  },
  {
    emoji: '🛡',
    title: 'Des règles, pas des disputes.',
    subtitle: 'Votes & journal immuable',
    body:
      'Les décisions importantes passent par des votes. Tout est tracé. Une IA t\'alerte si l\'équilibre dérape.',
  },
]

export default function Welcome() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [index, setIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    const i = Math.round(x / width)
    if (i !== index) setIndex(i)
  }

  const goAuth = () => {
    tapHaptic()
    router.push('/(public)/auth')
  }

  const next = () => {
    tapHaptic()
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true })
    } else {
      goAuth()
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1">
        {/* Skip button */}
        <View className="flex-row justify-end px-6 pt-2">
          <Pressable onPress={goAuth} hitSlop={12}>
            <Text className="text-ink-muted text-sm">Passer</Text>
          </Pressable>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width }} className="flex-1 px-8 justify-center">
              <Text className="text-7xl mb-8">{s.emoji}</Text>
              <Text className="text-ink-muted uppercase tracking-widest text-xs mb-3">
                {s.subtitle}
              </Text>
              <Text className="text-ink text-4xl font-bold leading-tight mb-4">
                {s.title}
              </Text>
              <Text className="text-ink-muted text-base leading-relaxed">
                {s.body}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots + CTA */}
        <View className="px-6 pb-8 pt-4">
          <View className="flex-row justify-center mb-8 gap-2">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={
                  'h-1.5 rounded-full transition-all ' +
                  (i === index ? 'w-8 bg-brand' : 'w-1.5 bg-bg-subtle')
                }
              />
            ))}
          </View>

          <Pressable
            onPress={next}
            className="bg-brand rounded-2xl h-14 items-center justify-center active:opacity-80"
          >
            <Text className="text-brand-contrast font-semibold text-base">
              {index === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
          </Pressable>

          <Pressable onPress={goAuth} className="mt-3 items-center py-2">
            <Text className="text-ink-muted text-sm">J&apos;ai déjà un compte</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}
