// My Teams Page
// Migrated from app/teams/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function MyTeamsPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">My Teams</Heading>
        <Text className="text-gray-600">Manage your teams</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No teams yet - create one to get started
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
