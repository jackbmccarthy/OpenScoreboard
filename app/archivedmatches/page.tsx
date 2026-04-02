'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'

const mockArchivedMatches = [
  { id: '1', date: '2026-03-28', players: 'Player A vs Player B', winner: 'Player A' },
  { id: '2', date: '2026-03-27', players: 'Player C vs Player D', winner: 'Player C' },
  { id: '3', date: '2026-03-25', players: 'Player E vs Player F', winner: 'Player F' },
]

function ArchivedMatchItem({ match }: { match: { id: string; date: string; players: string; winner: string } }) {
  return (
    <Pressable className="border-b border-gray-100 p-4 active:bg-gray-50">
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{match.players}</Text>
          <Text className="text-xs text-gray-500">{match.date}</Text>
        </Box>
        <Box className="text-right">
          <Text className="text-xs text-gray-400">Winner</Text>
          <Text className="text-sm font-medium text-green-600">{match.winner}</Text>
        </Box>
      </HStack>
    </Pressable>
  )
}

export default function ArchivedMatchesPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">Archived Matches</Heading>
        <Text className="text-gray-600">View past match results</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockArchivedMatches.map((match) => (
              <ArchivedMatchItem key={match.id} match={match} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
