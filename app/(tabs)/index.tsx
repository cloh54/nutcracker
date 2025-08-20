import { useEffect, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Paragraph,
  ScrollView,
  SizableText,
  useTheme,
  XStack,
  YStack,
} from 'tamagui'

type Txn = {
  id: string
  title: string
  total: number
  date: string
  avatars: { uri?: string; label: string }[]
  extraCount?: number
}

const SEED_DATA: Txn[] = [
  {
    id: '1',
    title: 'Starbucks',
    total: 24,
    date: '8/1/25',
    avatars: [
      { uri: 'https://i.pravatar.cc/64?img=1', label: 'AL' },
      { uri: 'https://i.pravatar.cc/64?img=2', label: 'BK' },
      { uri: 'https://i.pravatar.cc/64?img=3', label: 'CM' },
    ],
    extraCount: 3,
  },
  {
    id: '2',
    title: 'Whole Foods',
    total: 62,
    date: '8/3/25',
    avatars: [
      { uri: 'https://i.pravatar.cc/64?img=4', label: 'DW' },
      { uri: 'https://i.pravatar.cc/64?img=5', label: 'EF' },
    ],
  },
]

export default function TabOneScreen() {
  const [items, setItems] = useState<Txn[]>([])
  const theme = useTheme()

  useEffect(() => {
    setItems(SEED_DATA)
  }, [])

  return (
    <YStack flex={1} bg={theme.yellow10}>
      <ScrollView>
        <YStack gap="$4" p="$4">
          {items.map((t) => (
            <Card
              key={t.id}
              bordered
              elevate={false}
              borderRadius="$6"
              padding="$4"
              bg={theme.yellow1}
              borderColor={theme.yellow6}
            >
              <XStack
                style={{ alignItems: 'center', justifyContent: 'space-between' }}
              >
                <SizableText
                  size="$6"
                  fontWeight="800"
                  color={theme.yellow12}
                >
                  {t.title}
                </SizableText>
                <SizableText size="$3" color={theme.yellow11}>
                  {t.date}
                </SizableText>
              </XStack>

              <Paragraph m="$1" size="$3" color={theme.yellow11}>
                Total ${t.total}
              </Paragraph>

              <XStack
                style={{ alignItems: 'center', justifyContent: 'space-between' }}
                m="$2"
              >
                {/* Avatars */}
                <XStack style={{ alignItems: 'center' }}>
                  <XStack style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
                    {t.avatars.map((a, idx) => (
                      <Avatar
                        key={idx}
                        circular
                        size="$2.5"
                        // overlap
                        style={{ marginLeft: idx === 0 ? 0 : -8 }}
                        borderWidth={1}
                        borderColor={theme.yellow6}
                      >
                        {a.uri ? <Avatar.Image src={a.uri} /> : null}
                        <Avatar.Fallback bg={theme.yellow4}>
                          <SizableText size="$1">{a.label}</SizableText>
                        </Avatar.Fallback>
                      </Avatar>
                    ))}
                  </XStack>
                  {t.extraCount ? (
                    <Paragraph ml="$2" size="$2" color={theme.yellow11}>
                      +{t.extraCount} more
                    </Paragraph>
                  ) : null}
                </XStack>

                {/* “View” button */}
                <Button
                  size="$2.5"
                  bg={theme.yellow3}
                  borderColor={theme.yellow6}
                  color={theme.yellow12}
                  hoverStyle={{ bg: theme.yellow4 }}
                  pressStyle={{ bg: theme.yellow5 }}
                >
                  View
                </Button>
              </XStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
