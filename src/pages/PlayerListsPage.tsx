// Player Lists Page
// Migrated from app/player-lists/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function PlayerListsPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Player Lists</Heading>
        <Text className="text-gray-600">Manage your player lists</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No player lists yet
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
