'use client'

import { Box, Heading, Text, VStack, Button } from '@/components/ui'
import { useParams } from 'next/navigation'

export default function TeamMatchScoringPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">Team Match Scoring</Heading>
        <Text className="text-gray-600">Match ID: {id}</Text>
        
        <Box className="w-full max-w-md mt-8">
          <Text className="text-center text-gray-500">
            {/* TODO: Implement team match scoring UI */}
            Live team scoring interface coming soon
          </Text>
        </Box>
        
        <Box className="mt-8">
          <Button variant="outline" action="negative">
            End Team Match
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
