'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockTeams = [
  { id: '1', name: 'Team Alpha', players: 4, matches: 12 },
  { id: '2', name: 'Team Beta', players: 5, matches: 8 },
  { id: '3', name: 'Team Gamma', players: 3, matches: 15 },
]

function TeamItem({ team }: { team: { id: string; name: string; players: number; matches: number } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/teammatches?team=${team.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{team.name}</Text>
          <Text className="text-xs text-gray-500">{team.players} players • {team.matches} matches</Text>
        </Box>
        <Text className="text-blue-600 text-sm">View →</Text>
      </HStack>
    </Pressable>
  )
}

export default function TeamsPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">My Teams</Heading>
        <Text className="text-gray-600">Manage your teams and team matches</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockTeams.map((team) => (
              <TeamItem key={team.id} team={team} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
