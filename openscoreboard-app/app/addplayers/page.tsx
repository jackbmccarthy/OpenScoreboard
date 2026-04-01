'use client'

import { Box, Heading, Text, VStack, Button, Input } from '@/components/ui'

export default function AddPlayersPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Add Players</Heading>
        <Text className="text-gray-600">Add a new player to your roster</Text>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Player Name</Text>
          <Input placeholder="Enter player name" />
        </Box>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Email (optional)</Text>
          <Input type="email" placeholder="Enter email" />
        </Box>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Phone (optional)</Text>
          <Input type="tel" placeholder="Enter phone number" />
        </Box>
        
        <Box className="mt-6">
          <Button variant="solid" action="primary" className="w-full">
            Add Player
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="secondary" className="w-full">
            Bulk Add Players
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
