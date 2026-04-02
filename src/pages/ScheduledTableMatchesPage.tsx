// Scheduled Table Matches Page
// Migrated from app/scheduledtablematches/page.tsx

import { Box, Heading, Text, VStack, Card, CardBody } from '@/components/ui'

export default function ScheduledTableMatchesPage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">Scheduled Table Matches</Heading>
        <Text className="text-gray-600">View upcoming scheduled matches</Text>
        
        <Card variant="elevated">
          <CardBody>
            <Text className="text-gray-500 text-center py-8">
              No scheduled matches yet
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
