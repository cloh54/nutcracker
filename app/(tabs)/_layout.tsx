import { Atom, AudioWaveform } from '@tamagui/lucide-icons'
import { Tabs } from 'expo-router'
import { useTheme } from 'tamagui'

export default function TabLayout() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.red9.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
        },
        headerStyle: {
          backgroundColor: theme.yellow11.val,
          borderBottomColor: theme.borderColor.val,
        },
        headerTintColor: theme.color.val,
        tabBarItemStyle: {
          backgroundColor: theme.yellow11.val,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Nibble Nest',
          headerTitleStyle: {
            fontSize: 32,     // 👈 bigger title text
            fontWeight: '700',
            color: theme.yellow1.val, // you can also use Tamagui theme values
          },
          headerTitleAlign: 'left',
          tabBarIcon: ({ color }) => <Atom color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <AudioWaveform color={color as any} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'Form',
          tabBarIcon: ({ color }) => <AudioWaveform color={color as any} />,
        }}
      />
    </Tabs>
  )
}
