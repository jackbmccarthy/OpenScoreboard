// Archived Matches Page
// Migrated from Expo ArchivedMatchList.tsx

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Box, Text, VStack, Spinner } from '@/components/ui'

interface ArchivedMatch {
  id: string
  player1Name?: string
  player2Name?: string
  player1Score?: number
  player2Score?: number
  date?: string
  winner?: string
  eventName?: string
  matchRound?: string
}

type ArchivedMatchEntry = [string, Record<string, unknown>]

function normalizeArchivedMatches(entries: ArchivedMatchEntry[]): ArchivedMatch[] {
  return entries.map(([id, value]) => ({
    id,
    player1Name: typeof value.playerA === 'string' ? value.playerA : undefined,
    player2Name: typeof value.playerB === 'string' ? value.playerB : undefined,
    player1Score: typeof value.AScore === 'number' ? value.AScore : undefined,
    player2Score: typeof value.BScore === 'number' ? value.BScore : undefined,
    date: typeof value.archivedOn === 'string'
      ? value.archivedOn
      : typeof value.startTime === 'string'
        ? value.startTime
        : undefined,
    winner: typeof value.winner === 'string' ? value.winner : undefined,
    eventName: typeof value.eventName === 'string' ? value.eventName : undefined,
    matchRound: typeof value.matchRound === 'string' ? value.matchRound : undefined,
  }))
}

export default function ArchivedMatchesPage() {
  const params = useParams<{ tableID?: string; teamMatchID?: string }>()
  const { loading: authLoading } = useAuth()
  const [archivedMatches, setArchivedMatches] = useState<ArchivedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    async function loadArchivedMatches() {
      try {
        const { getArchivedMatchesForTable, getArchivedMatchesForTeamMatch } = await import('@/functions/scoring')
        const tableID = params.tableID
        const teamMatchID = params.teamMatchID
        let matches: ArchivedMatch[] = []

        if (tableID) {
          const result = await getArchivedMatchesForTable(tableID)
          matches = normalizeArchivedMatches(result as ArchivedMatchEntry[])
        } else if (teamMatchID) {
          const result = await getArchivedMatchesForTeamMatch(teamMatchID)
          matches = normalizeArchivedMatches(result as ArchivedMatchEntry[])
        }

        setArchivedMatches(matches)
      } catch (error) {
        console.error('Error loading archived matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArchivedMatches()
  }, [authLoading, params.tableID, params.teamMatchID])

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <Text className="mb-4 text-2xl font-bold">Archived Matches</Text>

      {archivedMatches.length > 0 ? (
        <VStack space="md">
          {archivedMatches.map((match) => (
            <Box key={match.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <VStack space="sm">
                <Text className="font-bold">
                  {match.player1Name || 'Player 1'} vs {match.player2Name || 'Player 2'}
                </Text>
                <Text className="text-gray-600">
                  Score: {match.player1Score || 0} - {match.player2Score || 0}
                </Text>
                {match.date ? (
                  <Text className="text-sm text-gray-500">
                    {new Date(match.date).toLocaleDateString()}
                  </Text>
                ) : null}
                {match.matchRound || match.eventName ? (
                  <Text className="text-sm text-slate-500">
                    {[match.matchRound, match.eventName].filter(Boolean).join(' • ')}
                  </Text>
                ) : null}
                {match.winner ? (
                  <Text className="font-medium text-green-600">
                    Winner: {match.winner}
                  </Text>
                ) : null}
              </VStack>
            </Box>
          ))}
        </VStack>
      ) : (
        <Box className="flex items-center justify-center py-12">
          <Text className="text-xl text-gray-500">No archived matches</Text>
        </Box>
      )}
    </Box>
  )
}
