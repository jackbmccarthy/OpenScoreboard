// Scoreboard View Page - Live scoreboard overlay
// Uses scoreboard logic from src/scoreboard/
// Shows 404 if required params (sid, tid, or tmid) are not provided

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { activateCapabilityToken, resolveCapabilityLink } from '@/functions/accessTokens'
import { subscribeToTableRuntime, subscribeToTeamMatchRuntime } from '@/functions/liveSync'
import { runScoreboard, resetListeners } from '@/scoreboard'
import { getMatchScore } from '@/functions/scoring'
import { getCombinedPlayerNames } from '@/functions/players'
import { Box, Text, Heading, Spinner, VStack, HStack, Badge } from '@/components/ui'
import { getLiveSyncLabel, type LiveSyncStatus } from '@/lib/liveSync'

type PublicMatchSummary = {
  title: string
  subtitle: string
  scoreLine: string
  serverLabel: string
  statusLabel: string
  judgeLabel: string
}

function buildPublicMatchSummary(match: Record<string, any> | null): PublicMatchSummary | null {
  if (!match) {
    return null
  }

  const playerNames = getCombinedPlayerNames(match.playerA, match.playerB, match.playerA2, match.playerB2)
  const matchScore = getMatchScore(match)
  const liveGameNumber = Number(match.currentGame || 0) || 1
  const liveScoreA = Number(match[`game${liveGameNumber}AScore`] || 0)
  const liveScoreB = Number(match[`game${liveGameNumber}BScore`] || 0)
  const servingName = match.isACurrentlyServing ? (playerNames.a || 'Side A') : (playerNames.b || 'Side B')
  const roundLabel = match.matchRound || match.eventName || match.context?.matchRound || ''
  const eventLabel = match.eventName || match.context?.eventName || ''

  return {
    title: `${playerNames.a || 'Player A'} vs ${playerNames.b || 'Player B'}`,
    subtitle: [roundLabel, eventLabel].filter(Boolean).join(' • '),
    scoreLine: `${matchScore.a}-${matchScore.b} games • ${liveScoreA}-${liveScoreB} points`,
    serverLabel: `Serving: ${servingName}`,
    statusLabel: match.isInBetweenGames ? 'Between Games' : match.isMatchStarted ? 'Live' : 'Warmup',
    judgeLabel: match.isJudgePaused ? 'Judge Pause' : match.isDisputed ? 'Dispute Active' : '',
  }
}

export default function ScoreboardViewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolvedContext, setResolvedContext] = useState<{
    scoreboardID: string
    tableID: string
    teamMatchID: string
    tableNumber: string
  } | null>(null)
  const [hasLiveAssignment, setHasLiveAssignment] = useState(true)
  const [tableLabel, setTableLabel] = useState('')
  const [nextScheduledLabel, setNextScheduledLabel] = useState('')
  const [liveSummary, setLiveSummary] = useState<PublicMatchSummary | null>(null)
  const [lastCompletedSummary, setLastCompletedSummary] = useState<PublicMatchSummary | null>(null)
  const [teamMatchLabel, setTeamMatchLabel] = useState('')
  const [syncStatus, setSyncStatus] = useState<LiveSyncStatus>('loading')
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    // Get params from URL
    const tableID = searchParams.get('tid')
    const teamMatchID = searchParams.get('tmid')
    const teamMatchTableNumber = searchParams.get('table')
    const scoreboardID = searchParams.get('sid')

    const start = async () => {
      setLoading(true)
      setError('')
      let resolvedTableID = tableID
      let resolvedTeamMatchID = teamMatchID
      let resolvedTableNumber = teamMatchTableNumber
      let resolvedScoreboardID = scoreboardID

      if (token) {
        const resolved = await resolveCapabilityLink(token, 'public_score_view')
        if (!resolved) {
          setError('This public score link is invalid or expired.')
          setResolvedContext(null)
          setLoading(false)
          return
        }
        activateCapabilityToken(token)
        resolvedTableID = resolved.record.tableID || resolvedTableID
        resolvedTeamMatchID = resolved.record.teamMatchID || resolvedTeamMatchID
        resolvedTableNumber = resolved.record.tableNumber || resolvedTableNumber
        resolvedScoreboardID = resolved.record.scoreboardID || resolvedScoreboardID
      }

      const hasTableParams = Boolean(resolvedScoreboardID && resolvedTableID)
      const hasTeamMatchParams = Boolean(resolvedScoreboardID && resolvedTeamMatchID)

      if (!hasTableParams && !hasTeamMatchParams) {
        setError('This scoreboard link is missing the data source it needs to render.')
        setResolvedContext(null)
        setLoading(false)
        return
      }

      setResolvedContext({
        scoreboardID: resolvedScoreboardID || '',
        tableID: resolvedTableID || '',
        teamMatchID: resolvedTeamMatchID || '',
        tableNumber: resolvedTableNumber || '',
      })
      resetListeners()
      runScoreboard(resolvedScoreboardID, resolvedTableID, resolvedTeamMatchID, resolvedTableNumber)
      setLoading(false)
    }

    void start()

    return () => {
      resetListeners()
    }
  }, [searchParams])

  useEffect(() => {
    if (!resolvedContext) {
      setLiveSummary(null)
      return
    }

    let previousLiveSummary: PublicMatchSummary | null = null

    const applyLiveSummary = (match: Record<string, any> | null, hasAssignment: boolean) => {
      const summary = buildPublicMatchSummary(match)
      if (summary) {
        previousLiveSummary = summary
        setLiveSummary(summary)
        if (match?.isMatchStarted) {
          setLastCompletedSummary(summary)
        }
        return
      }
      if (!hasAssignment && previousLiveSummary) {
        setLastCompletedSummary(previousLiveSummary)
      }
      setLiveSummary(null)
    }

    if (resolvedContext.tableID) {
      return subscribeToTableRuntime({
        tableID: resolvedContext.tableID,
        token,
        capabilityType: 'public_score_view',
      }, (runtimeState) => {
        if (runtimeState.accessToken.status === 'unauthorized') {
          setError('This public score link is invalid or expired.')
          setLoading(false)
          return
        }
        setSyncStatus(runtimeState.table.status)
        setSyncError(runtimeState.table.error || runtimeState.accessToken.error)
        setTableLabel(typeof runtimeState.table.value?.tableName === 'string' ? runtimeState.table.value.tableName : '')
        const nextScheduledMatch = runtimeState.queue.value?.find(([, scheduledMatch]) => !['active', 'completed', 'archived', 'cancelled'].includes(scheduledMatch.status || 'scheduled'))?.[1]
        setNextScheduledLabel(nextScheduledMatch ? `${nextScheduledMatch.playerA || 'TBD'} vs ${nextScheduledMatch.playerB || 'TBD'}` : '')
        setHasLiveAssignment(Boolean(runtimeState.currentMatchID))
        applyLiveSummary(runtimeState.currentMatch.value as Record<string, any> | null, Boolean(runtimeState.currentMatchID))
        setLoading(runtimeState.table.status === 'loading' && !runtimeState.table.value)
      })
    }

    return subscribeToTeamMatchRuntime({
      teamMatchID: resolvedContext.teamMatchID,
      tableNumber: resolvedContext.tableNumber,
      token,
      capabilityType: 'public_score_view',
    }, (runtimeState) => {
      if (runtimeState.accessToken.status === 'unauthorized') {
        setError('This public score link is invalid or expired.')
        setLoading(false)
        return
      }
      setSyncStatus(runtimeState.teamMatch.status)
      setSyncError(runtimeState.teamMatch.error || runtimeState.accessToken.error)
      const tableNumberLabel = resolvedContext.tableNumber ? `Table ${resolvedContext.tableNumber}` : ''
      const teamSummary = [runtimeState.teamMatch.value?.sportDisplayName || runtimeState.teamMatch.value?.sportName || 'Team Match', tableNumberLabel].filter(Boolean).join(' • ')
      setTeamMatchLabel(teamSummary)
      setHasLiveAssignment(Boolean(runtimeState.currentMatchID))
      applyLiveSummary(runtimeState.currentMatch.value as Record<string, any> | null, Boolean(runtimeState.currentMatchID))
      setLoading(runtimeState.teamMatch.status === 'loading' && !runtimeState.teamMatch.value)
    })
  }, [resolvedContext, token])

  // Check if required params are present
  const scoreboardID = searchParams.get('sid')
  const tableID = searchParams.get('tid')
  const teamMatchID = searchParams.get('tmid')
  const hasTableParams = Boolean(scoreboardID && tableID)
  const hasTeamMatchParams = Boolean(scoreboardID && teamMatchID)

  if (loading) {
    return (
      <Box className="min-h-screen bg-gray-950 flex items-center justify-center">
        <VStack className="items-center gap-4">
          <Spinner size="lg" />
          <Text className="text-sm text-gray-400">Loading public score view…</Text>
        </VStack>
      </Box>
    )
  }

  if (error) {
    return (
      <Box className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Box className="text-center">
          <Heading size="4xl" className="text-white font-bold mb-2">Link Unavailable</Heading>
          <Text className="text-gray-400 text-lg mb-4">{error}</Text>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </Box>
      </Box>
    )
  }

  // Show 404 if missing required params
  if (!hasTableParams && !hasTeamMatchParams && !token) {
    return (
      <Box className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Box className="text-center">
          <Heading size="4xl" className="text-white font-bold mb-2">404</Heading>
          <Text className="text-gray-400 text-lg mb-4">Scoreboard Not Found</Text>
          <Text className="text-gray-500 mb-6">
            Missing required parameters.
            <br />
            URL should include ?sid=... and either ?tid=... or ?tmid=...
          </Text>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="relative h-screen w-full bg-black">
      <div 
        id="gjs"
        style={{ 
          width: '100%',
          height: '100vh'
        }}
      />
      <Box className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-slate-950/80 via-slate-950/35 to-transparent px-4 py-4">
        <VStack className="gap-2">
          <HStack className="items-center gap-2">
            <Badge className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {resolvedContext?.tableID ? (tableLabel || 'Table View') : (teamMatchLabel || 'Team Match View')}
            </Badge>
            {liveSummary ? (
              <Badge className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">
                {liveSummary.statusLabel}
              </Badge>
            ) : null}
            {syncStatus !== 'live' && syncStatus !== 'idle' ? (
              <Badge className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                {getLiveSyncLabel(syncStatus)}
              </Badge>
            ) : null}
            {syncError ? (
              <Badge className="rounded-full bg-amber-300/20 px-3 py-1 text-xs text-amber-100">
                {syncError}
              </Badge>
            ) : null}
            {liveSummary?.judgeLabel ? (
              <Badge className="rounded-full bg-amber-300/20 px-3 py-1 text-xs text-amber-100">
                {liveSummary.judgeLabel}
              </Badge>
            ) : null}
          </HStack>
          {liveSummary ? (
            <VStack className="gap-1">
              <Heading size="lg" className="text-white">{liveSummary.title}</Heading>
              {liveSummary.subtitle ? <Text className="text-sm text-slate-200">{liveSummary.subtitle}</Text> : null}
              <HStack className="flex-wrap gap-4 text-sm text-slate-100">
                <Text>{liveSummary.scoreLine}</Text>
                <Text>{liveSummary.serverLabel}</Text>
                {liveSummary.judgeLabel ? <Text>{liveSummary.judgeLabel}</Text> : null}
              </HStack>
            </VStack>
          ) : null}
        </VStack>
      </Box>
      {!hasLiveAssignment ? (
        <Box className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/65">
          <VStack className="items-center gap-3 text-center px-6">
            <Heading size="xl" className="text-white">Match Not Started</Heading>
            <Text className="max-w-md text-sm text-slate-200">
              This scoreboard is live, but there is no active match assigned to this table yet.
            </Text>
            {nextScheduledLabel ? (
              <Text className="max-w-md text-sm text-slate-300">Next up: {nextScheduledLabel}</Text>
            ) : null}
            {lastCompletedSummary ? (
              <Text className="max-w-md text-sm text-slate-300">Last result: {lastCompletedSummary.title} • {lastCompletedSummary.scoreLine}</Text>
            ) : null}
          </VStack>
        </Box>
      ) : null}
    </Box>
  )
}
