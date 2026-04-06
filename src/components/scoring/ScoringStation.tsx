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

function TeamPlayerPreview({ player, fallback }: { player: any; fallback: string }) {
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
        <Text className="text-base font-semibold text-white">{player?.firstName || player?.lastName ? `${player.firstName || ''} ${player.lastName || ''}`.trim() : fallback}</Text>
        <Text className="text-xs uppercase tracking-[0.16em] text-white/70">{player?.country || 'No country'}</Text>
      </VStack>
    </HStack>
  )
}

function ScoreSide({
  side,
  isLeft,
  match,
  onAddPoint,
  onMinusPoint,
  onEditPlayer,
  onSetServer,
}: {
  side: 'A' | 'B'
  isLeft: boolean
  match: any
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
  const sideColor = isSideA ? 'from-blue-700 via-blue-600 to-cyan-500' : 'from-slate-900 via-slate-800 to-slate-700'

  return (
    <Box className={`relative flex min-h-[calc(100vh-5rem)] flex-1 flex-col justify-between bg-gradient-to-b ${sideColor} px-4 py-5 text-white lg:px-6`}>
      <VStack className="gap-4">
        <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => onEditPlayer(primaryPlayerKey)}>
          <TeamPlayerPreview player={sidePlayer} fallback={isSideA ? 'Player A' : 'Player B'} />
        </Button>
        {match?.isDoubles ? (
          <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => onEditPlayer(secondaryPlayerKey)}>
            <TeamPlayerPreview player={sidePlayer2} fallback={isSideA ? 'Player A2' : 'Player B2'} />
          </Button>
        ) : null}
      </VStack>

      <VStack className="items-center gap-4 py-6">
        <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-white/90">Games Won: {matchScore}</Badge>
        <Text className="text-[8rem] font-black leading-none tracking-[-0.08em]">{gameScore}</Text>
        <HStack className="items-center gap-2">
          {servingThisSide ? <Badge className="rounded-full bg-white px-3 py-1 text-slate-900">Serving</Badge> : null}
          {match?.isGamePoint && isGamePoint(match) ? <Badge className="rounded-full bg-amber-300 px-3 py-1 text-slate-950">Game Point</Badge> : null}
          {match?.isMatchPoint && isGamePoint(match) && isFinalGame(match) ? <Badge className="rounded-full bg-rose-300 px-3 py-1 text-slate-950">Match Point</Badge> : null}
        </HStack>
      </VStack>

      <VStack className="gap-3">
        <Button action="primary" className="min-h-[7rem] rounded-[1.75rem] bg-white text-slate-950 hover:bg-slate-100" onClick={onAddPoint}>
          <Text className="text-5xl font-black text-slate-950">+</Text>
        </Button>
        <HStack className="gap-3">
          <Button variant="outline" className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={onMinusPoint}>
            <Text className="text-2xl font-black text-white">-</Text>
          </Button>
          <Button variant="outline" className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={onSetServer}>
            <Text className="text-sm font-semibold text-white">Set Server</Text>
          </Button>
        </HStack>
      </VStack>

      <Box className={`absolute ${isLeft ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80`}>
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

    const refreshed = await getMatchData(matchID)
    setMatch(refreshed)
    await syncPointFlags(refreshed)
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
    setMatch(await getMatchData(matchID))
  }

  const handleSavePlayer = async () => {
    if (!matchID || !editingPlayerKey) return
    await updateCurrentPlayer(matchID, editingPlayerKey, playerDraft)
    setShowPlayerEditor(false)
    setEditingPlayerKey('')
    setMatch(await getMatchData(matchID))
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
    <Box className="min-h-screen bg-slate-950">
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

      <HStack className="items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white">
        <HStack className="items-center gap-2">
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
            <Text className="ml-1 text-white">Settings</Text>
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
      </HStack>

      {!match ? (
        <Box className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6 text-white">
          <VStack className="items-center gap-4 text-center">
            <Heading size="lg" className="text-white">No active match</Heading>
            <Text className="max-w-md text-sm text-white/70">Create a new match to begin scoring on this station.</Text>
            <Button action="primary" onClick={handleCreateMatch}>
              <Text className="text-white">Start Match</Text>
            </Button>
          </VStack>
        </Box>
      ) : (
        <HStack className="min-h-[calc(100vh-8rem)] flex-col lg:flex-row">
          <ScoreSide
            side={leftSide}
            isLeft={true}
            match={match}
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
    </Box>
  )
}
