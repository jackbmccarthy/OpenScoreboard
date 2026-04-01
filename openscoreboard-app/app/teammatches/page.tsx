'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockTeamMatches = [
  { id: '1', homeTeam: 'Team Alpha', awayTeam: 'Team Beta', date: '2026-03-30', status: 'Scheduled' },
  { id: '2', homeTeam: 'Team Gamma', awayTeam: 'Team Alpha', date: '2026-03-28', status: 'Completed' },
  { id: '3', homeTeam: 'Team Beta', awayTeam: 'Team Gamma', date: '2026-03-25', status: 'Completed' },
]

function TeamMatchItem({ match }: { match: { id: string; homeTeam: string; awayTeam: string; date: string; status: string } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/teamscoring/teammatch/${match.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{match.homeTeam} vs {match.awayTeam}</Text>
          <Text className="text-xs text-gray-500">{match.date}</Text>
        </Box>
        <Text className={`text-xs px-2 py-1 rounded ${
          match.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {match.status}
        </Text>
      </HStack>
    </Pressable>
  )
}

export default function TeamMatchesPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">Team Matches</Heading>
        <Text className="text-gray-600">View and manage team matches</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockTeamMatches.map((match) => (
              <TeamMatchItem key={match.id} match={match} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
