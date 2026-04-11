'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Heading, HStack, Text, VStack } from '@/components/ui'
import { subscribeToTournament, type TournamentRecord, type TournamentScheduleBlockRecord } from '@/functions/tournaments'

function formatDateLabel(value: string) {
  if (!value) {
    return 'Unscheduled'
  }
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) {
    return 'Unscheduled'
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTimeRange(startTime: string, endTime: string) {
  if (!startTime) {
    return 'Time TBD'
  }
  const start = new Date(startTime)
  if (!Number.isFinite(start.getTime())) {
    return startTime
  }
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (!endTime) {
    return startLabel
  }
  const end = new Date(endTime)
  if (!Number.isFinite(end.getTime())) {
    return `${startLabel} – ${endTime}`
  }
  return `${startLabel} – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export default function TournamentSchedulePage() {
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

  const scheduleEntries = useMemo(
    () => Object.entries((tournament?.scheduleBlocks || {}) as Record<string, TournamentScheduleBlockRecord>)
      .filter(([, scheduleBlock]) => scheduleBlock.isPublished !== false)
      .sort((a, b) => new Date(a[1].scheduledStartTime || 0).getTime() - new Date(b[1].scheduledStartTime || 0).getTime()),
    [tournament?.scheduleBlocks],
  )

  const groupedSchedule = useMemo(() => {
    return scheduleEntries.reduce((groups, entry) => {
      const key = formatDateLabel(entry[1].scheduledStartTime)
      return {
        ...groups,
        [key]: [...(groups[key] || []), entry],
      }
    }, {} as Record<string, Array<[string, TournamentScheduleBlockRecord]>>)
  }, [scheduleEntries])

  if (loading) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Text className="text-white">Loading schedule…</Text>
      </Box>
    )
  }

  if (!tournament) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <VStack className="items-center gap-3 text-center">
          <Heading size="lg" className="text-white">Schedule Not Found</Heading>
          <Text className="text-sm text-slate-300">This tournament is unavailable or no longer public.</Text>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Text>Go Home</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  if (!((tournament.publicVisibility || {}).schedule)) {
    return (
      <Box className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <VStack className="items-center gap-3 text-center">
          <Heading size="lg" className="text-white">Schedule Unavailable</Heading>
          <Text className="text-sm text-slate-300">This tournament has not published its event schedule.</Text>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Text>Go Home</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_50%,#ffffff_100%)] p-4 sm:p-6">
      <VStack className="mx-auto max-w-5xl gap-6">
        <VStack className="gap-2">
          <Heading size="2xl" className="text-slate-950">{tournament.name}</Heading>
          <Text className="text-sm text-slate-500">{[tournament.venue, tournament.timezone].filter(Boolean).join(' • ')}</Text>
          <Text className="text-sm text-slate-600">Warm-ups, match blocks, and breaks are shown here before table assignments change.</Text>
        </VStack>

        {scheduleEntries.length === 0 ? (
          <Box className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Text className="text-lg text-slate-500">No public schedule blocks published yet.</Text>
          </Box>
        ) : (
          <VStack className="gap-6">
            {Object.entries(groupedSchedule).map(([groupLabel, entries]) => (
              <Box key={groupLabel} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <VStack className="gap-4">
                  <Heading size="lg" className="text-slate-900">{groupLabel}</Heading>
                  <VStack className="gap-3">
                    {entries.map(([scheduleBlockID, scheduleBlock]) => (
                      <Box key={scheduleBlockID} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <HStack className="items-start justify-between gap-4 flex-wrap">
                          <VStack className="gap-1">
                            <HStack className="flex-wrap gap-2">
                              <Text className="font-semibold text-slate-900">{scheduleBlock.title}</Text>
                              <Text className="rounded-full bg-white px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-600">
                                {scheduleBlock.blockType}
                              </Text>
                              <Text className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.14em] ${scheduleBlock.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : scheduleBlock.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {scheduleBlock.status}
                              </Text>
                            </HStack>
                            <Text className="text-sm text-slate-600">{formatTimeRange(scheduleBlock.scheduledStartTime, scheduleBlock.scheduledEndTime)}</Text>
                            <Text className="text-xs text-slate-500">
                              {[scheduleBlock.eventName, scheduleBlock.roundTitle, scheduleBlock.assignedTableLabel ? `Table ${scheduleBlock.assignedTableLabel}` : 'Table TBD'].filter(Boolean).join(' • ')}
                            </Text>
                            {scheduleBlock.participantLabels?.length ? (
                              <Text className="text-xs text-slate-500">Participants: {scheduleBlock.participantLabels.join(', ')}</Text>
                            ) : null}
                            {scheduleBlock.notes ? <Text className="text-sm text-slate-600">{scheduleBlock.notes}</Text> : null}
                          </VStack>
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
