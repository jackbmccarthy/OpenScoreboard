'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockScheduledMatches = [
  { id: '1', player1: 'Player A', player2: 'Player B', table: 'Table 1', time: '18:00' },
  { id: '2', player1: 'Player C', player2: 'Player D', table: 'Table 2', time: '18:30' },
  { id: '3', player1: 'Player E', player2: 'Player F', table: 'Table 1', time: '19:00' },
]

function ScheduledMatchItem({ match }: { match: { id: string; player1: string; player2: string; table: string; time: string } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/scoring/table/${match.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{match.player1} vs {match.player2}</Text>
          <Text className="text-xs text-gray-500">{match.table} • {match.time}</Text>
        </Box>
        <Text className="text-blue-600 text-sm">Start →</Text>
      </HStack>
    </Pressable>
  )
}

export default function ScheduledTableMatchesPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">Scheduled Matches</Heading>
        <Text className="text-gray-600">Upcoming table matches</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockScheduledMatches.map((match) => (
              <ScheduledMatchItem key={match.id} match={match} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
