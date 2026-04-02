'use client'

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack } from '@/components/ui'
import { useRouter } from 'next/navigation'

const mockTables = [
  { id: '1', name: 'Table 1', status: 'Active' },
  { id: '2', name: 'Table 2', status: 'Inactive' },
  { id: '3', name: 'Table 3', status: 'Active' },
]

function TableItem({ table }: { table: { id: string; name: string; status: string } }) {
  const router = useRouter()

  return (
    <Pressable
      className="border-b border-gray-100 p-4 active:bg-gray-50"
      onPress={() => router.push(`/scoring/table/${table.id}`)}
    >
      <HStack className="items-center justify-between">
        <Box className="flex-1">
          <Text className="font-medium">{table.name}</Text>
          <Text className="text-xs text-gray-500">{table.status}</Text>
        </Box>
        <Text className="text-blue-600 text-sm">Score →</Text>
      </HStack>
    </Pressable>
  )
}

export default function TablesPage() {
  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">My Tables</Heading>
        <Text className="text-gray-600">Select a table to start scoring</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {mockTables.map((table) => (
              <TableItem key={table.id} table={table} />
            ))}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
