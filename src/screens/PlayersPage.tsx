import { useEffect, useState, useCallback } from 'react'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Text, VStack } from '@/components/ui'
import { ChevronRightIcon, PencilIcon, PlayersIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import {
  addImportedPlayer,
  addPlayerList,
  deleteImportedPlayer,
  deletePlayerList,
  editImportedPlayer,
  getPlayerFormatted,
  sortPlayers,
  subscribeToMyPlayerLists,
  subscribeToPlayerListPlayers,
  updatePlayerListName,
} from '@/functions/players'
import SyncIndicator from '@/components/realtime/SyncIndicator'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'
import { newImportedPlayer } from '@/classes/Player'
import countries from '@/flags/countries.json'
import LabeledField from '@/components/forms/LabeledField'

interface PlayerList {
  id: string
  playerListName: string
}

interface Player {
  firstName: string
  lastName: string
  imageURL?: string
  country?: string
  firstNameInitial?: boolean
  lastNameInitial?: boolean
}

type PlayerListEntry = [string, PlayerList]
type PlayerEntry = [string, Player]

const emptyPlayer = {
  firstName: '',
  lastName: '',
  imageURL: '',
  country: '',
} satisfies Player

const countryOptions = Object.entries(countries)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export default function PlayersPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [playerLists, setPlayerLists] = useState<PlayerListEntry[]>([])
  const [selectedList, setSelectedList] = useState<{ myPlayerListID: string; id: string; name: string } | null>(null)
  const [players, setPlayers] = useState<PlayerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')

  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showRenameListModal, setShowRenameListModal] = useState(false)
  const [pendingDeleteList, setPendingDeleteList] = useState<{ myPlayerListID: string; id: string; name: string } | null>(null)
  const [pendingDeletePlayer, setPendingDeletePlayer] = useState<{ id: string; name: string } | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<{ id: string; player: Player } | null>(null)

  const [newListName, setNewListName] = useState('')
  const [renamedListName, setRenamedListName] = useState('')
  const [playerDraft, setPlayerDraft] = useState<Player>(emptyPlayer)

  useEffect(() => {
    if (authLoading) return
    const unsubscribeState = subscribeToPathState(`users/${user?.uid || 'mylocalserver'}/myPlayerLists`, (state) => {
      setSyncStatus(state.status)
    })
    const unsubscribePlayerLists = subscribeToMyPlayerLists((lists) => {
      setPlayerLists((lists || []) as PlayerListEntry[])
      setLoading(false)
    }, user?.uid || 'mylocalserver')
    return () => {
      unsubscribeState()
      unsubscribePlayerLists()
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!selectedList?.id) {
      setPlayers([])
      return
    }

    return subscribeToPlayerListPlayers(selectedList.id, (playerData) => {
      setPlayers(playerData.length > 0 ? sortPlayers(playerData as PlayerEntry[]) as PlayerEntry[] : [])
    })
  }, [selectedList?.id])

  const handleSelectList = async (myPlayerListID: string, listId: string, listName: string) => {
    setSelectedList({ myPlayerListID, id: listId, name: listName })
    setShowPlayersModal(true)
  }

  const handleCreateList = async () => {
    if (!newListName.trim()) return

    await addPlayerList(newListName.trim())
    setNewListName('')
    setShowNewListModal(false)
  }

  const handleSavePlayer = async () => {
    if (!selectedList || (!playerDraft.firstName.trim() && !playerDraft.lastName.trim())) return

    if (editingPlayer) {
      await editImportedPlayer(selectedList.id, editingPlayer.id, playerDraft)
    } else {
      await addImportedPlayer(
        selectedList.id,
        newImportedPlayer(
          playerDraft.firstName.trim(),
          playerDraft.lastName.trim(),
          playerDraft.imageURL?.trim() || '',
          playerDraft.country?.trim().toUpperCase() || '',
        )
      )
    }

    setEditingPlayer(null)
    setPlayerDraft(emptyPlayer)
    setShowPlayerModal(false)
  }

  const handleRenameList = async () => {
    if (!selectedList || !renamedListName.trim()) return

    await updatePlayerListName(selectedList.myPlayerListID, selectedList.id, renamedListName.trim())
    setSelectedList({ ...selectedList, name: renamedListName.trim() })
    setShowRenameListModal(false)
  }

  const handleDeleteList = async () => {
    if (!pendingDeleteList) return

    await deletePlayerList(pendingDeleteList.myPlayerListID)
    if (selectedList?.myPlayerListID === pendingDeleteList.myPlayerListID) {
      setSelectedList(null)
      setPlayers([])
      setShowPlayersModal(false)
    }
    setPendingDeleteList(null)
  }

  const handleDeletePlayer = async () => {
    if (!selectedList || !pendingDeletePlayer) return

    await deleteImportedPlayer(selectedList.id, pendingDeletePlayer.id)
    setPendingDeletePlayer(null)
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to manage players</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              <Heading size="lg">Players</Heading>
              <SyncIndicator status={syncStatus} />
            </HStack>
            <Text className="text-gray-500 text-sm">Manage player lists and players</Text>
          </VStack>
          <Button size="sm" variant="solid" action="primary" onClick={() => setShowNewListModal(true)} className="w-full sm:w-auto">
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New List</Text>
          </Button>
        </HStack>

        <VStack space="sm">
          {playerLists.length === 0 ? (
            <Box className="p-8 text-center">
              <PlayersIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No player lists yet</Text>
              <Text className="text-gray-400 text-sm">Create a list to start adding players</Text>
            </Box>
          ) : (
            playerLists.map(([myPlayerListID, list]) => (
              <Card key={myPlayerListID} variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <Pressable
                      className="flex-1"
                      onPress={() => handleSelectList(myPlayerListID, list.id, list.playerListName)}
                    >
                      <VStack className="flex-1">
                        <Text fontWeight="bold">{list.playerListName}</Text>
                        <Text className="text-gray-500 text-sm">Player list</Text>
                      </VStack>
                    </Pressable>
                    <HStack className="flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/qrcode?capabilityType=player_registration&playerListID=${list.id}&label=${encodeURIComponent(list.playerListName)}`)} className="w-full sm:w-auto">
                        <Text>Secure Link</Text>
                      </Button>
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2"
                        onPress={() => {
                          setSelectedList({ myPlayerListID, id: list.id, name: list.playerListName })
                          setRenamedListName(list.playerListName)
                          setShowRenameListModal(true)
                        }}
                      >
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2"
                        onPress={() => setPendingDeleteList({ myPlayerListID, id: list.id, name: list.playerListName })}
                      >
                        <TrashIcon size={16} className="text-red-500" />
                      </Pressable>
                      <ChevronRightIcon size={20} className="text-gray-400" />
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))
          )}
        </VStack>
      </VStack>

      <OverlayDialog
        isOpen={showNewListModal}
        onClose={() => setShowNewListModal(false)}
        title="Create Player List"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowNewListModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleCreateList}>
              <Text className="text-white">Create</Text>
            </Button>
          </>
        )}
      >
        <LabeledField label="Player List Name">
          <Input placeholder="List name" value={newListName} onChangeText={setNewListName} />
        </LabeledField>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showRenameListModal}
        onClose={() => setShowRenameListModal(false)}
        title="Rename Player List"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowRenameListModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleRenameList}>
              <Text className="text-white">Save</Text>
            </Button>
          </>
        )}
      >
        <LabeledField label="Player List Name">
          <Input placeholder="List name" value={renamedListName} onChangeText={setRenamedListName} />
        </LabeledField>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showPlayersModal && !!selectedList}
        onClose={() => {
          setShowPlayersModal(false)
          setSelectedList(null)
          setPlayers([])
        }}
        title={selectedList?.name || 'Player List'}
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => navigate(`/bulkplayer?playerListID=${selectedList?.id || ''}`)}>
              <Text>Bulk Manage</Text>
            </Button>
            <Button variant="outline" onClick={() => setShowPlayersModal(false)}>
              <Text>Close</Text>
            </Button>
            <Button
              action="primary"
              onClick={() => {
                setEditingPlayer(null)
                setPlayerDraft(emptyPlayer)
                setShowPlayerModal(true)
              }}
            >
              <Text className="text-white">Add Player</Text>
            </Button>
          </>
        )}
      >
        {players.length === 0 ? (
          <Box className="py-10 text-center">
            <Text className="text-gray-500">No players in this list yet</Text>
          </Box>
        ) : (
          <VStack className="gap-3">
            {players.map(([playerId, player]) => (
              <Card key={playerId} variant="outline">
                <CardBody>
                  <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <VStack className="flex-1">
                      <Text className="font-medium text-slate-900">{getPlayerFormatted(player)}</Text>
                      <Text className="text-xs text-slate-500">{player.country || 'No country set'}</Text>
                    </VStack>
                    <HStack className="flex-wrap items-center gap-2">
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2"
                        onPress={() => {
                          setEditingPlayer({ id: playerId, player })
                          setPlayerDraft({
                            firstName: player.firstName || '',
                            lastName: player.lastName || '',
                            imageURL: player.imageURL || '',
                            country: player.country || '',
                          })
                          setShowPlayerModal(true)
                        }}
                      >
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2"
                        onPress={() => setPendingDeletePlayer({ id: playerId, name: getPlayerFormatted(player) })}
                      >
                        <TrashIcon size={16} className="text-red-500" />
                      </Pressable>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </OverlayDialog>

      <OverlayDialog
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        title={editingPlayer ? 'Edit Player' : 'Add Player'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowPlayerModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSavePlayer}>
              <Text className="text-white">{editingPlayer ? 'Save Changes' : 'Add Player'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="First Name">
            <Input placeholder="First name" value={playerDraft.firstName} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, firstName: value }))} />
          </LabeledField>
          <LabeledField label="Last Name">
            <Input placeholder="Last name" value={playerDraft.lastName} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, lastName: value }))} />
          </LabeledField>
          <LabeledField label="Image URL">
            <Input placeholder="Image URL" value={playerDraft.imageURL} onChangeText={(value) => setPlayerDraft((current) => ({ ...current, imageURL: value }))} />
          </LabeledField>
          <LabeledField label="Country">
            <Select value={playerDraft.country || ''} onValueChange={(value) => setPlayerDraft((current) => ({ ...current, country: value.toUpperCase() }))}>
              <option value="">Select country</option>
              {countryOptions.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
          </LabeledField>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteList}
        onClose={() => setPendingDeleteList(null)}
        onConfirm={handleDeleteList}
        title="Remove Player List"
        message={`Remove ${pendingDeleteList?.name || 'this list'} from your dashboard?`}
        description="This will archive the player list and clear any table assignments. The player list data will be preserved and can be recovered during the retention window."
        confirmLabel="Remove"
      />

      <ConfirmDialog
        isOpen={!!pendingDeletePlayer}
        onClose={() => setPendingDeletePlayer(null)}
        onConfirm={handleDeletePlayer}
        title="Remove Player"
        message={`Remove ${pendingDeletePlayer?.name || 'this player'} from the selected player list?`}
        confirmLabel="Remove"
      />
    </Box>
  )
}
