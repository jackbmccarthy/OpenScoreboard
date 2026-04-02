// Player Registration Page
// Migrated from app/playerregistration/[id]/page.tsx

import { Box, Heading, Text, VStack } from '@/components/ui'
import { useParams } from 'react-router-dom'

export default function PlayerRegistrationPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">Player Registration</Heading>
        <Text className="text-gray-600">Registration ID: {id}</Text>
      </VStack>
    </Box>
  )
}
