import { useEffect, useState } from 'react'
import { Avatar, Badge, Box, Button, Heading, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { CopyIcon, UserIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import LiveStatusAlert from '@/components/realtime/LiveStatusAlert'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import MatchWizardModal from './MatchWizardModal'
import SettingsOverlay from './SettingsOverlay'
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
} from '@/functions/scoring'
import { createTeamMatchNewMatch } from '@/functions/teammatches'
import { subscribeToTableRuntime, subscribeToTeamMatchRuntime } from '@/functions/liveSync'
import { isTableAccessRequired } from '@/functions/tables'
import { supportedSports } from '@/functions/sports'
import { getNewPlayer } from '@/classes/Player'
import countries from '@/flags/countries.json'
import { activateCapabilityToken, exchangeLegacyCapabilityLink, resolveCapabilityLink, type CapabilityRecord } from '@/functions/accessTokens'
import { useAuth } from '@/lib/auth'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { LiveSyncStatus } from '@/lib/liveSync'
import type {
  Match as MatchRecord,
  MatchPlayerKey,
  MatchSide,
  Player,
  ScheduledMatch,
  Table as TableRecord,
  TeamMatch as TeamMatchRecord,
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
                  {servingThisSide ? 'Serving' : 'Service'}
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [accessGranted, setAccessGranted] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [tableInfo, setTableInfo] = useState<TableRecord | null>(null)
  const [teamMatch, setTeamMatch] = useState<TeamMatchRecord | null>(null)
  const [activeTableNumber, setActiveTableNumber] = useState(teamMatchTableNumber || '1')
  const [matchID, setMatchID] = useState('')
  const [match, setMatch] = useState<MatchRecord | null>(null)
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
  const [resolvedCapability, setResolvedCapability] = useState<CapabilityRecord | null>(null)
  const hasCapabilitySession = Boolean(accessToken || resolvedCapability)
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null)
  const [judgeNote, setJudgeNote] = useState('')
  const [syncStatus, setSyncStatus] = useState<LiveSyncStatus>('loading')
  const [syncError, setSyncError] = useState('')
  const [matchSyncStatus, setMatchSyncStatus] = useState<LiveSyncStatus>('idle')
  const [matchSyncError, setMatchSyncError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setResolvedCapability(null)
      setAccessGranted(true)
      return
    }

    if (mode === 'teamMatch') {
      if (accessToken && teamMatchID) {
        resolveCapabilityLink(accessToken, 'team_match_scoring')
          .then((resolved) => {
            if (resolved?.record.teamMatchID === teamMatchID) {
              activateCapabilityToken(accessToken)
              setResolvedCapability(resolved.record)
              setAccessGranted(true)
              setPasswordError('')
              return
            }
            setResolvedCapability(null)
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
            setResolvedCapability(record)
            setAccessGranted(true)
            setPasswordError('')
            return
          }
          setResolvedCapability(null)
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

    return subscribeToTableRuntime({
      tableID,
      token: accessToken,
      capabilityType: 'table_scoring',
    }, (runtimeState) => {
      setSyncStatus(runtimeState.connection.status)
      setSyncError(runtimeState.connection.error)
      setTableInfo(runtimeState.table.value)
      setMatchID(runtimeState.currentMatchID)
      setMatch(runtimeState.currentMatch.value)
      setMatchSyncStatus(runtimeState.currentMatch.status)
      setMatchSyncError(runtimeState.currentMatch.error)
      if (runtimeState.accessToken.value) {
        setResolvedCapability(runtimeState.accessToken.value)
      }
      if (!user && runtimeState.accessToken.status === 'unauthorized') {
        setAccessGranted(false)
        setPasswordError('This scoring link is invalid, expired, or has been revoked.')
      }
      setLoading(runtimeState.table.status === 'loading' && !runtimeState.table.value)
    })
  }, [accessGranted, mode, tableID, accessToken, user])

  useEffect(() => {
    if (!accessGranted || mode !== 'teamMatch' || !teamMatchID) return

    return subscribeToTeamMatchRuntime({
      teamMatchID,
      tableNumber: activeTableNumber,
      token: accessToken,
      capabilityType: 'team_match_scoring',
    }, (runtimeState) => {
      setSyncStatus(runtimeState.connection.status)
      setSyncError(runtimeState.connection.error)
      setTeamMatch(runtimeState.teamMatch.value)
      setMatchID(runtimeState.currentMatchID)
      setMatch(runtimeState.currentMatch.value)
      setMatchSyncStatus(runtimeState.currentMatch.status)
      setMatchSyncError(runtimeState.currentMatch.error)
      if (runtimeState.accessToken.value) {
        setResolvedCapability(runtimeState.accessToken.value)
      }
      if (!user && runtimeState.accessToken.status === 'unauthorized') {
        setAccessGranted(false)
        setPasswordError('This scoring link is invalid, expired, or has been revoked.')
      }
      setLoading(runtimeState.teamMatch.status === 'loading' && !runtimeState.teamMatch.value)
    })
  }, [accessGranted, mode, teamMatchID, activeTableNumber, accessToken, user])

  useEffect(() => {
    if (!accessGranted || mode !== 'table' || !tableID || resolvedCapability) return

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
  }, [accessGranted, mode, tableID, user, resolvedCapability])

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
    if (match && !hasActiveGame(match)) {
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

  const canCreateAdHocMatch = !hasCapabilitySession || Boolean(
    resolvedCapability &&
    !resolvedCapability.matchID &&
    (
      resolvedCapability.capabilityType === 'table_scoring' ||
      resolvedCapability.capabilityType === 'team_match_scoring'
    )
  )
  const canFinalizeAssignedTableMatch = mode === 'table' && Boolean(tableID && matchID && match)

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
      if (matchID && match && isMatchFinished(match)) {
        await finalizeCurrentTableMatch(tableID, matchID, match, false)
      }
      const newMatchID = await createNewMatch(tableID, sportName, null, false, wizardData.scoringType || 'normal')
      if (!newMatchID) {
        setActiveAction('')
        setWarmupActive(false)
        return
      }
      setMatchID(newMatchID)
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
      setMatchID(newMatchID)
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
  const latestUndoablePointEvent = getLatestUndoablePointEvent(match)
  const recentPointHistory = getRecentPointHistory(match, 3)
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

  const persistInlineSettings = async (nextSettings: typeof settingsDraft) => {
    if (!matchID || !match) return
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
    if (!hasActiveGame(match)) {
      await updateService(
        matchID,
        nextSettings.isAInitialServer,
        getCurrentGameNumber(match) || 1,
        0,
        Number(nextSettings.changeServeEveryXPoints),
        Number(nextSettings.pointsToWinGame),
        match.sportName,
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
    if (!matchID || !match || isMatchFinished(match)) return
    setActiveAction('start-game')
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
    await refreshMatch()
    setActiveAction('')
  }

  const leftSide = match?.isSwitched ? 'B' : 'A'
  const rightSide = match?.isSwitched ? 'A' : 'B'
  const teamMatchTables = teamMatch?.currentMatches ? Object.keys(teamMatch.currentMatches) : ['1']
  const scoreActionsDisabled = !matchID || showGameEndDialog || showMatchEndDialog || !!match?.isInBetweenGames || (match ? isMatchFinished(match) : false)
  const currentGameNumber = getCurrentGameNumber(match) || 1
  const currentGameStarted = Boolean(match?.[`isGame${currentGameNumber}Started`])
  const currentGameFinished = Boolean(match?.[`isGame${currentGameNumber}Finished`])
  const canStartCurrentGame = Boolean(
    matchID
      && match
      && !showGameEndDialog
      && !showMatchEndDialog
      && !isMatchFinished(match)
      && (!currentGameStarted || currentGameFinished || !hasActiveGame(match) || Boolean(match?.isInBetweenGames))
  )
  const scoringContextLabel = [match?.matchRound || match?.context?.matchRound || '', match?.eventName || match?.context?.eventName || ''].filter(Boolean).join(' • ')
  const scoringTypeOptions = Object.entries((supportedSports[match?.sportName || '']?.scoringTypes || {}) as Record<string, { displayName: string }>)

  const handleCompleteAction = () => {
    if (match && isMatchFinished(match)) {
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
                  const exchanged = await exchangeLegacyCapabilityLink({
                    capabilityType: 'table_scoring',
                    tableID: tableID || '',
                    secret: passwordInput,
                  })
                  activateCapabilityToken(exchanged.token)
                  setResolvedCapability(exchanged.record)
                  setAccessGranted(true)
                  setPasswordError('')
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Incorrect password'
                  setPasswordError(message)
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
    <Box className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-white">
      <HStack className="items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <VStack className="min-w-0 gap-0">
          <Text className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {mode === 'table' ? 'Table Scoring' : 'Team Match Scoring'}
          </Text>
          <Heading size="lg" className="truncate text-white">
            {mode === 'table' ? tableInfo?.tableName || 'Scoring Station' : `${teamMatch?.sportDisplayName || 'Team Match'} • Table ${activeTableNumber}`}
          </Heading>
          {scoringContextLabel ? (
            <Text className="truncate text-xs text-slate-300">{scoringContextLabel}</Text>
          ) : null}
          <HStack className="flex-wrap gap-2 pt-2">
            <LiveStatusBadge status={syncStatus} prefix="Station" />
            <LiveStatusBadge status={matchSyncStatus} prefix="Match" />
          </HStack>
        </VStack>
        <HStack className="shrink-0 items-center gap-2">
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

      <VStack className="gap-2 px-4 py-3">
        <LiveStatusAlert status={syncStatus} error={syncError} className="bg-slate-900/80 text-white" />
        <LiveStatusAlert status={matchSyncStatus} error={matchSyncError} className="bg-slate-900/80 text-white" />
      </VStack>

      {!match ? (
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
          <Box className="border-b border-white/10 bg-slate-950 px-3 py-3 sm:px-4">
            <HStack className="flex-wrap items-end gap-3">
              {mode === 'teamMatch' ? (
                <VStack className="min-w-[8rem] gap-1">
                  <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Table</Text>
                  <Select value={activeTableNumber} onValueChange={setActiveTableNumber} className="min-h-[2.75rem] bg-white text-slate-900">
                    {teamMatchTables.map((tableNumber) => (
                      <option key={tableNumber} value={tableNumber}>{`Table ${tableNumber}`}</option>
                    ))}
                  </Select>
                </VStack>
              ) : null}

              <VStack className="gap-1">
                <Button action="primary" className="min-h-[2.75rem] rounded-xl px-6" onClick={handleStartCurrentGame} disabled={!canStartCurrentGame || activeAction === 'start-game' || warmupActive}>
                  {activeAction === 'start-game' ? <Spinner size="sm" /> : null}
                  <Text className="text-white">Start Game</Text>
                </Button>
              </VStack>

              <VStack className="gap-1">
                <Button variant="outline" className="min-h-[2.75rem] border-white/20 bg-white text-slate-900 hover:bg-slate-100" onClick={handleCompleteAction} disabled={!matchID || (!currentGameFinished && !isMatchFinished(match))}>
                  <Text className="text-slate-900">Complete Match</Text>
                </Button>
              </VStack>
            </HStack>
          </Box>

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
          if (match && !hasActiveGame(match)) {
            await updateService(matchID, settings.isAInitialServer, getCurrentGameNumber(match) || 1, 0, Number(settings.changeServeEveryXPoints), Number(settings.pointsToWinGame), match.sportName, settings.scoringType)
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
        sportName={match?.sportName}
        isDoubles={settingsDraft.isDoubles}
        activeAction={activeAction}
        matchID={matchID}
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
