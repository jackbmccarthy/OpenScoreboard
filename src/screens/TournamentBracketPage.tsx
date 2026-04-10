'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Heading, HStack, Text, VStack } from '@/components/ui'
import { subscribeToTournament, type TournamentBracketRecord, type TournamentRecord } from '@/functions/tournaments'

export default function TournamentBracketPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const tournamentID = params.id || ''
  const [tournament, setTournament] = useState<TournamentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentID) {
      setLoading(false)
      return
    }
    return subscribeToTournament(tournamentID, (nextTournament) => {
      setTournament(nextTournament)
      setLoading(false)
    })
  }, [tournamentID])

  const bracketEntries = useMemo(
    () => Object.entries((tournament?.brackets || {}) as Record<string, TournamentBracketRecord>),
    [tournament?.brackets],
  )

  if (loading) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Text className="text-white">Loading bracket view…</Text>
      </Box>
    )
  }

  if (!tournament) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <VStack className="items-center gap-3 text-center">
          <Heading size="lg" className="text-white">Bracket Not Found</Heading>
          <Text className="text-sm text-slate-300">This tournament is unavailable or no longer public.</Text>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Text>Go Home</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  if (!((tournament.publicVisibility || {}).brackets)) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <VStack className="items-center gap-3 text-center">
          <Heading size="lg" className="text-white">Bracket Unavailable</Heading>
          <Text className="text-sm text-slate-300">This tournament has not published its brackets.</Text>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Text>Go Home</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_50%,#ffffff_100%)] p-4 sm:p-6">
      <VStack className="mx-auto max-w-6xl gap-6">
        <VStack className="gap-2">
          <Heading size="2xl" className="text-slate-950">{tournament.name}</Heading>
          <Text className="text-sm text-slate-500">{[tournament.venue, tournament.timezone].filter(Boolean).join(' • ')}</Text>
        </VStack>

        {bracketEntries.length === 0 ? (
          <Box className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Text className="text-lg text-slate-500">No brackets published yet.</Text>
          </Box>
        ) : (
          <VStack className="gap-6">
            {bracketEntries.map(([bracketID, bracket]) => (
              <Box key={bracketID} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <VStack className="gap-4">
                  <VStack className="gap-1">
                    <Heading size="lg" className="text-slate-900">{bracket.name}</Heading>
                    <Text className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {[bracket.format, `${bracket.seedCount} seeds`, bracket.status].filter(Boolean).join(' • ')}
                    </Text>
                  </VStack>
                  <VStack className="gap-3">
                    {Object.values((bracket.nodes || {}) as Record<string, { id: string; roundNumber: number; topLabel: string; bottomLabel: string; status: string }>).map((node) => (
                      <Box key={node.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <HStack className="items-start justify-between gap-4">
                          <VStack className="gap-1">
                            <Text className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Round {node.roundNumber}</Text>
                            <Text className="text-sm font-medium text-slate-900">{node.topLabel}</Text>
                            <Text className="text-sm font-medium text-slate-900">{node.bottomLabel}</Text>
                          </VStack>
                          <Text className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white">
                            {node.status}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
