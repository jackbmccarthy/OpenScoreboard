'use client'

import { Box, Heading, Text, VStack, Button, Input } from '@/components/ui'
import { useParams } from 'next/navigation'

export default function PlayerRegistrationPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Player Registration</Heading>
        <Text className="text-gray-600">Event ID: {id}</Text>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Player Name</Text>
          <Input placeholder="Enter player name" />
        </Box>
        
        <Box className="mt-4">
          <Text className="text-sm font-medium mb-2">Email (optional)</Text>
          <Input type="email" placeholder="Enter email" />
        </Box>
        
        <Box className="mt-6">
          <Button variant="solid" action="primary" className="w-full">
            Register Player
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="secondary" className="w-full">
            Scan QR Code
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
