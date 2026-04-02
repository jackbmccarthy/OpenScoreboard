// Team Matches Page
// Migrated from app/teammatches/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function TeamMatchesPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Team Matches</Heading>
        <Text className="text-gray-600">Manage team matches</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No team matches yet
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
