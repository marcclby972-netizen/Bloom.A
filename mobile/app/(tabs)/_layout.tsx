import { Tabs } from 'expo-router'
import { View, Text, Pressable } from 'react-native'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { tapHaptic } from '@/lib/haptics'
import type { ReactNode } from 'react'

/**
 * Tab bar — Home / Projets / Chrono (center, bigger) / To-do / Profil.
 *
 * The center Chrono tab uses a custom big circular button per the brief.
 * Active color = brand violet.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0B0F',
          borderTopColor: '#26262F',
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#7C5CFF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconHome color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projets',
          tabBarIcon: ({ color }) => <IconProjects color={color} />,
        }}
      />
      <Tabs.Screen
        name="chrono"
        options={{
          title: '',
          tabBarIcon: () => <ChronoCenterButton />,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={(e) => { tapHaptic(); props.onPress?.(e) }}
              style={[props.style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'To-do',
          tabBarIcon: ({ color }) => <IconTodos color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconProfile color={color} />,
        }}
      />
    </Tabs>
  )
}

// ── Icons ────────────────────────────────────────────────────────

function IconHome({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12 12 4l9 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11v8a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function IconProjects({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function IconTodos({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={5} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.6} />
      <Rect x={4} y={13} width={6} height={6} rx={1.5} stroke={color} strokeWidth={1.6} />
      <Path d="M14 8h6M14 16h6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={9} r={4} stroke={color} strokeWidth={1.6} />
      <Path d="M4 20c0-3.5 3.6-6.5 8-6.5s8 3 8 6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

/** Center Chrono button — bigger, raised circle in brand color. */
function ChronoCenterButton(): ReactNode {
  return (
    <View style={{
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: '#7C5CFF',
      alignItems: 'center', justifyContent: 'center',
      marginTop: -16,
      shadowColor: '#7C5CFF',
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    }}>
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={13} r={8} stroke="#fff" strokeWidth={1.8} />
        <Path d="M12 13V8M9 3h6M12 3v2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    </View>
  )
}

/** Internal: Text export so tabs/_layout file is self-consistent. */
export { Text }
