'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockPlayerLists = [
  { id: '1', name: 'Tournament 2026', players: 32, created: '2026-03-01' },
  { id: '2', name: 'Weekly League', players: 16, created: '2026-03-15' },
  { id: '3', name: 'Beginners Club', players: 24, created: '2026-02-20' },
]

function PlayerListItem({ list }: { list: { id: string; name: string; players: number; created: string } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/playerregistration/${list.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{list.name}</Text>
          <Text className="text-xs text-gray-500">{list.players} players • Created {list.created}</Text>
        </Box>
        <Text className="text-blue-600 text-sm">Manage →</Text>
      </HStack>
    </Pressable>
  )
}

export default function PlayerListsPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">My Player Lists</Heading>
        <Text className="text-gray-600">Manage player groups and tournaments</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockPlayerLists.map((list) => (
              <PlayerListItem key={list.id} list={list} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
