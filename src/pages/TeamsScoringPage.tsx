// Teams Scoring Page
// Migrated from app/teamscoring/teammatch/[id]/page.tsx

import { Box, Heading, Text, VStack, Button } from '@/components/ui'
import { useParams } from 'react-router-dom'

export default function TeamsScoringPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">Team Match Scoring</Heading>
        <Text className="text-gray-600">Match ID: {id}</Text>
        
        <Box className="w-full max-w-md mt-8">
          <Text className="text-center text-gray-500">
            Team match scoring interface coming soon
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
