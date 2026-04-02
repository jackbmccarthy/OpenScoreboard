// Tables Page
// Migrated from Expo MyTables.tsx

import { Box, Heading, Text, VStack, Card, CardBody, Pressable, HStack, Spinner } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMyTables } from '@/functions/tables'
import { useAuth } from '@/lib/auth'

interface TableData {
  tableID: string
  tableName: string
  sportName?: string
  scoringType?: string
}

export default function TablesPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    async function fetchTables() {
      try {
        const myTables = await getMyTables()
        // myTables is array of [tableID, {tableName}] pairs
        const formattedTables = myTables.map(([tableID, data]: [string, any]) => ({
          tableID,
          tableName: data.tableName,
          sportName: data.sportName,
          scoringType: data.scoringType
        }))
        setTables(formattedTables)
      } catch (error) {
        console.error('Error fetching tables:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTables()
  }, [authLoading])

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to view your tables</Text>
          <Pressable 
            className="bg-blue-600 px-4 py-2 rounded"
            onClick={() => navigate('/login')}
          >
            <Text className="text-white font-medium">Sign In</Text>
          </Pressable>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <Heading size="lg">My Tables</Heading>
        <Text className="text-gray-600">Select a table to start scoring</Text>
      </VStack>
      
      <Card variant="elevated" className="mx-4 overflow-hidden">
        <CardBody className="p-0">
          <VStack space="0">
            {tables.length === 0 ? (
              <Box className="p-8 text-center">
                <Text className="text-gray-500 mb-2">No tables yet</Text>
                <Text className="text-gray-400 text-sm">
                  Create your first table to get started
                </Text>
              </Box>
            ) : (
              tables.map((table) => (
                <Pressable
                  key={table.tableID}
                  className="border-b border-gray-100 p-4 active:bg-gray-50"
                  onClick={() => navigate(`/scoring/table/${table.tableID}`)}
                >
                  <HStack className="items-center justify-between">
                    <Box className="flex-1">
                      <Text className="font-medium">{table.tableName}</Text>
                      <Text className="text-xs text-gray-500">
                        {table.sportName || 'Table Tennis'}
                      </Text>
                    </Box>
                    <Text className="text-blue-600 text-sm">Score →</Text>
                  </HStack>
                </Pressable>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  )
}
