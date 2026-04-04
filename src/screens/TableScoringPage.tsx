// @ts-nocheck
// Table Scoring Page
// Migrated from Expo TableScoring.tsx

import { Box, Heading, Text, VStack, Button, HStack, Spinner, Card, CardBody } from '@/components/ui'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { getTableInfo, getCurrentMatchForTable, getMatchData, createNewMatch } from '@/functions/scoring'
import { getTableName, getTablePassword } from '@/functions/tables'
import { useAuth } from '@/lib/auth'

interface TableInfo {
  tableName: string
  sportName: string
  scoringType: string
  password: string
  currentMatch: string
  playerListID: string
}

interface MatchInfo {
  playerA: any
  playerB: any
  playerA2: any
  playerB2: any
  game1AScore: number
  game1BScore: number
  sportName: string
  isDoubles: boolean
  [key: string]: any
}

export default function TableScoringPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTableData = useCallback(async () => {
    if (!id) return
    
    try {
      const info = await getTableInfo(id)
      if (info) {
        setTableInfo(info)
        
        // Load current match if exists
        if (info.currentMatch) {
          const matchData = await getMatchData(info.currentMatch)
          setMatch(matchData)
        }
      }
    } catch (err) {
      console.error('Error loading table:', err)
      setError('Failed to load table data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (authLoading) return
    loadTableData()
  }, [authLoading, loadTableData])

  const handleStartNewMatch = async () => {
    if (!id || !tableInfo) return
    
    try {
      const newMatchId = await createNewMatch(
        id, 
        tableInfo.sportName || 'tableTennis',
        null,
        false,
        tableInfo.scoringType || null
      )
      await loadTableData()
    } catch (err) {
      console.error('Error creating match:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!id) {
    return (
      <Box className="flex-1 bg-white p-4">
        <Text className="text-red-500">No table ID provided</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to score matches</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="lg" className="p-4">
        <HStack className="items-center justify-between">
          <VStack className="flex-1">
            <Heading size="lg">{tableInfo?.tableName || 'Table Scoring'}</Heading>
            <Text className="text-gray-500 text-sm">
              {tableInfo?.sportName || 'Table Tennis'}
            </Text>
          </VStack>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/scoreboard/${id}`)}
          >
            <Text className="text-blue-600">View Scoreboard</Text>
          </Button>
        </HStack>

        {error && (
          <Box className="bg-red-50 p-3 rounded">
            <Text className="text-red-500 text-sm">{error}</Text>
          </Box>
        )}

        <Card variant="elevated" className="w-full">
          <CardBody>
            <VStack space="md">
              <Heading size="md">Current Match</Heading>
              
              {match ? (
                <VStack space="sm">
                  <HStack className="justify-between">
                    <Text fontWeight="bold">
                      {match.playerA?.firstName || 'Player A'} 
                      {match.isDoubles && match.playerA2?.firstName && ` / ${match.playerA2.firstName}`}
                    </Text>
                    <Text fontWeight="bold" className="text-2xl">
                      {match.game1AScore} - {match.game1BScore}
                    </Text>
                    <Text fontWeight="bold">
                      {match.playerB?.firstName || 'Player B'}
                      {match.isDoubles && match.playerB2?.firstName && ` / ${match.playerB2.firstName}`}
                    </Text>
                  </HStack>
                  
                  {match.sportName && (
                    <Text className="text-gray-500 text-sm text-center">
                      Sport: {match.sportName}
                    </Text>
                  )}
                </VStack>
              ) : (
                <Box className="text-center py-4">
                  <Text className="text-gray-500 mb-4">No active match</Text>
                  <Button onClick={handleStartNewMatch}>
                    <Text className="text-white">Start New Match</Text>
                  </Button>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        <HStack className="justify-between">
          <Button 
            variant="outline" 
            action="secondary"
            onClick={() => navigate(`/archivedmatches?tableID=${id}`)}
          >
            <Text>Archived Matches</Text>
          </Button>
          <Button 
            variant="outline" 
            action="secondary"
            onClick={() => navigate(`/scheduledtablematches?tableID=${id}`)}
          >
            <Text>Scheduled</Text>
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
