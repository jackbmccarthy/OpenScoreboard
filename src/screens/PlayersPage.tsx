// @ts-nocheck
// Players Page
// Migrated from Expo AddPlayers.tsx

import { Box, Heading, Text, VStack, HStack, Card, CardBody, Pressable, Button, Input, Modal, ModalBackdrop, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@/components/ui'
import { PlusIcon, PlayersIcon, ChevronRightIcon, TrashIcon } from '@/components/icons'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getMyPlayerLists, 
  addPlayerList, 
  getImportPlayerList, 
  addImportedPlayer, 
  deleteImportedPlayer,
  getPlayerFormatted,
  sortPlayers 
} from '@/functions/players'
import { useAuth } from '@/lib/auth'

interface PlayerList {
  id: string
  playerListName: string
  password: string
}

interface Player {
  firstName: string
  lastName: string
  firstNameInitial?: boolean
  lastNameInitial?: boolean
}

export default function PlayersPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  const [playerLists, setPlayerLists] = useState<[string, PlayerList][]>([])
  const [selectedList, setSelectedList] = useState<{ id: string; name: string } | null>(null)
  const [players, setPlayers] = useState<[string, Player][]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)
  
  // Form states
  const [newListName, setNewListName] = useState('')
  const [newPlayerFirstName, setNewPlayerFirstName] = useState('')
  const [newPlayerLastName, setNewPlayerLastName] = useState('')

  const loadPlayerLists = useCallback(async () => {
    try {
      const lists = await getMyPlayerLists()
      setPlayerLists(lists)
    } catch (error) {
      console.error('Error loading player lists:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    loadPlayerLists()
  }, [authLoading, loadPlayerLists])

  const handleCreateList = async () => {
    if (!newListName.trim()) return
    
    try {
      await addPlayerList(newListName.trim())
      setNewListName('')
      setShowNewListModal(false)
      await loadPlayerLists()
    } catch (error) {
      console.error('Error creating player list:', error)
    }
  }

  const handleSelectList = async (listId: string, listName: string) => {
    setSelectedList({ id: listId, name: listName })
    try {
      const playerData = await getImportPlayerList(listId)
      const sorted = sortPlayers(playerData)
      setPlayers(sorted)
      setShowPlayersModal(true)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleAddPlayer = async () => {
    if (!selectedList || (!newPlayerFirstName.trim() && !newPlayerLastName.trim())) return
    
    try {
      const playerSettings: Player = {
        firstName: newPlayerFirstName.trim(),
        lastName: newPlayerLastName.trim()
      }
      await addImportedPlayer(selectedList.id, playerSettings)
      setNewPlayerFirstName('')
      setNewPlayerLastName('')
      setShowAddPlayerModal(false)
      
      // Reload players
      const playerData = await getImportPlayerList(selectedList.id)
      setPlayers(sortPlayers(playerData))
    } catch (error) {
      console.error('Error adding player:', error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!selectedList) return
    
    try {
      await deleteImportedPlayer(selectedList.id, playerId)
      // Reload players
      const playerData = await getImportPlayerList(selectedList.id)
      setPlayers(playerData.length > 0 ? sortPlayers(playerData) : [])
    } catch (error) {
      console.error('Error deleting player:', error)
    }
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
        <HStack className="justify-between items-center">
          <Heading size="lg">Players</Heading>
          <Button 
            size="sm" 
            variant="solid" 
            action="primary"
            onClick={() => setShowNewListModal(true)}
          >
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
            playerLists.map(([listKey, list]) => (
              <Pressable
                key={listKey}
                onPress={() => handleSelectList(list.id, list.playerListName)}
              >
                <Card variant="elevated" className="mb-2">
                  <CardBody>
                    <HStack className="justify-between items-center">
                      <VStack className="flex-1">
                        <Text fontWeight="bold">{list.playerListName}</Text>
                        <Text className="text-gray-500 text-sm">List</Text>
                      </VStack>
                      <ChevronRightIcon size={20} className="text-gray-400" />
                    </HStack>
                  </CardBody>
                </Card>
              </Pressable>
            ))
          )}
        </VStack>
      </VStack>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Create New Player List</h3>
            <VStack space="sm">
              <Input
                placeholder="List Name"
                value={newListName}
                onChangeText={setNewListName}
              />
              <HStack className="justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewListModal(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button action="primary" onClick={handleCreateList}>
                  <Text className="text-white">Create</Text>
                </Button>
              </HStack>
            </VStack>
          </div>
        </div>
      )}

      {/* Players List Modal */}
      {showPlayersModal && selectedList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedList.name}</h3>
              <Button 
                size="sm" 
                variant="solid" 
                action="primary"
                onClick={() => setShowAddPlayerModal(true)}
              >
                <PlusIcon size={16} />
                <Text className="ml-1 text-white">Add</Text>
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {players.length === 0 ? (
                <Box className="text-center py-8">
                  <Text className="text-gray-500">No players in this list</Text>
                </Box>
              ) : (
                <VStack space="sm">
                  {players.map(([playerId, player]) => (
                    <Card key={playerId} variant="outline" className="relative">
                      <CardBody className="py-3">
                        <HStack className="justify-between items-center">
                          <Text>{getPlayerFormatted(player)}</Text>
                          <Pressable
                            onPress={() => handleDeletePlayer(playerId)}
                            className="p-2"
                          >
                            <TrashIcon size={18} className="text-red-500" />
                          </Pressable>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setShowPlayersModal(false)
                setSelectedList(null)
                setPlayers([])
              }}
            >
              <Text>Close</Text>
            </Button>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Add Player</h3>
            <VStack space="sm">
              <Input
                placeholder="First Name"
                value={newPlayerFirstName}
                onChangeText={setNewPlayerFirstName}
              />
              <Input
                placeholder="Last Name"
                value={newPlayerLastName}
                onChangeText={setNewPlayerLastName}
              />
              <HStack className="justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddPlayerModal(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button action="primary" onClick={handleAddPlayer}>
                  <Text className="text-white">Add</Text>
                </Button>
              </HStack>
            </VStack>
          </div>
        </div>
      )}
    </Box>
  )
}
