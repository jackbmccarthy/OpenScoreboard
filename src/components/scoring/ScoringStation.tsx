import { useEffect, useState } from 'react'
import { Avatar, Badge, Box, Button, Heading, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { CopyIcon, UserIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import MatchWizardModal from './MatchWizardModal'
import SettingsOverlay from './SettingsOverlay'
import LiveStatusAlert from '@/components/realtime/LiveStatusAlert'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import {
  AddPoint,
  AWonRally_PB,
  BWonRally_PB,
  MinusPoint,
  completeCurrentTableMatch as finalizeCurrentTableMatch,
  endGame,
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
  setBestOf,
  setChangeServiceEveryXPoints,
  setGamePointsToWinGame,
  setInitialMatchServer,
  setIsDoubles,
  setIsGamePoint,
  setIsMatchPoint,
  setScoringType,
  setServerManually,
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
  createNewMatch,
} from '@/functions/scoring'
import { createTeamMatchNewMatch } from '@/functions/teammatches'
import { supportedSports } from '@/functions/sports'
import { getNewPlayer } from '@/classes/Player'
import countries from '@/flags/countries.json'
import { useAuth } from '@/lib/auth'
import { useSearchParams } from 'react-router-dom'
import { createOptimisticPointUpdate, reconcileOptimisticPointUpdate, resolveActiveTableNumber } from './scoringStationRuntimeModel'
import { useScoringStationRuntime } from './useScoringStationRuntime'
import type {
  Match as MatchRecord,
  MatchPlayerKey,
  Player,
  ScheduledMatch,
} from '@/types/matches'

const countryOptions = Object.entries(countries)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

type SettingsDraft = {
  bestOf: number
  pointsToWinGame: number
  changeServeEveryXPoints: number
  isDoubles: boolean
  isAInitialServer: boolean
  isManualServiceMode: boolean
  scoringType: string
}

type WizardDraft = {
  playerA: Pick<Player, 'firstName' | 'lastName' | 'jerseyColor' | 'country'>
  playerB: Pick<Player, 'firstName' | 'lastName' | 'jerseyColor' | 'country'>
  isDoubles: boolean
  bestOf: number
  pointsToWinGame: number
  changeServeEveryXPoints: number
  scoringType: string
  warmupDurationSeconds: number
  sportName: string
}

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

function getSideBackground(player: Partial<Player> | null | undefined, fallback: string) {
  return player?.jerseyColor?.trim() || fallback
}

function getPlayerName(player: Partial<Player> | null | undefined, fallback: string) {
  return player?.firstName || player?.lastName
    ? `${player.firstName || ''} ${player.lastName || ''}`.trim()
    : fallback
}

function TeamPlayerPreview({ player, fallback, textColor }: { player: Partial<Player> | null | undefined; fallback: string; textColor: string }) {
  const hasImage = Boolean(player?.imageURL?.trim())

  return (
    <HStack className="min-w-0 items-center gap-2 sm:gap-3">
      {hasImage ? (
        <Avatar src={player?.imageURL || ''} alt={fallback} className="h-10 w-10 rounded-2xl border border-white/40 sm:h-12 sm:w-12" />
      ) : (
        <Box className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/10 sm:h-12 sm:w-12">
          <UserIcon size={16} className="text-white/80 sm:h-auto sm:w-auto" />
        </Box>
      )}
      <VStack className="min-w-0 flex-1 gap-0">
        <Text className="truncate text-sm font-semibold sm:text-base" style={{ color: textColor }}>
          {getPlayerName(player, fallback)}
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
  match: MatchRecord | null
  disabled?: boolean
  onAddPoint: () => void | Promise<void>
  onMinusPoint: () => void | Promise<void>
  onEditPlayer: (playerKey: MatchPlayerKey) => void
  onToggleServer: () => void | Promise<void>
}) {
  const isSideA = side === 'A'
  const primaryPlayerKey: MatchPlayerKey = isSideA ? 'playerA' : 'playerB'
  const secondaryPlayerKey: MatchPlayerKey = isSideA ? 'playerA2' : 'playerB2'
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
    <Box className="relative h-full min-h-0 min-w-0 px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4" style={cardStyle}>
      <VStack className="h-full min-h-0 gap-3">
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
          {/* FIXED HEIGHT dedicated space for service/game/match point indicators */}
          <Box className="min-h-[2rem] w-full flex items-center justify-center">
            <HStack className="flex-wrap items-center justify-center gap-1 sm:gap-2">
              {/* Always render a fixed-size placeholder for service state */}
              <Box className="min-w-[4rem] flex items-center justify-center">
                {match?.isManualServiceMode ? (
                  <Button
                    variant="outline"
                    className="rounded-full px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs"
                    style={servingThisSide ? { backgroundColor: textColor, color: backgroundColor } : overlayStyle}
                    onClick={onToggleServer}
                    disabled={disabled}
                  >
                    <Text className="text-[10px] sm:text-xs" style={{ color: servingThisSide ? backgroundColor : textColor }}>
                      {servingThisSide ? 'Serving' : 'Service'}
                    </Text>
                  </Button>
                ) : (
                  <Badge 
                    className="rounded-full px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs"
                    style={{ backgroundColor: servingThisSide ? textColor : 'transparent', color: servingThisSide ? backgroundColor : 'transparent', borderColor: textColor, borderWidth: 1, borderStyle: 'solid' }}
                  >
                    {servingThisSide ? 'Serving' : ''}
                  </Badge>
                )}
              </Box>
              {match?.isGamePoint && isGamePoint(match) ? (
                <Badge className="rounded-full bg-amber-300 px-2.5 py-1 text-[10px] text-slate-950 sm:px-3 sm:text-xs">Game Point</Badge>
              ) : <Box className="min-w-[4rem]" />}
              {match?.isMatchPoint && isGamePoint(match) && isFinalGame(match) ? (
                <Badge className="rounded-full bg-rose-300 px-2.5 py-1 text-[10px] text-slate-950 sm:px-3 sm:text-xs">Match Point</Badge>
              ) : <Box className="min-w-[4rem]" />}
            </HStack>
          </Box>
        </VStack>

        <VStack className="flex-[0_0_38%] justify-end gap-2 sm:gap-3">
          <Button action="primary" className="min-h-[7rem] flex-1 rounded-[1.75rem] px-4 hover:opacity-95 sm:min-h-[8rem] sm:rounded-[1.9rem]" style={{ backgroundColor: textColor, color: backgroundColor }} onClick={onAddPoint} disabled={disabled}>
            <Text className="text-5xl font-black sm:text-6xl" style={{ color: backgroundColor }}>+</Text>
          </Button>
          <Button variant="outline" className="min-h-[4.5rem] rounded-2xl px-3 sm:h-24 sm:px-2" style={overlayStyle} onClick={onMinusPoint} disabled={disabled}>
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
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [passwordInput, setPasswordInput] = useState('')
  const [activeTableNumber, setActiveTableNumber] = useState(teamMatchTableNumber || '1')
  const [showSettings, setShowSettings] = useState(false)
  const [showMatchWizard, setShowMatchWizard] = useState(false)
  const [warmupActive, setWarmupActive] = useState(false)
  const [warmupSecondsRemaining, setWarmupSecondsRemaining] = useState(0)
  const [warmupInterval, setWarmupIntervalState] = useState<ReturnType<typeof setInterval> | null>(null)
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false)
  const [showPlayerEditor, setShowPlayerEditor] = useState(false)
  const [showGameEndDialog, setShowGameEndDialog] = useState(false)
  const [showMatchEndDialog, setShowMatchEndDialog] = useState(false)
  const [editingPlayerKey, setEditingPlayerKey] = useState<MatchPlayerKey | ''>('')
  const [playerDraft, setPlayerDraft] = useState<Player>(getNewPlayer())
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({
    bestOf: 5,
    pointsToWinGame: 11,
    changeServeEveryXPoints: 2,
    isDoubles: false,
    isAInitialServer: false,
    isManualServiceMode: false,
    scoringType: 'normal',
  })
  const [manualGameScores, setManualGameScores] = useState<Record<number, { a: string; b: string }>>({})
  const [wizardDraft, setWizardDraft] = useState<WizardDraft | null>(null)
  const [copiedLink, setCopiedLink] = useState('')
  const [activeAction, setActiveAction] = useState('')
  const accessToken = searchParams.get('token')
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null)
  const [pendingPointUpdate, setPendingPointUpdate] = useState<ReturnType<typeof createOptimisticPointUpdate> | null>(null)
  const [localConflictMessage, setLocalConflictMessage] = useState('')

  const {
    loading,
    accessGranted,
    passwordError,
    tableInfo,
    teamMatch,
    matchID,
    match,
    syncStatus,
    syncError,
    matchSyncStatus,
    matchSyncError,
    resolvedCapability,
    hasCapabilitySession,
    unlockTable,
  } = useScoringStationRuntime({
    mode,
    tableID,
    teamMatchID,
    activeTableNumber,
    accessToken,
    user,
    authLoading,
  })

  useEffect(() => {
    if (mode !== 'teamMatch') {
      return
    }

    const availableTableNumbers = teamMatch?.currentMatches ? Object.keys(teamMatch.currentMatches) : []
    const nextTableNumber = resolveActiveTableNumber({
      availableTableNumbers,
      preferredTableNumber: teamMatchTableNumber || '1',
      currentTableNumber: activeTableNumber,
    })

    if (nextTableNumber !== activeTableNumber) {
      setActiveTableNumber(nextTableNumber)
    }
  }, [activeTableNumber, mode, teamMatch?.currentMatches, teamMatchTableNumber])

  useEffect(() => {
    setPendingPointUpdate(null)
    setLocalConflictMessage('')
    setShowGameEndDialog(false)
    setShowMatchEndDialog(false)
  }, [matchID])

  useEffect(() => {
    const reconciliation = reconcileOptimisticPointUpdate({
      pendingPointUpdate,
      canonicalMatch: match,
      currentMatchID: matchID,
    })

    if (reconciliation.status === 'conflict') {
      setPendingPointUpdate(null)
      setLocalConflictMessage(reconciliation.message)
      return
    }

    if (reconciliation.status === 'resolved' && pendingPointUpdate) {
      setPendingPointUpdate(null)
      setLocalConflictMessage('')
    }
  }, [match, matchID, pendingPointUpdate])

  const renderedMatch = pendingPointUpdate?.optimisticMatch || match
  const effectiveMatchSyncStatus = localConflictMessage ? 'conflict' : matchSyncStatus
  const effectiveMatchSyncError = localConflictMessage || matchSyncError

  useEffect(() => {
    if (renderedMatch) {
      setSettingsDraft({
        bestOf: renderedMatch.bestOf || 5,
        pointsToWinGame: renderedMatch.pointsToWinGame || 11,
        changeServeEveryXPoints: renderedMatch.changeServeEveryXPoints || 2,
        isDoubles: !!renderedMatch.isDoubles,
        isAInitialServer: !!renderedMatch.isAInitialServer,
        isManualServiceMode: !!renderedMatch.isManualServiceMode,
        scoringType: renderedMatch.scoringType || 'normal',
      })
      const nextManualScores: Record<number, { a: string; b: string }> = {}
      for (let gameNumber = 1; gameNumber <= 9; gameNumber++) {
        if (renderedMatch[`isGame${gameNumber}Finished`]) {
          nextManualScores[gameNumber] = {
            a: String(renderedMatch[`game${gameNumber}AScore`] ?? 0),
            b: String(renderedMatch[`game${gameNumber}BScore`] ?? 0),
          }
        }
      }
      setManualGameScores(nextManualScores)
    }
  }, [renderedMatch])

  const ensureMatchStarted = async (gameNumber: number) => {
    if (!renderedMatch?.isMatchStarted || !renderedMatch?.[`isGame${gameNumber}Started`]) {
      await startGame(matchID, gameNumber)
    }
  }

  const syncPointFlags = async (nextMatch: MatchRecord) => {
    const gamePoint = isGamePoint(nextMatch)
    await setIsGamePoint(matchID, gamePoint)
    await setIsMatchPoint(matchID, gamePoint && isFinalGame(nextMatch))
  }

  const refreshMatch = async () => {
    if (!matchID) return null
    const refreshed = await getMatchData(matchID)
    if (refreshed) {
      await syncPointFlags(refreshed)
    }
    return refreshed
  }

  const applyPoint = async (side: 'A' | 'B', increment: boolean) => {
    if (!matchID || !renderedMatch) return

    const optimisticPointUpdate = createOptimisticPointUpdate(renderedMatch, matchID, side, increment)
    if (optimisticPointUpdate) {
      setPendingPointUpdate(optimisticPointUpdate)
      setLocalConflictMessage('')
    }

    const gameNumber = getCurrentGameNumber(renderedMatch) || 1
    await ensureMatchStarted(gameNumber)

    try {
      let nextScore
      if (increment) {
        if (renderedMatch.sportName === 'pickleball') {
          nextScore = side === 'A'
            ? await AWonRally_PB(matchID, gameNumber, renderedMatch.isACurrentlyServing, renderedMatch.isSecondServer, renderedMatch.isDoubles, renderedMatch.scoringType === 'rally', renderedMatch.pointsToWinGame, renderedMatch[`game${gameNumber}AScore`])
            : await BWonRally_PB(matchID, gameNumber, renderedMatch.isACurrentlyServing, renderedMatch.isSecondServer, renderedMatch.isDoubles, renderedMatch.scoringType === 'rally', renderedMatch.pointsToWinGame, renderedMatch[`game${gameNumber}BScore`])
        } else {
          nextScore = await AddPoint(matchID, gameNumber, side)
          if (!renderedMatch.isManualServiceMode) {
            const otherSide = side === 'A' ? 'B' : 'A'
            const combinedPoints = nextScore + (renderedMatch[`game${gameNumber}${otherSide}Score`] || 0)
            await updateService(matchID, renderedMatch.isAInitialServer, gameNumber, combinedPoints, renderedMatch.changeServeEveryXPoints, renderedMatch.pointsToWinGame, renderedMatch.sportName, renderedMatch.scoringType)
          }
        }
      } else {
        nextScore = await MinusPoint(matchID, gameNumber, side)
        if (!renderedMatch.isManualServiceMode && renderedMatch.sportName !== 'pickleball') {
          const otherSide = side === 'A' ? 'B' : 'A'
          const combinedPoints = nextScore + (renderedMatch[`game${gameNumber}${otherSide}Score`] || 0)
          await updateService(matchID, renderedMatch.isAInitialServer, gameNumber, combinedPoints, renderedMatch.changeServeEveryXPoints, renderedMatch.pointsToWinGame, renderedMatch.sportName, renderedMatch.scoringType)
        }
      }

      const refreshed = await refreshMatch()
      if (!refreshed) return
      const refreshedMatch = refreshed

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
    } catch (error) {
      setPendingPointUpdate(null)
      setLocalConflictMessage(error instanceof Error ? error.message : 'Unable to save the point right now.')
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
    if (renderedMatch && !hasActiveGame(renderedMatch)) {
      await updateService(matchID, settingsDraft.isAInitialServer, getCurrentGameNumber(renderedMatch) || 1, 0, Number(settingsDraft.changeServeEveryXPoints), Number(settingsDraft.pointsToWinGame), renderedMatch.sportName, settingsDraft.scoringType)
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
    if (!matchID || !renderedMatch) return
    const gameNumber = getCurrentGameNumber(renderedMatch) || 1
    await startGame(matchID, gameNumber)
    await updateService(
      matchID,
      settingsDraft.isAInitialServer,
      gameNumber,
      0,
      Number(settingsDraft.changeServeEveryXPoints),
      Number(settingsDraft.pointsToWinGame),
      renderedMatch.sportName,
      settingsDraft.scoringType
    )
    setShowGameEndDialog(false)
    await refreshMatch()
  }

  const canCreateAdHocMatch = !hasCapabilitySession || Boolean(
    resolvedCapability &&
    !resolvedCapability.matchID &&
    (
      resolvedCapability.capabilityType === 'table_scoring' ||
      resolvedCapability.capabilityType === 'team_match_scoring'
    )
  )
  const canFinalizeAssignedTableMatch = mode === 'table' && Boolean(tableID && matchID && renderedMatch)

  const handleCreateMatch = async () => {
    if (!canCreateAdHocMatch) return
    // Show match setup wizard instead of creating immediately
    setWizardDraft({
      playerA: { firstName: '', lastName: '', jerseyColor: '#3B82F6', country: '' },
      playerB: { firstName: '', lastName: '', jerseyColor: '#EF4444', country: '' },
      isDoubles: false,
      bestOf: 5,
      pointsToWinGame: 11,
      changeServeEveryXPoints: 2,
      scoringType: 'normal',
      warmupDurationSeconds: 120,
      sportName: (mode === 'table' ? tableInfo?.sportName : teamMatch?.sportName) || 'tableTennis',
    })
    setShowMatchWizard(true)
  }

  const handleStartMatchFromWizard = async (wizardData: WizardDraft) => {
    setShowMatchWizard(false)
    if (!wizardData) return

    setActiveAction('start-match')

    // Start warmup if configured
    if (wizardData.warmupDurationSeconds > 0) {
      setWarmupSecondsRemaining(wizardData.warmupDurationSeconds)
      setWarmupActive(true)
      const interval = setInterval(() => {
        setWarmupSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setWarmupActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      setWarmupIntervalState(interval)
    }

    const sportName = wizardData.sportName || 'tableTennis'

    if (mode === 'table' && tableID && tableInfo) {
      if (matchID && renderedMatch && isMatchFinished(renderedMatch)) {
        await finalizeCurrentTableMatch(tableID, matchID, renderedMatch, false)
      }
      const newMatchID = await createNewMatch(tableID, sportName, null, false, wizardData.scoringType || 'normal')
      if (!newMatchID) {
        setActiveAction('')
        setWarmupActive(false)
        return
      }
      setActiveAction('')
      return
    }

    if (mode === 'teamMatch' && teamMatchID && teamMatch) {
      const newMatchID = await createTeamMatchNewMatch(teamMatchID, activeTableNumber, sportName, null, wizardData.scoringType || 'normal')
      if (!newMatchID) {
        setActiveAction('')
        setWarmupActive(false)
        return
      }
    }
    setActiveAction('')
  }

  const handleSkipWarmup = () => {
    if (warmupInterval) clearInterval(warmupInterval)
    setWarmupIntervalState(null)
    setWarmupActive(false)
    setWarmupSecondsRemaining(0)
  }

  const nextQueuedTableMatch = mode === 'table' && tableInfo?.scheduledMatches && typeof tableInfo.scheduledMatches === 'object'
    ? getNextPromotableScheduledMatch(Object.entries(tableInfo.scheduledMatches as Record<string, ScheduledMatch>))
    : null
  const autoAdvanceMode = mode === 'table' ? (tableInfo?.autoAdvanceMode || 'manual') : 'manual'
  const autoAdvanceDelaySeconds = mode === 'table' ? Number(tableInfo?.autoAdvanceDelaySeconds || 0) : 0

  const handlePromoteNextAfterMatch = async () => {
    if (mode !== 'table' || !tableID || !matchID || !renderedMatch) return
    setActiveAction('promote-next')
    await finalizeCurrentTableMatch(tableID, matchID, renderedMatch, true)
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
  }, [showMatchEndDialog, mode, canFinalizeAssignedTableMatch, autoAdvanceMode, autoAdvanceDelaySeconds, nextQueuedTableMatch, tableID, matchID, renderedMatch])

  const handleCopyScoringLink = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      setCopiedLink(url)
      window.setTimeout(() => setCopiedLink(''), 1500)
    }
  }

  const persistInlineSettings = async (nextSettings: typeof settingsDraft) => {
    if (!matchID || !renderedMatch) return
    setActiveAction('settings-inline')
    await Promise.all([
      setBestOf(matchID, Number(nextSettings.bestOf)),
      setGamePointsToWinGame(matchID, Number(nextSettings.pointsToWinGame)),
      setChangeServiceEveryXPoints(matchID, Number(nextSettings.changeServeEveryXPoints)),
      setIsDoubles(matchID, nextSettings.isDoubles),
      setInitialMatchServer(matchID, nextSettings.isAInitialServer),
      setisManualMode(matchID, nextSettings.isManualServiceMode),
      setScoringType(matchID, nextSettings.scoringType),
      syncShowInBetweenGamesModal(matchID, false),
    ])
    if (!hasActiveGame(renderedMatch)) {
      await updateService(
        matchID,
        nextSettings.isAInitialServer,
        getCurrentGameNumber(renderedMatch) || 1,
        0,
        Number(nextSettings.changeServeEveryXPoints),
        Number(nextSettings.pointsToWinGame),
        renderedMatch.sportName,
        nextSettings.scoringType
      )
    }
    await refreshMatch()
    setActiveAction('')
  }

  const updateInlineSettings = async (patch: Partial<typeof settingsDraft>) => {
    const nextSettings = { ...settingsDraft, ...patch }
    setSettingsDraft(nextSettings)
    await persistInlineSettings(nextSettings)
  }

  const handleStartCurrentGame = async () => {
    if (!matchID || !renderedMatch || isMatchFinished(renderedMatch)) return
    setActiveAction('start-game')
    const gameNumber = getCurrentGameNumber(renderedMatch) || 1
    await startGame(matchID, gameNumber)
    await updateService(
      matchID,
      settingsDraft.isAInitialServer,
      gameNumber,
      0,
      Number(settingsDraft.changeServeEveryXPoints),
      Number(settingsDraft.pointsToWinGame),
      renderedMatch.sportName,
      settingsDraft.scoringType
    )
    await refreshMatch()
    setActiveAction('')
  }

  const leftSide = renderedMatch?.isSwitched ? 'B' : 'A'
  const rightSide = renderedMatch?.isSwitched ? 'A' : 'B'
  const teamMatchTables = teamMatch?.currentMatches ? Object.keys(teamMatch.currentMatches) : ['1']
  const scoreActionsDisabled = !matchID || Boolean(pendingPointUpdate) || showGameEndDialog || showMatchEndDialog || effectiveMatchSyncStatus === 'conflict' || effectiveMatchSyncStatus === 'offline' || effectiveMatchSyncStatus === 'unauthorized' || !!renderedMatch?.isInBetweenGames || (renderedMatch ? isMatchFinished(renderedMatch) : false)
  const currentGameNumber = getCurrentGameNumber(renderedMatch) || 1
  const currentGameStarted = Boolean(renderedMatch?.[`isGame${currentGameNumber}Started`])
  const currentGameFinished = Boolean(renderedMatch?.[`isGame${currentGameNumber}Finished`])
  const canStartCurrentGame = Boolean(
    matchID
      && renderedMatch
      && !showGameEndDialog
      && !showMatchEndDialog
      && !isMatchFinished(renderedMatch)
      && (!currentGameStarted || currentGameFinished || !hasActiveGame(renderedMatch) || Boolean(renderedMatch?.isInBetweenGames))
  )
  const scoringContextLabel = [renderedMatch?.matchRound || renderedMatch?.context?.matchRound || '', renderedMatch?.eventName || renderedMatch?.context?.eventName || ''].filter(Boolean).join(' • ')
  const handleCompleteAction = () => {
    if (renderedMatch && isMatchFinished(renderedMatch)) {
      setShowMatchEndDialog(true)
      return
    }
    if (currentGameFinished) {
      setShowGameEndDialog(true)
    }
  }

  if (authLoading || loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!accessGranted) {
    if (mode === 'teamMatch') {
      return (
        <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
          <Box className="premium-panel w-full max-w-md rounded-[2rem] p-6">
            <VStack className="gap-4">
              <Heading size="lg">Secure Link Required</Heading>
              <Text className="text-sm text-slate-500">Team-match scoring now requires a signed operator link or an authenticated owner session.</Text>
            </VStack>
          </Box>
        </Box>
      )
    }

    return (
      <Box className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <Box className="premium-panel w-full max-w-md rounded-[2rem] p-6">
          <VStack className="gap-4">
            <Heading size="lg">Enter Table Password</Heading>
            <Text className="text-sm text-slate-500">Legacy table passwords are exchanged for a short-lived secure operator session during the migration window.</Text>
            <Input type="password" value={passwordInput} onChangeText={setPasswordInput} placeholder="Table password" />
            {passwordError ? <Text className="text-sm text-red-600">{passwordError}</Text> : null}
            <Button
              action="primary"
              onClick={async () => {
                try {
                  await unlockTable(passwordInput)
                } catch {}
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
    <Box className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      <HStack className="items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <VStack className="min-w-0 gap-0">
          <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {mode === 'table' ? 'Table Scoring' : 'Team Match Scoring'}
          </Text>
          <HStack className="items-center gap-2 min-w-0">
            <Heading size="lg" className="truncate text-white whitespace-nowrap">
              {mode === 'table' ? tableInfo?.tableName || 'Scoring Station' : `${teamMatch?.sportDisplayName || 'Team Match'} • Table ${activeTableNumber}`}
            </Heading>
            {scoringContextLabel ? (
              <Text className="truncate text-xs text-slate-400 whitespace-nowrap">• {scoringContextLabel}</Text>
            ) : null}
          </HStack>
        </VStack>
        <HStack className="flex-1 items-center justify-end gap-2">
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={async () => { if (!matchID) return; setActiveAction('switch'); await switchSides(matchID); setActiveAction(''); }} disabled={!matchID || activeAction === 'switch'}>
            <Text className="text-white/90">Switch Sides</Text>
          </Button>
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => setShowTimeoutDialog(true)} disabled={!matchID}>
            <Text className="text-white/90">Timeout</Text>
          </Button>
          <Button variant="solid" className="bg-slate-700 text-white hover:bg-slate-600" onClick={() => setShowSettings(true)} disabled={!matchID}>
            <Text className="text-white">Settings</Text>
          </Button>
        </HStack>
      </HStack>

      {(syncStatus === 'error' || syncError) && (
        <VStack className="gap-2 px-4 py-3">
          <LiveStatusAlert status={syncStatus} error={syncError} className="bg-slate-900/80 text-white" />
        </VStack>
      )}
      {(effectiveMatchSyncStatus === 'error' || effectiveMatchSyncError) && (
        <VStack className="gap-2 px-4 py-3">
          <LiveStatusAlert status={effectiveMatchSyncStatus} error={effectiveMatchSyncError} className="bg-slate-900/80 text-white" />
        </VStack>
      )}

      {(mode === 'table' && !tableInfo) || (mode === 'teamMatch' && !teamMatch) ? (
        <Box className="flex min-h-0 flex-1 items-center justify-center p-6 text-white">
          <VStack className="items-center gap-4 text-center">
            <Heading size="lg" className="text-white">Station Unavailable</Heading>
            <Text className="max-w-md text-sm text-white/70">
              {mode === 'table'
                ? 'This table was reassigned, archived, or is no longer available.'
                : 'This team match no longer exposes the selected table while the screen is open.'}
            </Text>
          </VStack>
        </Box>
      ) : !renderedMatch ? (
        <Box className="flex min-h-0 flex-1 items-center justify-center p-6 text-white">
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
        <VStack className="min-h-0 flex-1 gap-0 overflow-hidden">
          {warmupActive ? (
            <Box className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95">
              <VStack className="items-center gap-6 rounded-3xl border border-white/10 bg-slate-900 p-12 shadow-2xl">
                <Text className="text-2xl font-bold uppercase tracking-[0.2em] text-white">Warm-up</Text>
                <Text className="text-8xl font-black text-white tabular-nums">
                  {Math.floor(warmupSecondsRemaining / 60)}:{(warmupSecondsRemaining % 60).toString().padStart(2, '0')}
                </Text>
                <Text className="text-sm text-slate-400">Get ready to play</Text>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={handleSkipWarmup}>
                  <Text className="text-white">Skip</Text>
                </Button>
              </VStack>
            </Box>
          ) : null}

          <Box className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
            <ScoreSide
              side={leftSide}
              isLeft={true}
              match={renderedMatch}
              disabled={scoreActionsDisabled}
              onAddPoint={() => applyPoint(leftSide, true)}
              onMinusPoint={() => applyPoint(leftSide, false)}
              onEditPlayer={(playerKey) => {
                setEditingPlayerKey(playerKey)
                setPlayerDraft({ ...getNewPlayer(), ...(renderedMatch?.[playerKey] || {}) })
                setShowPlayerEditor(true)
              }}
              onToggleServer={() => setServerManually(matchID, leftSide === 'A')}
            />
            <ScoreSide
              side={rightSide}
              isLeft={false}
              match={renderedMatch}
              disabled={scoreActionsDisabled}
              onAddPoint={() => applyPoint(rightSide, true)}
              onMinusPoint={() => applyPoint(rightSide, false)}
              onEditPlayer={(playerKey) => {
                setEditingPlayerKey(playerKey)
                setPlayerDraft({ ...getNewPlayer(), ...(renderedMatch?.[playerKey] || {}) })
                setShowPlayerEditor(true)
              }}
              onToggleServer={() => setServerManually(matchID, rightSide === 'A')}
            />
          </Box>
        </VStack>
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

      <SettingsOverlay
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={async (settings, updatedGames) => {
          if (!matchID) return
          setActiveAction('settings')
          await Promise.all([
            setBestOf(matchID, Number(settings.bestOf)),
            setGamePointsToWinGame(matchID, Number(settings.pointsToWinGame)),
            setChangeServiceEveryXPoints(matchID, Number(settings.changeServeEveryXPoints)),
            setIsDoubles(matchID, settings.isDoubles),
            setInitialMatchServer(matchID, settings.isAInitialServer),
            setisManualMode(matchID, settings.isManualServiceMode),
            setScoringType(matchID, settings.scoringType),
            syncShowInBetweenGamesModal(matchID, false),
          ])
          for (const { gameNumber, aScore, bScore } of updatedGames) {
            if (Number.isFinite(aScore) && Number.isFinite(bScore)) {
              await manuallySetGameScore(matchID, gameNumber, aScore, bScore)
            }
          }
          if (renderedMatch && !hasActiveGame(renderedMatch)) {
            await updateService(matchID, settings.isAInitialServer, getCurrentGameNumber(renderedMatch) || 1, 0, Number(settings.changeServeEveryXPoints), Number(settings.pointsToWinGame), renderedMatch.sportName, settings.scoringType)
          }
          setShowSettings(false)
          await refreshMatch()
          setActiveAction('')
        }}
        settings={settingsDraft}
        onSettingsChange={(patch) => setSettingsDraft((current) => ({ ...current, ...patch }))}
        manualGameScores={manualGameScores}
        onGameScoreChange={(gameNumber, side, value) => setManualGameScores((current) => ({ ...current, [gameNumber]: { ...current[gameNumber], [side]: value } }))}
        onDeleteGame={(gameNumber) => {
          setManualGameScores((current) => {
            const next = { ...current }
            delete next[gameNumber]
            return next
          })
        }}
        supportedSports={supportedSports}
        sportName={renderedMatch?.sportName}
        isDoubles={settingsDraft.isDoubles}
        activeAction={activeAction}
      />

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

      <MatchWizardModal
        isOpen={showMatchWizard}
        onClose={() => setShowMatchWizard(false)}
        onSave={handleStartMatchFromWizard}
        initialDraft={wizardDraft || undefined}
        isTeamMatch={mode === 'teamMatch'}
        sportName={mode === 'table' ? tableInfo?.sportName : teamMatch?.sportName}
      />
    </Box>
  )
}
