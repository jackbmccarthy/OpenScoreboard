// Match Page
// Migrated from app/match/[id]/page.tsx

import { Box, Heading, Text, VStack } from '@/components/ui'
import { useParams } from 'react-router-dom'

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">Match</Heading>
        <Text className="text-gray-600">Match ID: {id}</Text>
      </VStack>
    </Box>
  )
}
