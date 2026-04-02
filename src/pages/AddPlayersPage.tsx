// Add Players Page
// Migrated from app/addplayers/page.tsx

import { Box, Heading, Text, VStack } from '@/components/ui'

export default function AddPlayersPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Add Players</Heading>
        <Text className="text-gray-600">Add new players to your roster</Text>
      </VStack>
    </Box>
  )
}
