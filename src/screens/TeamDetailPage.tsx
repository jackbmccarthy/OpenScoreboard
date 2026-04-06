// @ts-nocheck

import { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack } from '@/components/ui'
import { ChevronRightIcon, PencilIcon, PlusIcon, TeamsIcon, TrashIcon, UserIcon } from '@/components/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import { getMyTeamEntryByTeamID, getTeam, updateMyTeam, updateTeam } from '@/functions/teams'
import countries from '@/flags/countries.json'
import { getNewPlayer } from '@/classes/Player'
import { v4 as uuidv4 } from 'uuid'

const countryOptions = Object.entries(countries)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

const emptyPlayerDraft = getNewPlayer()

function TeamImagePreview({ src, alt }) {
  const [hasError, setHasError] = useState(false)
  const hasImage = Boolean(src?.trim()) && !hasError

  return (
    <Box className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <TeamsIcon size={28} className="text-slate-300" />
      )}
    </Box>
  )
}

function PlayerImagePreview({ src, alt }) {
  const [hasError, setHasError] = useState(false)
  const hasImage = Boolean(src?.trim()) && !hasError

  return (
    <Box className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <UserIcon size={18} className="text-slate-300" />
      )}
    </Box>
  )
}

function parseBulkPlayers(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const columns = line.includes('\t') ? line.split('\t') : line.split(',')
      return {
        id: uuidv4(),
        firstName: (columns[0] || '').trim(),
        lastName: (columns[1] || '').trim(),
        imageURL: (columns[2] || '').trim(),
        country: (columns[3] || '').trim().toUpperCase(),
        clubName: (columns[4] || '').trim(),
        jerseyColor: (columns[5] || '').trim(),
        firstNameInitial: false,
        lastNameInitial: false,
        isImported: false,
      }
    })
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState(null)
  const [myTeamEntry, setMyTeamEntry] = useState(null)
  const [teamDraft, setTeamDraft] = useState({ teamName: '', teamLogoURL: '' })
  const [players, setPlayers] = useState([])
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingPlayerID, setEditingPlayerID] = useState<string | null>(null)
  const [playerDraft, setPlayerDraft] = useState(emptyPlayerDraft)
  const [bulkValue, setBulkValue] = useState('')
  const [pendingDeletePlayer, setPendingDeletePlayer] = useState<{ id: string; label: string } | null>(null)

  useEffect(() => {
    if (authLoading || !id) return

    async function loadTeam() {
      try {
        const [teamData, myTeamData] = await Promise.all([
          getTeam(id),
          getMyTeamEntryByTeamID(id),
        ])

        setTeam(teamData)
        setMyTeamEntry(myTeamData)
        setTeamDraft({
          teamName: teamData?.teamName || '',
          teamLogoURL: teamData?.teamLogoURL || '',
        })
        setPlayers(Object.entries(teamData?.players || {}))
      } catch (error) {
        console.error('Error loading team:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [authLoading, id])

  useEffect(() => {
    setBulkValue(
      players
        .map(([, player]) => [
          player.firstName || '',
          player.lastName || '',
          player.imageURL || '',
          player.country || '',
          player.clubName || '',
          player.jerseyColor || '',
        ].join('\t'))
        .join('\n')
    )
  }, [players])

  const saveTeam = async (nextTeamDraft = teamDraft, nextPlayers = players) => {
    if (!id) return

    const playerPayload = Object.fromEntries(
      nextPlayers.map(([playerID, player]) => [
        playerID,
        {
          ...getNewPlayer(),
          ...player,
          firstName: player.firstName || '',
          lastName: player.lastName || '',
          imageURL: player.imageURL || '',
          country: player.country || '',
          clubName: player.clubName || '',
          jerseyColor: player.jerseyColor || '',
          firstNameInitial: Boolean(player.firstNameInitial),
          lastNameInitial: Boolean(player.lastNameInitial),
          isImported: Boolean(player.isImported),
        },
      ])
    )

    await updateTeam(id, {
      teamName: nextTeamDraft.teamName.trim(),
      teamLogoURL: nextTeamDraft.teamLogoURL.trim(),
      players: playerPayload,
    })

    if (myTeamEntry?.[0]) {
      await updateMyTeam(myTeamEntry[0], nextTeamDraft.teamName.trim())
    }

    setTeam({
      ...(team || {}),
      teamName: nextTeamDraft.teamName.trim(),
      teamLogoURL: nextTeamDraft.teamLogoURL.trim(),
      players: playerPayload,
    })
  }

  const handleSaveTeamProfile = async () => {
    await saveTeam(teamDraft, players)
  }

  const openAddPlayer = () => {
    setEditingPlayerID(null)
    setPlayerDraft(getNewPlayer())
    setShowPlayerModal(true)
  }

  const openEditPlayer = (playerID, player) => {
    setEditingPlayerID(playerID)
    setPlayerDraft({
      ...getNewPlayer(),
      ...player,
    })
    setShowPlayerModal(true)
  }

  const handleSavePlayer = async () => {
    const nextPlayers = editingPlayerID
      ? players.map(([playerID, player]) => playerID === editingPlayerID ? [playerID, playerDraft] : [playerID, player])
      : [...players, [uuidv4(), playerDraft]]

    setPlayers(nextPlayers)
    setShowPlayerModal(false)
    setEditingPlayerID(null)
    await saveTeam(teamDraft, nextPlayers)
  }

  const handleDeletePlayer = async () => {
    if (!pendingDeletePlayer) return

    const nextPlayers = players.filter(([playerID]) => playerID !== pendingDeletePlayer.id)
    setPlayers(nextPlayers)
    setPendingDeletePlayer(null)
    await saveTeam(teamDraft, nextPlayers)
  }

  const handleApplyBulkPlayers = async () => {
    const parsedPlayers = parseBulkPlayers(bulkValue).map((player) => [player.id, player])
    setPlayers(parsedPlayers)
    setShowBulkModal(false)
    await saveTeam(teamDraft, parsedPlayers)
  }

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => `${a[1].lastName || ''}${a[1].firstName || ''}`.localeCompare(`${b[1].lastName || ''}${b[1].firstName || ''}`)),
    [players]
  )

  if (authLoading || loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!team) {
    return (
      <Box className="p-4">
        <VStack className="items-center gap-4 py-12 text-center">
          <TeamsIcon size={40} className="text-slate-300" />
          <Heading size="lg">Team not found</Heading>
          <Button onClick={() => navigate('/teams')}>
            <Text className="text-white">Back to Teams</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack className="gap-6">
        <HStack className="items-start justify-between gap-4">
          <HStack className="items-center gap-4">
            <TeamImagePreview src={teamDraft.teamLogoURL} alt={teamDraft.teamName || 'Team logo'} />
            <VStack className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Team</Text>
              <Heading size="2xl">{teamDraft.teamName || 'Untitled Team'}</Heading>
              <Text className="text-sm text-slate-500">{players.length} player{players.length === 1 ? '' : 's'}</Text>
            </VStack>
          </HStack>
          <Button variant="outline" onClick={() => navigate('/teams')}>
            <Text>Back to Teams</Text>
          </Button>
        </HStack>

        <Card>
          <CardBody>
            <VStack className="gap-4">
              <HStack className="items-center justify-between">
                <Heading size="lg">Team Details</Heading>
                <Button action="primary" onClick={handleSaveTeamProfile}>
                  <Text className="text-white">Save Team</Text>
                </Button>
              </HStack>
              <VStack className="gap-3">
                <Box>
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Team Name</Text>
                  <Input value={teamDraft.teamName} onChangeText={(value) => setTeamDraft((current) => ({ ...current, teamName: value }))} />
                </Box>
                <Box>
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Team Logo URL</Text>
                  <Input value={teamDraft.teamLogoURL} onChangeText={(value) => setTeamDraft((current) => ({ ...current, teamLogoURL: value }))} />
                </Box>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack className="gap-4">
              <HStack className="items-center justify-between gap-4">
                <VStack className="gap-1">
                  <Heading size="lg">Players</Heading>
                  <Text className="text-sm text-slate-500">Manage roster entries one at a time or in bulk.</Text>
                </VStack>
                <HStack className="gap-2">
                  <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                    <Text>Bulk Edit Players</Text>
                  </Button>
                  <Button action="primary" onClick={openAddPlayer}>
                    <PlusIcon size={16} />
                    <Text className="ml-1 text-white">Add Player</Text>
                  </Button>
                </HStack>
              </HStack>

              {sortedPlayers.length === 0 ? (
                <Box className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
                  <Text className="text-slate-500">No players in this team yet.</Text>
                </Box>
              ) : (
                <VStack className="gap-3">
                  {sortedPlayers.map(([playerID, player]) => (
                    <Card key={playerID} variant="outline">
                      <CardBody>
                        <HStack className="items-start justify-between gap-4">
                          <HStack className="items-start gap-3 flex-1">
                            <PlayerImagePreview src={player.imageURL} alt={`${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Player avatar'} />
                            <VStack className="gap-1 flex-1">
                              <Text className="font-semibold text-slate-900">{`${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unnamed Player'}</Text>
                              <Text className="text-xs text-slate-500">
                                {[player.country, player.clubName, player.jerseyColor].filter(Boolean).join(' • ') || 'No player settings configured'}
                              </Text>
                            </VStack>
                          </HStack>
                          <HStack className="gap-2">
                            <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditPlayer(playerID, player)}>
                              <PencilIcon size={16} className="text-slate-500" />
                            </Pressable>
                            <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeletePlayer({ id: playerID, label: `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'this player' })}>
                              <TrashIcon size={16} className="text-red-500" />
                            </Pressable>
                          </HStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      <OverlayDialog
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        title={editingPlayerID ? 'Edit Team Player' : 'Add Team Player'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowPlayerModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSavePlayer}>
              <Text className="text-white">{editingPlayerID ? 'Save Player' : 'Add Player'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Input placeholder="First name" value={playerDraft.firstName} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, firstName: value }))} />
          <Input placeholder="Last name" value={playerDraft.lastName} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, lastName: value }))} />
          <Input placeholder="Image URL" value={playerDraft.imageURL} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, imageURL: value }))} />
          <Select value={playerDraft.country || ''} onValueChange={(value) => setPlayerDraft((current) => ({ ...current, country: value }))}>
            <option value="">Select country</option>
            {countryOptions.map((country) => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </Select>
          <Input placeholder="Club name" value={playerDraft.clubName || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, clubName: value }))} />
          <Input placeholder="Jersey color" value={playerDraft.jerseyColor || ''} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, jerseyColor: value }))} />
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Edit Team Players"
        description="Paste rows from Excel, Google Sheets, or Numbers using this order: First Name, Last Name, Image URL, Country Code, Club Name, Jersey Color."
        size="xl"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleApplyBulkPlayers}>
              <Text className="text-white">Apply Bulk Changes</Text>
            </Button>
          </>
        )}
      >
        <textarea
          className="min-h-[320px] w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={bulkValue}
          onChange={(event) => setBulkValue(event.target.value)}
          placeholder={`First Name\tLast Name\tImage URL\tCountry Code\tClub Name\tJersey Color\nJane\tDoe\thttps://example.com/avatar.jpg\tUS\tOpen Scoreboard\tBlue`}
        />
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeletePlayer}
        onClose={() => setPendingDeletePlayer(null)}
        onConfirm={handleDeletePlayer}
        title="Remove Team Player"
        message={`Remove ${pendingDeletePlayer?.label || 'this player'} from the team roster?`}
        confirmLabel="Remove"
      />
    </Box>
  )
}
