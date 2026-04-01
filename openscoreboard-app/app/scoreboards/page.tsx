'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockScoreboards = [
  { id: '1', name: 'Main Scoreboard', type: 'Standard', views: 156 },
  { id: '2', name: 'Tournament Board', type: 'Tournament', views: 89 },
  { id: '3', name: 'League Scoreboard', type: 'League', views: 234 },
]

function ScoreboardItem({ scoreboard }: { scoreboard: { id: string; name: string; type: string; views: number } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/scoreboard?id=${scoreboard.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{scoreboard.name}</Text>
          <Text className="text-xs text-gray-500">{scoreboard.type} • {scoreboard.views} views</Text>
        </Box>
        <Text className="text-blue-600 text-sm">View →</Text>
      </HStack>
    </Pressable>
  )
}

export default function ScoreboardsPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">My Scoreboards</Heading>
        <Text className="text-gray-600">View and manage your scoreboard overlays</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockScoreboards.map((scoreboard) => (
              <ScoreboardItem key={scoreboard.id} scoreboard={scoreboard} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
