// @ts-nocheck

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Badge, Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack } from '@/components/ui'
import { ArrowRightIcon, ChevronRightIcon, CopyIcon, PencilIcon, PlusIcon, ScoreboardIcon, SettingsIcon, TrashIcon, UserIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import {
  AddPoint,
  AWonRally_PB,
  BWonRally_PB,
  MinusPoint,
  endGame,
  getCurrentGameNumber,
  getCurrentGameScore,
  getCurrentMatchForTable,
  getMatchData,
  getMatchScore,
  getTableInfo,
  hasActiveGame,
  isFinalGame,
  isGameFinished,
  isGamePoint,
  isMatchFinished,
  setBestOf,
  setChangeServiceEveryXPoints,
  setGamePointsToWinGame,
  setInitialMatchServer,
  setIsDoubles,
  setIsGamePoint,
  setIsMatchPoint,
  setRedFlag,
  setScoringType,
  setServerManually,
  setYellowFlag,
  startGame,
  startTimeOut,
  switchSides,
  syncShowInBetweenGamesModal,
  updateCurrentPlayer,
  updateService,
  watchForPasswordChange,
  createNewMatch,
} from '@/functions/scoring'
import { createTeamMatchNewMatch, getTeamMatch, getTeamMatchCurrentMatch } from '@/functions/teammatches'
import { getTablePassword } from '@/functions/tables'
import { supportedSports } from '@/functions/sports'
import { getNewPlayer, newImportedPlayer } from '@/classes/Player'
import countries from '@/flags/countries.json'
import { useAuth } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

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

function TeamPlayerPreview({ player, fallback, textColor, mutedTextColor }: { player: any; fallback: string; textColor: string; mutedTextColor: string }) {
  const hasImage = Boolean(player?.imageURL?.trim())

  return (
    <HStack className="items-center gap-3">
      {hasImage ? (
        <Avatar src={player.imageURL} alt={fallback} className="h-12 w-12 rounded-2xl border border-white/40" />
      ) : (
        <Box className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10">
          <UserIcon size={18} className="text-white/80" />
        </Box>
      )}
      <VStack className="gap-0">
        <Text className="text-base font-semibold" style={{ color: textColor }}>{player?.firstName || player?.lastName ? `${player.firstName || ''} ${player.lastName || ''}`.trim() : fallback}</Text>
        <Text className="text-xs uppercase tracking-[0.16em]" style={{ color: mutedTextColor }}>{player?.country || 'No country'}</Text>
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
  onSetServer,
}: {
  side: 'A' | 'B'
  isLeft: boolean
  match: any
  disabled?: boolean
  onAddPoint: () => void | Promise<void>
  onMinusPoint: () => void | Promise<void>
  onEditPlayer: (playerKey: string) => void
  onSetServer: () => void | Promise<void>
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
    <Box className="relative flex min-h-0 flex-1 flex-col justify-between px-3 py-3 lg:px-4 lg:py-4" style={cardStyle}>
      <VStack className="gap-2">
        <Button variant="outline" className="min-h-[3.75rem] rounded-2xl px-3 py-2" style={overlayStyle} onClick={() => onEditPlayer(primaryPlayerKey)}>
          <TeamPlayerPreview player={sidePlayer} fallback={isSideA ? 'Player A' : 'Player B'} textColor={textColor} mutedTextColor={mutedTextColor} />
        </Button>
        {match?.isDoubles ? (
          <Button variant="outline" className="min-h-[3.75rem] rounded-2xl px-3 py-2" style={overlayStyle} onClick={() => onEditPlayer(secondaryPlayerKey)}>
            <TeamPlayerPreview player={sidePlayer2} fallback={isSideA ? 'Player A2' : 'Player B2'} textColor={textColor} mutedTextColor={mutedTextColor} />
          </Button>
        ) : null}
      </VStack>

      <VStack className="items-center gap-2 py-2">
        <Badge className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={overlayStyle}>Games Won {matchScore}</Badge>
        <Text className="text-center font-black leading-none tracking-[-0.08em]" style={{ color: textColor, fontSize: 'clamp(4rem, 11vw, 8rem)' }}>{gameScore}</Text>
        <HStack className="flex-wrap items-center justify-center gap-2">
          {servingThisSide ? <Badge className="rounded-full px-3 py-1" style={{ backgroundColor: textColor, color: backgroundColor }}>Serving</Badge> : null}
          {match?.isGamePoint && isGamePoint(match) ? <Badge className="rounded-full bg-amber-300 px-3 py-1 text-slate-950">Game Point</Badge> : null}
          {match?.isMatchPoint && isGamePoint(match) && isFinalGame(match) ? <Badge className="rounded-full bg-rose-300 px-3 py-1 text-slate-950">Match Point</Badge> : null}
        </HStack>
      </VStack>

      <VStack className="gap-2">
        <Button action="primary" className="min-h-[5.5rem] rounded-[1.75rem] hover:opacity-95" style={{ backgroundColor: textColor, color: backgroundColor }} onClick={onAddPoint} disabled={disabled}>
          <Text className="text-5xl font-black" style={{ color: backgroundColor }}>+</Text>
        </Button>
        <HStack className="gap-3">
          <Button variant="outline" className="flex-1 min-h-[3.75rem] rounded-2xl" style={overlayStyle} onClick={onMinusPoint} disabled={disabled}>
            <Text className="text-2xl font-black" style={{ color: textColor }}>-</Text>
          </Button>
          <Button variant="outline" className="flex-1 min-h-[3.75rem] rounded-2xl px-2" style={overlayStyle} onClick={onSetServer} disabled={disabled}>
            <Text className="text-sm font-semibold" style={{ color: textColor }}>Set Server</Text>
          </Button>
        </HStack>
      </VStack>

      <Box className={`absolute ${isLeft ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]`} style={overlayStyle}>
        {isLeft ? 'Left Side' : 'Right Side'}
      </Box>
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
    scoringType: 'normal',
  })
  const [copiedLink, setCopiedLink] = useState('')

  const loadMatchContext = useCallback(async () => {
    if (mode === 'table' && !tableID) return
    if (mode === 'teamMatch' && !teamMatchID) return

    setLoading(true)
    try {
      if (mode === 'table') {
        const info = await getTableInfo(tableID)
        setTableInfo(info)
        if (info?.currentMatch) {
          setMatchID(info.currentMatch)
          const matchData = await getMatchData(info.currentMatch)
          setMatch(matchData)
        } else {
          setMatchID('')
          setMatch(null)
        }
      } else {
        const nextTeamMatch = await getTeamMatch(teamMatchID)
        setTeamMatch(nextTeamMatch)
        const currentMatch = await getTeamMatchCurrentMatch(teamMatchID, activeTableNumber)
        if (currentMatch) {
          setMatchID(currentMatch)
          const matchData = await getMatchData(currentMatch)
          setMatch(matchData)
        } else {
          setMatchID('')
          setMatch(null)
        }
      }
    } catch (error) {
      console.error('Error loading scoring context:', error)
    } finally {
      setLoading(false)
    }
  }, [mode, tableID, teamMatchID, activeTableNumber])

  useEffect(() => {
    if (authLoading) return

    if (user) {
      setAccessGranted(true)
      loadMatchContext()
      return
    }

    if (mode === 'teamMatch') {
      setAccessGranted(false)
      setLoading(false)
      return
    }

    if (!tableID) {
      setLoading(false)
      return
    }

    getTablePassword(tableID)
      .then((password) => {
        if (!password) {
          setAccessGranted(true)
          loadMatchContext()
          return
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [authLoading, user, tableID, mode, loadMatchContext])

  useEffect(() => {
    if (!accessGranted || mode !== 'table' || !tableID) return

    const unsubscribe = watchForPasswordChange(tableID, async (nextPassword) => {
      if (!user && nextPassword && nextPassword !== passwordInput) {
        setAccessGranted(false)
        setPasswordError('The table password changed. Re-enter it to continue scoring.')
      }
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
        scoringType: match.scoringType || 'normal',
      })
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
    setMatch(refreshed)
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

    const currentGame = getCurrentGameNumber(refreshed) || gameNumber
    const gameDone = isGameFinished(
      refreshed.enforceGameScore,
      refreshed[`game${currentGame}AScore`],
      refreshed[`game${currentGame}BScore`],
      refreshed.pointsToWinGame
    )

    if (gameDone && !refreshed[`isGame${currentGame}Finished`]) {
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
    await switchSides(matchID)
    setMatch(await getMatchData(matchID))
  }

  const handleSaveSettings = async () => {
    if (!matchID) return
    await Promise.all([
      setBestOf(matchID, Number(settingsDraft.bestOf)),
      setGamePointsToWinGame(matchID, Number(settingsDraft.pointsToWinGame)),
      setChangeServiceEveryXPoints(matchID, Number(settingsDraft.changeServeEveryXPoints)),
      setIsDoubles(matchID, settingsDraft.isDoubles),
      setInitialMatchServer(matchID, settingsDraft.isAInitialServer),
      setScoringType(matchID, settingsDraft.scoringType),
      syncShowInBetweenGamesModal(matchID, false),
    ])
    if (!hasActiveGame(match)) {
      await updateService(matchID, settingsDraft.isAInitialServer, getCurrentGameNumber(match) || 1, 0, Number(settingsDraft.changeServeEveryXPoints), Number(settingsDraft.pointsToWinGame), match.sportName, settingsDraft.scoringType)
    }
    setShowSettings(false)
    await refreshMatch()
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

  const handleCreateMatch = async () => {
    if (mode === 'table' && tableID && tableInfo) {
      const newMatchID = await createNewMatch(tableID, tableInfo.sportName || 'tableTennis', null, false, tableInfo.scoringType || 'normal')
      setMatchID(newMatchID)
      setMatch(await getMatchData(newMatchID))
      return
    }

    if (mode === 'teamMatch' && teamMatchID && teamMatch) {
      const newMatchID = await createTeamMatchNewMatch(teamMatchID, activeTableNumber, teamMatch.sportName || 'tableTennis', null, teamMatch.scoringType || 'normal')
      setMatchID(newMatchID)
      setMatch(await getMatchData(newMatchID))
    }
  }

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
                const password = await getTablePassword(tableID || '')
                if (passwordInput === password) {
                  setAccessGranted(true)
                  setPasswordError('')
                  loadMatchContext()
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
          </VStack>
          <HStack className="gap-2">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleCopyScoringLink}>
              <CopyIcon size={14} />
              <Text className="ml-1 text-white">{copiedLink ? 'Copied' : 'Copy Link'}</Text>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate(mode === 'table' ? '/tables' : '/teammatches')}>
              <Text className="text-white">Back</Text>
            </Button>
          </HStack>
        </HStack>
      ) : null}

      <Box className="border-b border-white/10 bg-slate-900 px-3 py-2 text-white">
        <VStack className="gap-2">
          <Box className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => startTimeOut(matchID, 'A')} disabled={!matchID}>
              <Text className="text-white">A Timeout</Text>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => startTimeOut(matchID, 'B')} disabled={!matchID}>
              <Text className="text-white">B Timeout</Text>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={handleSwitchSides} disabled={!matchID}>
              <Text className="text-white">Switch Sides</Text>
            </Button>
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowSettings(true)} disabled={!matchID}>
              <SettingsIcon size={14} />
              <Text className="ml-1 text-white">Match Settings</Text>
            </Button>
          </Box>

          {mode === 'teamMatch' ? (
            <HStack className="items-center gap-2">
              <Text className="text-sm text-white/70">Table</Text>
              <Select value={activeTableNumber} onValueChange={setActiveTableNumber} className="min-w-[6rem] bg-white text-slate-900">
                {teamMatchTables.map((tableNumber) => (
                  <option key={tableNumber} value={tableNumber}>{tableNumber}</option>
                ))}
              </Select>
            </HStack>
          ) : (
            <Text className="text-xs uppercase tracking-[0.16em] text-white/60">
              Fullscreen scoring station for officials and venue-side operators
            </Text>
          )}
        </VStack>
      </Box>

      {!match ? (
        <Box className="flex h-[calc(100dvh-7.5rem)] items-center justify-center p-6 text-white">
          <VStack className="items-center gap-4 text-center">
            <Heading size="lg" className="text-white">No active match</Heading>
            <Text className="max-w-md text-sm text-white/70">Create a new match to begin scoring on this station.</Text>
            <Button action="primary" onClick={handleCreateMatch}>
              <Text className="text-white">Start Match</Text>
            </Button>
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
            onSetServer={() => setServerManually(matchID, leftSide === 'A')}
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
            onSetServer={() => setServerManually(matchID, rightSide === 'A')}
          />
        </HStack>
      )}

      <OverlayDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Scoring Settings"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveSettings}>
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
          {supportedSports[match?.sportName]?.hasScoringTypes ? (
            <Select value={settingsDraft.scoringType} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, scoringType: value }))}>
              {Object.entries(supportedSports[match?.sportName]?.scoringTypes || {}).map(([key, config]) => (
                <option key={key} value={key}>{config.displayName}</option>
              ))}
            </Select>
          ) : null}
          <Select value={settingsDraft.isAInitialServer ? 'A' : 'B'} onValueChange={(value) => setSettingsDraft((current) => ({ ...current, isAInitialServer: value === 'A' }))}>
            <option value="A">Player A serves first</option>
            <option value="B">Player B serves first</option>
          </Select>
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
          <Input placeholder="First name" value={playerDraft.firstName || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, firstName: value }))} />
          <Input placeholder="Last name" value={playerDraft.lastName || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, lastName: value }))} />
          <Input placeholder="Image URL" value={playerDraft.imageURL || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, imageURL: value }))} />
          <Select value={playerDraft.country || ''} onValueChange={(value) => setPlayerDraft((current) => ({ ...current, country: value }))}>
            <option value="">Select country</option>
            {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
          </Select>
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
            <Button action="primary" onClick={handleCreateMatch}>
              <Text className="text-white">Start New Match</Text>
            </Button>
          </>
        )}
      >
        <Text className="text-sm text-slate-600">No further points can be added until a new match or next assigned match is started.</Text>
      </OverlayDialog>
    </Box>
  )
}
