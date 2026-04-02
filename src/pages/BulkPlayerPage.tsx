// Bulk Player Page
// Migrated from app/bulkplayer/page.tsx

import { Box, Heading, Text, VStack } from '@/components/ui'

export default function BulkPlayerPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Bulk Add Players</Heading>
        <Text className="text-gray-600">Add multiple players at once</Text>
      </VStack>
    </Box>
  )
}
