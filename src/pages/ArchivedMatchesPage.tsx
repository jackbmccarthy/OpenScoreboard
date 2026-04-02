// Archived Matches Page
// Migrated from app/archivedmatches/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function ArchivedMatchesPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Archived Matches</Heading>
        <Text className="text-gray-600">View completed matches</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No archived matches yet
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
