'use client'

import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Button, Input } from '@/components/ui'
import { PlusIcon, PlayersIcon, ChevronRightIcon } from '@/components/icons'
import { useState } from 'react'

// Mock player data - will be replaced with AceBase/Firebase data
const mockPlayers = [
  { id: '1', name: 'John Smith', email: 'john@example.com' },
  { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
]

export default function PlayersPage() {
  const [players, setPlayers] = useState(mockPlayers)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, { id: Date.now().toString(), name: newPlayerName, email: '' }])
      setNewPlayerName('')
      setShowAddForm(false)
    }
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Heading size="lg">Players</Heading>
          <Button 
            size="sm" 
            variant="solid" 
            action="primary"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">Add</Text>
          </Button>
        </HStack>

        {showAddForm && (
          <Card variant="outline">
            <CardBody>
              <VStack space="sm">
                <Input
                  placeholder="Player Name"
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                />
                <Button size="sm" onPress={addPlayer}>
                  <Text className="text-white">Save Player</Text>
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        <VStack space="sm">
          {players.map((player) => (
            <Pressable key={player.id}>
              <Card variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Text fontWeight="bold">{player.name}</Text>
                      {player.email && (
                        <Text className="text-gray-500 text-sm">{player.email}</Text>
                      )}
                    </VStack>
                    <ChevronRightIcon size={20} className="text-gray-400" />
                  </HStack>
                </CardBody>
              </Card>
            </Pressable>
          ))}
        </VStack>

        {players.length === 0 && (
          <Box className="p-8 text-center">
            <PlayersIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <Text className="text-gray-500">No players yet</Text>
            <Text className="text-gray-400 text-sm">Add your first player to get started</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
