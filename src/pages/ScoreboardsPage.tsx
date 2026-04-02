// Scoreboards Page
// Migrated from app/scoreboards/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function ScoreboardsPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">My Scoreboards</Heading>
        <Text className="text-gray-600">Manage your scoreboard overlays</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No scoreboards yet - create one in the editor
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
