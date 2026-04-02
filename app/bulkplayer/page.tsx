'use client'

import { Box, Heading, Text, VStack, Button, Input } from '@/components/ui'

export default function BulkPlayerPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Bulk Add Players</Heading>
        <Text className="text-gray-600">Add multiple players at once</Text>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Player Names (one per line)</Text>
          <textarea 
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Player 1&#10;Player 2&#10;Player 3&#10;..."
          />
        </Box>
        
        <Box className="mt-6">
          <Button variant="solid" action="primary" className="w-full">
            Add All Players
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="secondary" className="w-full">
            Import from CSV
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
