// Table Scoring Page
// Migrated from app/scoring/table/[id]/page.tsx

import { Box, Heading, Text, VStack, Button } from '@/components/ui'
import { useParams } from 'react-router-dom'

export default function TableScoringPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">Table Scoring</Heading>
        <Text className="text-gray-600">Table ID: {id}</Text>
        
        <Box className="w-full max-w-md mt-8">
          <Text className="text-center text-gray-500">
            {/* TODO: Implement live table scoring UI */}
            Live scoring interface coming soon
          </Text>
        </Box>
        
        <Box className="mt-8">
          <Button variant="outline" action="secondary">
            End Match
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
