import { useEffect, useState } from 'react'
import { Avatar, Badge, Box, Button, Heading, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { CopyIcon, UserIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import {
  AddPoint,
  AWonRally_PB,
  BWonRally_PB,
  MinusPoint,
  completeCurrentTableMatch as finalizeCurrentTableMatch,
  getRecentPointHistory,
  endGame,
  getLatestUndoablePointEvent,
  getNextPromotableScheduledMatch,
  getCurrentGameNumber,
  getMatchData,
  getMatchScore,
  hasActiveGame,
  isFinalGame,
  isGameFinished,
  isGamePoint,
  isMatchFinished,
  isValidGameScore,
  addJudgeNote,
  setJudgePauseState,
  setMatchDisputeState,
  setBestOf,
  setChangeServiceEveryXPoints,
  setGamePointsToWinGame,
  setInitialMatchServer,
  setIsDoubles,
  setIsGamePoint,
  setIsMatchPoint,
  setScoringType,
  setServerManually,
  setYellowFlag,
  setRedFlag,
  setisManualMode,
  setUsedTimeOut,
  startGame,
  startTimeOut,
  resetUsedTimeOut,
  switchSides,
  syncShowInBetweenGamesModal,
  manuallySetGameScore,
  updateCurrentPlayer,
  updateService,
  undoLastPointAction,
  watchForPasswordChange,
  createNewMatch,
  subscribeToMatchData,
} from '@/functions/scoring'
import { createTeamMatchNewMatch, subscribeToTeamMatch, subscribeToTeamMatchCurrentMatch } from '@/functions/teammatches'
import { isTableAccessRequired, subscribeToTable, verifyTablePassword } from '@/functions/tables'
import { supportedSports } from '@/functions/sports'
import { getNewPlayer } from '@/classes/Player'
import countries from '@/flags/countries.json'
import { activateCapabilityToken, resolveCapabilityLink } from '@/functions/accessTokens'
import { getCurrentCapabilityToken } from '@/lib/capabilitySession'
import { useAuth } from '@/lib/auth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'

const countryOptions = Object.entries(countries)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

function getReadableTextColor(color?: string) {
  if (!color) return '#ffffff'

  const normalized = color.trim().toLowerCase()
  const hex = normalized.startsWith('#') ? normalized.slice(1) : ''
  const fullHex = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex

  if (/^[0-9a-f]{6}$/i.test(fullHex)) {
    const r = Number.parseInt(fullHex.slice(0, 2), 16)
    const g = Number.parseInt(fullHex.slice(2, 4), 16)
    const b = Number.parseInt(fullHex.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.62 ? '#0f172a' : '#ffffff'
  }

  const rgbMatch = normalized.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (rgbMatch) {
    const [, rValue, gValue, bValue] = rgbMatch
    const r = Number(rValue)
    const g = Number(gValue)
    const b = Number(bValue)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.62 ? '#0f172a' : '#ffffff'
  }

  return '#ffffff'
}

function getSideBackground(player: any, fallback: string) {
  return player?.jerseyColor?.trim() || fallback
}

function TeamPlayerPreview({ player, fallback, textColor }: { player: any; fallback: string; textColor: string }) {
  const hasImage = Boolean(player?.imageURL?.trim())

  return (
    <HStack className="min-w-0 items-center gap-2 sm:gap-3">
      {hasImage ? (
        <Avatar src={player.imageURL} alt={fallback} className="h-10 w-10 rounded-2xl border border-white/40 sm:h-12 sm:w-12" />
      ) : (
        <Box className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/10 sm:h-12 sm:w-12">
          <UserIcon size={16} className="text-white/80 sm:h-auto sm:w-auto" />
        </Box>
      )}
      <VStack className="min-w-0 flex-1 gap-0">
        <Text className="truncate text-sm font-semibold sm:text-base" style={{ color: textColor }}>
          {player?.firstName || player?.lastName ? `${player.firstName || ''} ${player.lastName || ''}`.trim() : fallback}
        </Text>
      </VStack>
    </HStack>
  )
}

function ScoreSide({
  side,
  isLeft,
  match,
  disabled,
  onAddPoint,
  onMinusPoint,
  onEditPlayer,
  onToggleServer,
}: {
  side: 'A' | 'B'
  isLeft: boolean
  match: any
  disabled?: boolean
  onAddPoint: () => void | Promise<void>
  onMinusPoint: () => void | Promise<void>
  onEditPlayer: (playerKey: string) => void
  onToggleServer: () => void | Promise<void>
}) {
  const isSideA = side === 'A'
  const primaryPlayerKey = isSideA ? 'playerA' : 'playerB'
  const secondaryPlayerKey = isSideA ? 'playerA2' : 'playerB2'
  const sidePlayer = match?.[primaryPlayerKey]
  const sidePlayer2 = match?.[secondaryPlayerKey]
  const gameNumber = getCurrentGameNumber(match) || 1
  const gameScore = match?.[`game${gameNumber}${side}Score`] || 0
  const matchScore = getMatchScore(match)[isSideA ? 'a' : 'b']
  const servingThisSide = isSideA ? match?.isACurrentlyServing : !match?.isACurrentlyServing
  const backgroundColor = getSideBackground(sidePlayer, isSideA ? '#1d4ed8' : '#0f172a')
  const textColor = getReadableTextColor(backgroundColor)
  const mutedTextColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.74)'
  const cardStyle = {
    backgroundColor,
    color: textColor,
  }
  const overlayStyle = {
    backgroundColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
    color: textColor,
    borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.12)',
  }

  return (
    <Box className="relative min-w-0 basis-1/2 flex-1 px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4" style={cardStyle}>
      <VStack className="h-full min-h-0 gap-2">
        <Box className="flex items-center justify-center">
          <Box className="rounded-[1rem] px-3 py-1.5 sm:px-4 sm:py-2" style={overlayStyle}>
            <Text className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-xs sm:tracking-[0.12em]" style={{ color: mutedTextColor }}>
              Games Won
            </Text>
            <Text className="text-center text-xl font-black sm:text-2xl" style={{ color: textColor }}>
              {matchScore}
            </Text>
          </Box>
        </Box>

        <VStack className="min-h-0 flex-[0_0_30%] gap-2 overflow-hidden">
          <Button variant="outline" className="min-h-[3rem] rounded-2xl px-2 py-2 sm:min-h-[3.5rem] sm:px-3" style={overlayStyle} onClick={() => onEditPlayer(primaryPlayerKey)}>
          <TeamPlayerPreview player={sidePlayer} fallback={isSideA ? 'Player A' : 'Player B'} textColor={textColor} />
          </Button>
          {match?.isDoubles ? (
            <Button variant="outline" className="min-h-[3rem] rounded-2xl px-2 py-2 sm:min-h-[3.5rem] sm:px-3" style={overlayStyle} onClick={() => onEditPlayer(secondaryPlayerKey)}>
              <TeamPlayerPreview player={sidePlayer2} fallback={isSideA ? 'Player A2' : 'Player B2'} textColor={textColor} />
            </Button>
          ) : null}
        </VStack>

        <VStack className="flex-[0_0_20%] items-center justify-center gap-1 pt-2 sm:gap-2 sm:pt-3">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-xs" style={{ color: mutedTextColor }}>
            Game Score
          </Text>
          <Text className="text-center font-black leading-none tracking-[-0.05em] sm:tracking-[-0.06em]" style={{ color: textColor, fontSize: 'clamp(3rem, 16vw, 6rem)' }}>{gameScore}</Text>
          <HStack className="flex-wrap items-center justify-center gap-1 sm:gap-2">
          {match?.isManualServiceMode ? (
            <Button
              variant="outline"
              className="rounded-full px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs"
              style={servingThisSide ? { backgroundColor: textColor, color: backgroundColor } : overlayStyle}
              onClick={onToggleServer}
              disabled={disabled}
            >
              <Text className="text-[10px] sm:text-xs" style={{ color: servingThisSide ? backgroundColor : textColor }}>
                {servingThisSide ? 'Serving' : 'Set Server'}
              </Text>
            </Button>
          ) : (
            servingThisSide ? <Badge className="rounded-full px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs" style={{ backgroundColor: textColor, color: backgroundColor }}>Serving</Badge> : null
          )}
          {match?.isGamePoint && isGamePoint(match) ? <Badge className="rounded-full bg-amber-300 px-2.5 py-1 text-[10px] text-slate-950 sm:px-3 sm:text-xs">Game Point</Badge> : null}
          {match?.isMatchPoint && isGamePoint(match) && isFinalGame(match) ? <Badge className="rounded-full bg-rose-300 px-2.5 py-1 text-[10px] text-slate-950 sm:px-3 sm:text-xs">Match Point</Badge> : null}
        </HStack>
        </VStack>

        <VStack className="flex-[0_0_38%] justify-end gap-2 sm:gap-3">
          <Button action="primary" className="min-h-[6.5rem] flex-1 rounded-[1.75rem] hover:opacity-95 sm:min-h-[8rem] sm:rounded-[1.9rem]" style={{ backgroundColor: textColor, color: backgroundColor }} onClick={onAddPoint} disabled={disabled}>
            <Text className="text-5xl font-black sm:text-6xl" style={{ color: backgroundColor }}>+</Text>
          </Button>
          <Button variant="outline" className="h-20 rounded-2xl px-1.5 sm:h-24 sm:px-2" style={overlayStyle} onClick={onMinusPoint} disabled={disabled}>
            <Text className="text-3xl font-black" style={{ color: textColor }}>-</Text>
          </Button>
        </VStack>
      </VStack>

    </Box>
  )
}

export default function ScoringStation({
  mode,
  tableID,
  teamMatchID,
  teamMatchTableNumber,
}: {
  mode: 'table' | 'teamMatch'
  tableID?: string
  teamMatchID?: string
  teamMatchTableNumber?: string
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [accessGranted, setAccessGranted] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [teamMatch, setTeamMatch] = useState<any>(null)
  const [activeTableNumber, setActiveTableNumber] = useState(teamMatchTableNumber || '1')
  const [matchID, setMatchID] = useState('')
  const [match, setMatch] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [showJudgeDialog, setShowJudgeDialog] = useState(false)
  const [showPlayerEditor, setShowPlayerEditor] = useState(false)
  const [showGameEndDialog, setShowGameEndDialog] = useState(false)
  const [showMatchEndDialog, setShowMatchEndDialog] = useState(false)
  const [editingPlayerKey, setEditingPlayerKey] = useState('')
  const [playerDraft, setPlayerDraft] = useState(getNewPlayer())
  const [settingsDraft, setSettingsDraft] = useState({
    bestOf: 5,
    pointsToWinGame: 11,
    changeServeEveryXPoints: 2,
    isDoubles: false,
    isAInitialServer: false,
    isManualServiceMode: false,
    scoringType: 'normal',
  })
  const [manualGameScores, setManualGameScores] = useState<Record<number, { a: string; b: string }>>({})
  const [copiedLink, setCopiedLink] = useState('')
  const [activeAction, setActiveAction] = useState('')
  const accessToken = searchParams.get('token')
  const hasCapabilitySession = Boolean(accessToken || getCurrentCapabilityToken())
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null)
  const [judgeNote, setJudgeNote] = useState('')
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')
  const [syncError, setSyncError] = useState('')
  const [matchSyncStatus, setMatchSyncStatus] = useState<RealtimeStatus>('idle')
  const [matchSyncError, setMatchSyncError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setAccessGranted(true)
      return
    }

    if (mode === 'teamMatch') {
      if (accessToken && teamMatchID) {
        resolveCapabilityLink(accessToken, 'team_match_scoring')
          .then((resolved) => {
            if (resolved?.record.teamMatchID === teamMatchID) {
              activateCapabilityToken(accessToken)
              setAccessGranted(true)
              setPasswordError('')
              return
            }
            setAccessGranted(false)
            setLoading(false)
          })
          .catch(() => setLoading(false))
        return
      }

      setAccessGranted(false)
      setLoading(false)
      return
    }

    if (!tableID) {
      setLoading(false)
      return
    }

    if (accessToken) {
      resolveCapabilityLink(accessToken, 'table_scoring')
        .then((resolved) => {
          const record = resolved?.record
          const isValid = record?.tableID === tableID
          if (resolved && isValid) {
            activateCapabilityToken(accessToken)
            setAccessGranted(true)
            setPasswordError('')
            return
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
      return
    }

    isTableAccessRequired(tableID)
      .then((requiresAccess) => {
        if (!requiresAccess) {
          setAccessGranted(true)
          return
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authLoading, user, tableID, mode, accessToken, teamMatchID])

  useEffect(() => {
    if (!accessGranted || mode !== 'table' || !tableID) return

    const unsubscribeState = subscribeToPathState(`tables/${tableID}`, (state) => {
      setSyncStatus(state.status)
      setSyncError(state.error)
    })
    setLoading(true)
    const unsubscribeTable = subscribeToTable(tableID, (nextTableInfo) => {
      setTableInfo(nextTableInfo)
      const nextMatchID = typeof nextTableInfo?.currentMatch === 'string' ? nextTableInfo.currentMatch : ''
      setMatchID(nextMatchID)
      if (!nextMatchID) {
        setMatch(null)
      }
      setLoading(false)
    })
    return () => {
      unsubscribeState()
      unsubscribeTable()
    }
  }, [accessGranted, mode, tableID])

  useEffect(() => {
    if (!accessGranted || mode !== 'teamMatch' || !teamMatchID) return

    const unsubscribeState = subscribeToPathState(`teamMatches/${teamMatchID}`, (state) => {
      setSyncStatus(state.status)
      setSyncError(state.error)
    })
    setLoading(true)
    const unsubscribeTeamMatch = subscribeToTeamMatch(teamMatchID, (nextTeamMatch) => {
      setTeamMatch(nextTeamMatch)
      const currentMatches = nextTeamMatch?.currentMatches as Record<string, string> | undefined
      const nextMatchID = currentMatches?.[activeTableNumber] || ''
      setMatchID(nextMatchID)
      if (!nextMatchID) {
        setMatch(null)
      }
      setLoading(false)
    })
    return () => {
      unsubscribeState()
      unsubscribeTeamMatch()
    }
  }, [accessGranted, mode, teamMatchID, activeTableNumber])

  useEffect(() => {
    if (!accessGranted || mode !== 'teamMatch' || !teamMatchID) return

    return subscribeToTeamMatchCurrentMatch(teamMatchID, activeTableNumber, (currentMatchID) => {
      setMatchID(currentMatchID)
      if (!currentMatchID) {
        setMatch(null)
      }
    })
  }, [accessGranted, mode, teamMatchID, activeTableNumber])

  useEffect(() => {
    if (!matchID) {
      setMatch(null)
      setMatchSyncStatus('idle')
      setMatchSyncError('')
      return
    }

    const unsubscribeState = subscribeToPathState(`matches/${matchID}`, (state) => {
      setMatchSyncStatus(state.status)
      setMatchSyncError(state.error)
    })
    const unsubscribeMatch = subscribeToMatchData(matchID, (nextMatch) => {
      setMatch(nextMatch)
    })
    return () => {
      unsubscribeState()
      unsubscribeMatch()
    }
  }, [matchID])

  useEffect(() => {
    if (!accessGranted || mode !== 'table' || !tableID) return

    let hasSeenInitialAccessValue = false
    let lastAccessMarker = ''
    const unsubscribe = watchForPasswordChange(tableID, async (accessMarker) => {
      if (!hasSeenInitialAccessValue) {
        hasSeenInitialAccessValue = true
        lastAccessMarker = accessMarker
        return
      }
      if (!user && accessMarker && accessMarker !== lastAccessMarker) {
        setAccessGranted(false)
        setPasswordError('The table password changed. Re-enter it to continue scoring.')
      }
      lastAccessMarker = accessMarker
    })

    return unsubscribe
  }, [accessGranted, mode, tableID, user, passwordInput])

  useEffect(() => {
    if (match) {
      setSettingsDraft({
        bestOf: match.bestOf || 5,
        pointsToWinGame: match.pointsToWinGame || 11,
        changeServeEveryXPoints: match.changeServeEveryXPoints || 2,
        isDoubles: !!match.isDoubles,
        isAInitialServer: !!match.isAInitialServer,
        isManualServiceMode: !!match.isManualServiceMode,
        scoringType: match.scoringType || 'normal',
      })
      const nextManualScores: Record<number, { a: string; b: string }> = {}
      for (let gameNumber = 1; gameNumber <= 9; gameNumber++) {
        if (match[`isGame${gameNumber}Finished`]) {
          nextManualScores[gameNumber] = {
            a: String(match[`game${gameNumber}AScore`] ?? 0),
            b: String(match[`game${gameNumber}BScore`] ?? 0),
          }
        }
      }
      setManualGameScores(nextManualScores)
    }
  }, [match])

  const ensureMatchStarted = async (gameNumber: number) => {
    if (!match?.isMatchStarted || !match?.[`isGame${gameNumber}Started`]) {
      await startGame(matchID, gameNumber)
    }
  }

  const syncPointFlags = async (nextMatch: any) => {
    const gamePoint = isGamePoint(nextMatch)
    await setIsGamePoint(matchID, gamePoint)
    await setIsMatchPoint(matchID, gamePoint && isFinalGame(nextMatch))
  }

  const refreshMatch = async () => {
    if (!matchID) return null
    const refreshed = await getMatchData(matchID)
    await syncPointFlags(refreshed)
    return refreshed
  }

  const applyPoint = async (side: 'A' | 'B', increment: boolean) => {
    if (!matchID || !match) return

    const gameNumber = getCurrentGameNumber(match) || 1
    await ensureMatchStarted(gameNumber)

    let nextScore
    if (increment) {
      if (match.sportName === 'pickleball') {
        nextScore = side === 'A'
          ? await AWonRally_PB(matchID, gameNumber, match.isACurrentlyServing, match.isSecondServer, match.isDoubles, match.scoringType === 'rally', match.pointsToWinGame, match[`game${gameNumber}AScore`])
          : await BWonRally_PB(matchID, gameNumber, match.isACurrentlyServing, match.isSecondServer, match.isDoubles, match.scoringType === 'rally', match.pointsToWinGame, match[`game${gameNumber}BScore`])
      } else {
        nextScore = await AddPoint(matchID, gameNumber, side)
        if (!match.isManualServiceMode) {
          const otherSide = side === 'A' ? 'B' : 'A'
          const combinedPoints = nextScore + (match[`game${gameNumber}${otherSide}Score`] || 0)
          await updateService(matchID, match.isAInitialServer, gameNumber, combinedPoints, match.changeServeEveryXPoints, match.pointsToWinGame, match.sportName, match.scoringType)
        }
      }
    } else {
      nextScore = await MinusPoint(matchID, gameNumber, side)
      if (!match.isManualServiceMode && match.sportName !== 'pickleball') {
        const otherSide = side === 'A' ? 'B' : 'A'
        const combinedPoints = nextScore + (match[`game${gameNumber}${otherSide}Score`] || 0)
        await updateService(matchID, match.isAInitialServer, gameNumber, combinedPoints, match.changeServeEveryXPoints, match.pointsToWinGame, match.sportName, match.scoringType)
      }
    }

    const refreshed = await refreshMatch()
    if (!refreshed) return
    const refreshedMatch = refreshed as Record<string, any>

    const currentGame = getCurrentGameNumber(refreshedMatch) || gameNumber
    const gameDone = isGameFinished(
      refreshedMatch.enforceGameScore,
      refreshedMatch[`game${currentGame}AScore`],
      refreshedMatch[`game${currentGame}BScore`],
      refreshedMatch.pointsToWinGame
    )

    if (gameDone && !refreshedMatch[`isGame${currentGame}Finished`]) {
      await endGame(matchID, currentGame)
      const afterEnd = await refreshMatch()
      if (!afterEnd) return
      if (isMatchFinished(afterEnd)) {
        setShowMatchEndDialog(true)
      } else {
        setShowGameEndDialog(true)
      }
    }
  }

  const handleSwitchSides = async () => {
    if (!matchID) return
    setActiveAction('switch')
    await switchSides(matchID)
    setActiveAction('')
  }

  const handleSaveSettings = async () => {
    if (!matchID) return
    setActiveAction('settings')
    await Promise.all([
      setBestOf(matchID, Number(settingsDraft.bestOf)),
      setGamePointsToWinGame(matchID, Number(settingsDraft.pointsToWinGame)),
      setChangeServiceEveryXPoints(matchID, Number(settingsDraft.changeServeEveryXPoints)),
      setIsDoubles(matchID, settingsDraft.isDoubles),
      setInitialMatchServer(matchID, settingsDraft.isAInitialServer),
      setisManualMode(matchID, settingsDraft.isManualServiceMode),
      setScoringType(matchID, settingsDraft.scoringType),
      syncShowInBetweenGamesModal(matchID, false),
    ])
    for (const [gameNumberString, scores] of Object.entries(manualGameScores)) {
      const gameNumber = Number(gameNumberString)
      const aScore = Number(scores.a)
      const bScore = Number(scores.b)
      if (
        Number.isFinite(aScore) &&
        Number.isFinite(bScore) &&
        isValidGameScore(true, aScore, bScore, Number(settingsDraft.pointsToWinGame))
      ) {
        await manuallySetGameScore(matchID, gameNumber, aScore, bScore)
      }
    }
    if (!hasActiveGame(match)) {
      await updateService(matchID, settingsDraft.isAInitialServer, getCurrentGameNumber(match) || 1, 0, Number(settingsDraft.changeServeEveryXPoints), Number(settingsDraft.pointsToWinGame), match.sportName, settingsDraft.scoringType)
    }
    setShowSettings(false)
    await refreshMatch()
    setActiveAction('')
  }

  const handleSavePlayer = async () => {
    if (!matchID || !editingPlayerKey) return
    await updateCurrentPlayer(matchID, editingPlayerKey, playerDraft)
    setShowPlayerEditor(false)
    setEditingPlayerKey('')
    await refreshMatch()
  }

  const handleStartNextGame = async () => {
    if (!matchID || !match) return
    const gameNumber = getCurrentGameNumber(match) || 1
    await startGame(matchID, gameNumber)
    await updateService(
      matchID,
      settingsDraft.isAInitialServer,
      gameNumber,
      0,
      Number(settingsDraft.changeServeEveryXPoints),
      Number(settingsDraft.pointsToWinGame),
      match.sportName,
      settingsDraft.scoringType
    )
    setShowGameEndDialog(false)
    await refreshMatch()
  }

  const canCreateAdHocMatch = !hasCapabilitySession
  const canFinalizeAssignedTableMatch = mode === 'table' && Boolean(tableID && matchID && match)

  const handleCreateMatch = async () => {
    if (!canCreateAdHocMatch) return
    setActiveAction('start-match')
    if (mode === 'table' && tableID && tableInfo) {
      if (matchID && match && isMatchFinished(match)) {
        await finalizeCurrentTableMatch(tableID, matchID, match, false)
      }
      const newMatchID = await createNewMatch(tableID, tableInfo.sportName || 'tableTennis', null, false, tableInfo.scoringType || 'normal')
      if (!newMatchID) {
        setActiveAction('')
        return
      }
      setMatchID(newMatchID)
      setActiveAction('')
      return
    }

    if (mode === 'teamMatch' && teamMatchID && teamMatch) {
      const newMatchID = await createTeamMatchNewMatch(teamMatchID, activeTableNumber, teamMatch.sportName || 'tableTennis', null, teamMatch.scoringType || 'normal')
      if (!newMatchID) {
        setActiveAction('')
        return
      }
      setMatchID(newMatchID)
    }
    setActiveAction('')
  }

  const nextQueuedTableMatch = mode === 'table' && tableInfo?.scheduledMatches && typeof tableInfo.scheduledMatches === 'object'
    ? getNextPromotableScheduledMatch(Object.entries(tableInfo.scheduledMatches as Record<string, Record<string, any>>))
    : null
  const latestUndoablePointEvent = getLatestUndoablePointEvent(match)
  const recentPointHistory = getRecentPointHistory(match, 4)
  const canUndoCurrentMatch = Boolean(matchID && latestUndoablePointEvent && match?.sportName !== 'pickleball')
  const autoAdvanceMode = mode === 'table' ? (tableInfo?.autoAdvanceMode || 'manual') : 'manual'
  const autoAdvanceDelaySeconds = mode === 'table' ? Number(tableInfo?.autoAdvanceDelaySeconds || 0) : 0

  const handlePromoteNextAfterMatch = async () => {
    if (mode !== 'table' || !tableID || !matchID || !match) return
    setActiveAction('promote-next')
    await finalizeCurrentTableMatch(tableID, matchID, match, true)
    setShowMatchEndDialog(false)
    setAutoAdvanceCountdown(null)
    setActiveAction('')
  }

  useEffect(() => {
    if (!showMatchEndDialog || mode !== 'table' || !canFinalizeAssignedTableMatch) {
      setAutoAdvanceCountdown(null)
      return
    }
    if (autoAdvanceMode !== 'automatic' || !nextQueuedTableMatch) {
      setAutoAdvanceCountdown(null)
      return
    }

    const startingCountdown = Math.max(0, autoAdvanceDelaySeconds)
    setAutoAdvanceCountdown(startingCountdown)

    if (startingCountdown === 0) {
      void handlePromoteNextAfterMatch()
      return
    }

    const intervalID = window.setInterval(() => {
      setAutoAdvanceCountdown((current) => {
        if (current === null) return null
        if (current <= 1) {
          window.clearInterval(intervalID)
          void handlePromoteNextAfterMatch()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalID)
    }
  }, [showMatchEndDialog, mode, canFinalizeAssignedTableMatch, autoAdvanceMode, autoAdvanceDelaySeconds, nextQueuedTableMatch, tableID, matchID, match])

  const handleCopyScoringLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setCopiedLink(url)
      window.setTimeout(() => setCopiedLink(''), 1500)
    }
  }

  const leftSide = match?.isSwitched ? 'B' : 'A'
  const rightSide = match?.isSwitched ? 'A' : 'B'
  const teamMatchTables = teamMatch?.currentMatches ? Object.keys(teamMatch.currentMatches) : ['1']
  const scoreActionsDisabled = !matchID || showGameEndDialog || showMatchEndDialog || !!match?.isInBetweenGames || (match ? isMatchFinished(match) : false)
  const scoringContextLabel = [match?.matchRound || match?.context?.matchRound || '', match?.eventName || match?.context?.eventName || ''].filter(Boolean).join(' • ')

  if (authLoading || loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!accessGranted) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <Box className="premium-panel w-full max-w-md rounded-[2rem] p-6">
          <VStack className="gap-4">
            <Heading size="lg">Enter Table Password</Heading>
            <Text className="text-sm text-slate-500">This scoring station can be used without login, but the table password is required.</Text>
            <Input type="password" value={passwordInput} onChangeText={setPasswordInput} placeholder="Table password" />
            {passwordError ? <Text className="text-sm text-red-600">{passwordError}</Text> : null}
            <Button
              action="primary"
              onClick={async () => {
                const isValid = await verifyTablePassword(tableID || '', passwordInput)
                if (isValid) {
                  setAccessGranted(true)
                  setPasswordError('')
                } else {
                  setPasswordError('Incorrect password')
                }
              }}
            >
              <Text className="text-white">Unlock Scoring</Text>
            </Button>
          </VStack>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="h-[100dvh] overflow-hidden bg-slate-950">
      {user ? (
        <HStack className="items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 text-white backdrop-blur">
          <VStack className="gap-0">
            <Text className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {mode === 'table' ? 'Table Scoring' : 'Team Match Scoring'}
            </Text>
            <Heading size="lg" className="text-white">
              {mode === 'table' ? tableInfo?.tableName || 'Scoring Station' : `${teamMatch?.sportDisplayName || 'Team Match'} • Table ${activeTableNumber}`}
            </Heading>
            {scoringContextLabel ? (
              <Text className="text-xs text-slate-300">{scoringContextLabel}</Text>
            ) : null}
          </VStack>
          <HStack className="gap-2 items-center">
            <LiveStatusBadge status={syncStatus} prefix="Live" />
            <Button
              variant="solid"
              className={copiedLink ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300'}
              onClick={handleCopyScoringLink}
            >
              <CopyIcon size={14} />
              <Text className={`ml-1 ${copiedLink ? 'text-emerald-700' : 'text-slate-950'}`}>{copiedLink ? 'Copied' : 'Copy Link'}</Text>
            </Button>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => navigate(mode === 'table' ? '/tables' : '/teammatches')}>
              <Text className="text-white/90">Back</Text>
            </Button>
          </HStack>
        </HStack>
      ) : null}

      <Box className="border-b border-white/10 bg-slate-950 px-3 py-2 text-white">
        <VStack className="gap-2">
          <HStack className="gap-2">
            <Button variant="outline" className="min-w-0 flex-1 border-slate-200 bg-white px-2 text-slate-900 hover:bg-slate-100" onClick={() => setShowTimeoutDialog(true)} disabled={!matchID}>
              <Text className="text-slate-900">Timeout</Text>
            </Button>
            <Button variant="outline" className="min-w-0 flex-1 border-slate-200 bg-white px-2 text-slate-900 hover:bg-slate-100" onClick={() => setShowJudgeDialog(true)} disabled={!matchID}>
              <Text className="text-slate-900">Judge</Text>
            </Button>
            <Button
              variant="outline"
              className="min-w-0 flex-1 border-slate-200 bg-white px-2 text-slate-900 hover:bg-slate-100"
              onClick={async () => {
                setActiveAction('undo')
                await undoLastPointAction(matchID)
                await refreshMatch()
                setActiveAction('')
              }}
              disabled={!canUndoCurrentMatch || activeAction === 'undo'}
            >
              {activeAction === 'undo' ? <Spinner size="sm" /> : null}
              <Text className="text-slate-900">Undo</Text>
            </Button>
            <Button variant="outline" className="min-w-0 flex-1 border-slate-200 bg-white px-2 text-slate-900 hover:bg-slate-100" onClick={handleSwitchSides} disabled={!matchID || activeAction === 'switch'}>
              {activeAction === 'switch' ? <Spinner size="sm" /> : null}
              <Text className="text-slate-900">Switch Sides</Text>
            </Button>
            <Button variant="outline" className="min-w-0 flex-1 border-slate-200 bg-white px-2 text-slate-900 hover:bg-slate-100" onClick={() => setShowSettings(true)} disabled={!matchID}>
              <Text className="text-slate-900">Match Settings</Text>
            </Button>
          </HStack>

          {mode === 'teamMatch' ? (
            <HStack className="items-center gap-2">
              <Text className="text-sm text-white/70">Table</Text>
              <Select value={activeTableNumber} onValueChange={setActiveTableNumber} className="min-w-[6rem] bg-white text-slate-900">
                {teamMatchTables.map((tableNumber) => (
                  <option key={tableNumber} value={tableNumber}>{tableNumber}</option>
                ))}
              </Select>
            </HStack>
          ) : null}
          {match?.isJudgePaused || match?.isDisputed ? (
            <HStack className="flex-wrap gap-2">
              {match?.isJudgePaused ? (
                <Badge className="rounded-full bg-amber-200 px-3 py-1 text-xs text-slate-950">Judge Pause</Badge>
              ) : null}
              {match?.isDisputed ? (
                <Badge className="rounded-full bg-rose-200 px-3 py-1 text-xs text-slate-950">Dispute Active</Badge>
              ) : null}
              {match?.latestJudgeNote ? (
                <Text className="text-xs text-white/75">{match.latestJudgeNote}</Text>
              ) : null}
            </HStack>
          ) : null}
          {syncStatus === 'offline' || syncStatus === 'error' || matchSyncStatus === 'offline' || matchSyncStatus === 'error' ? (
            <Box className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2">
              <Text className="text-xs font-medium text-rose-700">
                {syncStatus === 'offline' || matchSyncStatus === 'offline'
                  ? 'Live scoring is offline. Changes may not sync until the connection returns.'
                  : syncError || matchSyncError || 'A live sync error occurred.'}
              </Text>
            </Box>
          ) : null}
          {recentPointHistory.length > 0 ? (
            <VStack className="gap-1">
              <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Recent History</Text>
              <HStack className="flex-wrap gap-2">
                {recentPointHistory.map((event) => (
                  <Badge key={event.eventID} className={`rounded-full px-2.5 py-1 text-[10px] ${event.undone ? 'bg-slate-700 text-slate-200' : 'bg-white/10 text-white'}`}>
                    {event.action === 'point_added' ? '+' : event.action === 'point_removed' ? '-' : '*'} G{event.gameNumber} {event.side || '-'} {event.scoreA}-{event.scoreB}{event.undone ? ' undone' : ''}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          ) : null}
        </VStack>
      </Box>

      {!match ? (
        <Box className="flex h-[calc(100dvh-7.5rem)] items-center justify-center p-6 text-white">
          <VStack className="items-center gap-4 text-center">
            <Heading size="lg" className="text-white">No active match</Heading>
            <Text className="max-w-md text-sm text-white/70">
              {canCreateAdHocMatch ? 'Create a new match to begin scoring on this station.' : 'This secure scoring link is tied to an existing match. Ask the owner to assign a current match before scoring.'}
            </Text>
            {canCreateAdHocMatch ? (
              <Button action="primary" onClick={handleCreateMatch} disabled={activeAction === 'start-match'}>
                {activeAction === 'start-match' ? <Spinner size="sm" /> : null}
                <Text className="text-white">Start Match</Text>
              </Button>
            ) : null}
          </VStack>
        </Box>
      ) : (
        <HStack className="h-[calc(100dvh-7.5rem)] min-h-0 flex-row overflow-hidden">
          <ScoreSide
            side={leftSide}
            isLeft={true}
            match={match}
            disabled={scoreActionsDisabled}
            onAddPoint={() => applyPoint(leftSide, true)}
            onMinusPoint={() => applyPoint(leftSide, false)}
            onEditPlayer={(playerKey) => {
              setEditingPlayerKey(playerKey)
              setPlayerDraft({ ...getNewPlayer(), ...(match?.[playerKey] || {}) })
              setShowPlayerEditor(true)
            }}
            onToggleServer={() => setServerManually(matchID, leftSide === 'A')}
          />
          <ScoreSide
            side={rightSide}
            isLeft={false}
            match={match}
            disabled={scoreActionsDisabled}
            onAddPoint={() => applyPoint(rightSide, true)}
            onMinusPoint={() => applyPoint(rightSide, false)}
            onEditPlayer={(playerKey) => {
              setEditingPlayerKey(playerKey)
              setPlayerDraft({ ...getNewPlayer(), ...(match?.[playerKey] || {}) })
              setShowPlayerEditor(true)
            }}
            onToggleServer={() => setServerManually(matchID, rightSide === 'A')}
          />
        </HStack>
      )}

      <OverlayDialog
        isOpen={showTimeoutDialog}
        onClose={() => setShowTimeoutDialog(false)}
        title="Timeout"
        footer={(
          <Button variant="outline" onClick={() => setShowTimeoutDialog(false)}>
            <Text>Close</Text>
          </Button>
        )}
      >
        <VStack className="gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-a')
              await startTimeOut(matchID, 'A')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-a' ? <Spinner size="sm" /> : null}
            <Text>Start A Timeout</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-b')
              await startTimeOut(matchID, 'B')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-b' ? <Spinner size="sm" /> : null}
            <Text>Start B Timeout</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-reset-a')
              await resetUsedTimeOut(matchID, 'A')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-reset-a' ? <Spinner size="sm" /> : null}
            <Text>Reset A Timeout</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-reset-b')
              await resetUsedTimeOut(matchID, 'B')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-reset-b' ? <Spinner size="sm" /> : null}
            <Text>Reset B Timeout</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-use-a')
              await setUsedTimeOut(matchID, 'A')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-use-a' ? <Spinner size="sm" /> : null}
            <Text>Mark A Timeout Used</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('timeout-use-b')
              await setUsedTimeOut(matchID, 'B')
              setShowTimeoutDialog(false)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'timeout-use-b' ? <Spinner size="sm" /> : null}
            <Text>Mark B Timeout Used</Text>
          </Button>
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showJudgeDialog}
        onClose={() => setShowJudgeDialog(false)}
        title="Judge Mode"
        footer={(
          <Button variant="outline" onClick={() => setShowJudgeDialog(false)}>
            <Text>Close</Text>
          </Button>
        )}
      >
        <VStack className="gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('judge-pause')
              await setJudgePauseState(matchID, !Boolean(match?.isJudgePaused), judgeNote)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'judge-pause' ? <Spinner size="sm" /> : null}
            <Text>{match?.isJudgePaused ? 'Resume Match' : 'Pause Match'}</Text>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('judge-dispute')
              await setMatchDisputeState(matchID, !Boolean(match?.isDisputed), judgeNote)
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID}
          >
            {activeAction === 'judge-dispute' ? <Spinner size="sm" /> : null}
            <Text>{match?.isDisputed ? 'Clear Dispute' : 'Mark Dispute'}</Text>
          </Button>
          <HStack className="flex-wrap gap-2">
            <Button variant="outline" onClick={async () => { setActiveAction('judge-yellow-a'); await setYellowFlag(matchID, 'A', !Boolean(match?.isAYellowCarded)); await refreshMatch(); setActiveAction('') }} disabled={!matchID}>
              <Text>{match?.isAYellowCarded ? 'Clear A Yellow' : 'A Yellow'}</Text>
            </Button>
            <Button variant="outline" onClick={async () => { setActiveAction('judge-yellow-b'); await setYellowFlag(matchID, 'B', !Boolean(match?.isBYellowCarded)); await refreshMatch(); setActiveAction('') }} disabled={!matchID}>
              <Text>{match?.isBYellowCarded ? 'Clear B Yellow' : 'B Yellow'}</Text>
            </Button>
            <Button variant="outline" onClick={async () => { setActiveAction('judge-red-a'); await setRedFlag(matchID, 'A', !Boolean(match?.isARedCarded)); await refreshMatch(); setActiveAction('') }} disabled={!matchID}>
              <Text>{match?.isARedCarded ? 'Clear A Red' : 'A Red'}</Text>
            </Button>
            <Button variant="outline" onClick={async () => { setActiveAction('judge-red-b'); await setRedFlag(matchID, 'B', !Boolean(match?.isBRedCarded)); await refreshMatch(); setActiveAction('') }} disabled={!matchID}>
              <Text>{match?.isBRedCarded ? 'Clear B Red' : 'B Red'}</Text>
            </Button>
          </HStack>
          <textarea
            className="min-h-[6rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={judgeNote}
            onChange={(event) => setJudgeNote(event.target.value)}
            placeholder="Judge note, ruling, or interruption details"
          />
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAction('judge-note')
              await addJudgeNote(matchID, judgeNote)
              setJudgeNote('')
              await refreshMatch()
              setActiveAction('')
            }}
            disabled={!matchID || !judgeNote.trim()}
          >
            {activeAction === 'judge-note' ? <Spinner size="sm" /> : null}
            <Text>Save Judge Note</Text>
          </Button>
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Scoring Settings"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveSettings} disabled={activeAction === 'settings'}>
              {activeAction === 'settings' ? <Spinner size="sm" /> : null}
              <Text className="text-white">Save Settings</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Select value={String(settingsDraft.bestOf)} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, bestOf: Number(value) }))}>
            {[1, 3, 5, 7, 9].map((value) => <option key={value} value={value}>{`Best of ${value}`}</option>)}
          </Select>
          <Select value={String(settingsDraft.pointsToWinGame)} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, pointsToWinGame: Number(value) }))}>
            {[11, 15, 21, 9999].map((value) => <option key={value} value={value}>{value === 9999 ? 'No cap' : `${value} points to win`}</option>)}
          </Select>
          <Select value={String(settingsDraft.changeServeEveryXPoints)} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, changeServeEveryXPoints: Number(value) }))}>
            {[1, 2, 5].map((value) => <option key={value} value={value}>{`Change serve every ${value}`}</option>)}
          </Select>
          <Select value={settingsDraft.isDoubles ? 'doubles' : 'singles'} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, isDoubles: value === 'doubles' }))}>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
          </Select>
          <Select value={settingsDraft.isManualServiceMode ? 'manual' : 'auto'} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, isManualServiceMode: value === 'manual' }))}>
            <option value="auto">Automatic service</option>
            <option value="manual">Manual service mode</option>
          </Select>
          {supportedSports[match?.sportName]?.hasScoringTypes ? (
            <Select value={settingsDraft.scoringType} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, scoringType: value }))}>
              {Object.entries((supportedSports[match?.sportName]?.scoringTypes || {}) as Record<string, { displayName: string }>).map(([key, config]) => (
                <option key={key} value={key}>{config.displayName}</option>
              ))}
            </Select>
          ) : null}
          <Select value={settingsDraft.isAInitialServer ? 'A' : 'B'} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, isAInitialServer: value === 'A' }))}>
            <option value="A">Player A serves first</option>
            <option value="B">Player B serves first</option>
          </Select>
          <VStack className="gap-2">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed Game Scores</Text>
            {Object.keys(manualGameScores).length === 0 ? (
              <Text className="text-sm text-slate-500">No completed games yet.</Text>
            ) : (
              Object.entries(manualGameScores).map(([gameNumber, scores]) => {
                const isValid = isValidGameScore(true, Number(scores.a || 0), Number(scores.b || 0), Number(settingsDraft.pointsToWinGame))
                return (
                  <HStack key={gameNumber} className="items-center gap-2">
                    <Text className="w-16 text-sm font-semibold text-slate-700">{`Game ${gameNumber}`}</Text>
                    <Input value={scores.a} onChangeText={(value) => setManualGameScores((current) => ({ ...current, [Number(gameNumber)]: { ...current[Number(gameNumber)], a: value } }))} />
                    <Input value={scores.b} onChangeText={(value) => setManualGameScores((current) => ({ ...current, [Number(gameNumber)]: { ...current[Number(gameNumber)], b: value } }))} />
                    <Text className={`text-xs ${isValid ? 'text-emerald-600' : 'text-rose-600'}`}>{isValid ? 'Valid' : 'Invalid'}</Text>
                  </HStack>
                )
              })
            )}
          </VStack>
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showPlayerEditor}
        onClose={() => setShowPlayerEditor(false)}
        title="Edit Player"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowPlayerEditor(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSavePlayer}>
              <Text className="text-white">Save Player</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <VStack className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">First Name</Text>
            <Input value={playerDraft.firstName || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, firstName: value }))} />
          </VStack>
          <VStack className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Last Name</Text>
            <Input value={playerDraft.lastName || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, lastName: value }))} />
          </VStack>
          <VStack className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Image URL</Text>
            <Input value={playerDraft.imageURL || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, imageURL: value }))} />
          </VStack>
          <VStack className="gap-1">
            <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Country</Text>
            <Select value={playerDraft.country || ''} onValueChange={(value) => setPlayerDraft((current) => ({ ...current, country: value }))}>
              <option value="">Select country</option>
              {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
            </Select>
          </VStack>
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showGameEndDialog}
        onClose={() => setShowGameEndDialog(false)}
        title="Game Complete"
        description="The current game reached a valid finishing score."
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowGameEndDialog(false)}>
              <Text>Stay Here</Text>
            </Button>
            <Button action="primary" onClick={handleStartNextGame}>
              <Text className="text-white">Start Next Game</Text>
            </Button>
          </>
        )}
      >
        <Text className="text-sm text-slate-600">Review the score, switch sides if needed, and start the next game when the players are ready.</Text>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showMatchEndDialog}
        onClose={() => setShowMatchEndDialog(false)}
        title="Match Complete"
        description="The match reached its finishing condition."
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowMatchEndDialog(false)}>
              <Text>Keep View Open</Text>
            </Button>
            {mode === 'table' && canFinalizeAssignedTableMatch && nextQueuedTableMatch && autoAdvanceMode !== 'manual' ? (
              <Button variant="outline" onClick={handlePromoteNextAfterMatch} disabled={activeAction === 'promote-next'}>
                <Text>{activeAction === 'promote-next' ? 'Promoting...' : 'Promote Next Match'}</Text>
              </Button>
            ) : null}
            {canCreateAdHocMatch ? (
              <Button action="primary" onClick={handleCreateMatch}>
                <Text className="text-white">Start New Match</Text>
              </Button>
            ) : null}
          </>
        )}
      >
        <VStack className="gap-2">
          <Text className="text-sm text-slate-600">No further points can be added until a new match or next assigned match is started.</Text>
          {mode === 'table' && autoAdvanceMode === 'automatic' && nextQueuedTableMatch ? (
            <Text className="text-sm text-slate-600">
              {autoAdvanceCountdown === null
                ? 'Auto-advance is enabled for this table.'
                : `Auto-advancing to the next queued match in ${autoAdvanceCountdown}s.`}
            </Text>
          ) : null}
        </VStack>
      </OverlayDialog>
    </Box>
  )
}
