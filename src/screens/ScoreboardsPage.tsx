// @ts-nocheck
// Scoreboards Page
// Migrated from Expo MyScoreboards.tsx

import { Box, Heading, Text, VStack, Card, CardBody, HStack, Pressable, Button, Input } from '@/components/ui'
import { PlusIcon, ScoreboardIcon, ChevronRightIcon, TrashIcon } from '@/components/icons'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyScoreboards, addNewScoreboard, deleteMyScoreboard, getScoreboardTypesList } from '@/functions/scoreboards'
import { useAuth } from '@/lib/auth'

interface Scoreboard {
  id: string
  name: string
  type: string
  createdOn?: string
}

export default function ScoreboardsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  const [scoreboards, setScoreboards] = useState<[string, Scoreboard][]>([])
  const [scoreboardTypes, setScoreboardTypes] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newScoreboardName, setNewScoreboardName] = useState('')
  const [selectedType, setSelectedType] = useState('liveStream')

  const loadScoreboards = useCallback(async () => {
    try {
      const myScoreboards = await getMyScoreboards(user?.uid || 'mylocalserver')
      setScoreboards(myScoreboards)
      setScoreboardTypes(getScoreboardTypesList())
    } catch (error) {
      console.error('Error loading scoreboards:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    loadScoreboards()
  }, [authLoading, loadScoreboards])

  const handleAddScoreboard = async () => {
    if (!newScoreboardName.trim()) return
    
    try {
      await addNewScoreboard(newScoreboardName.trim(), selectedType)
      setNewScoreboardName('')
      setShowAddForm(false)
      await loadScoreboards()
    } catch (error) {
      console.error('Error adding scoreboard:', error)
    }
  }

  const handleDeleteScoreboard = async (myScoreboardId: string) => {
    try {
      await deleteMyScoreboard(myScoreboardId)
      await loadScoreboards()
    } catch (error) {
      console.error('Error deleting scoreboard:', error)
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
          <Text className="text-gray-600">Please sign in to manage scoreboards</Text>
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
          <Heading size="lg">My Scoreboards</Heading>
          <Button 
            size="sm" 
            variant="solid" 
            action="primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New</Text>
          </Button>
        </HStack>

        {showAddForm && (
          <Card variant="outline">
            <CardBody>
              <VStack space="sm">
                <Input
                  placeholder="Scoreboard Name"
                  value={newScoreboardName}
                  onChangeText={setNewScoreboardName}
                />
                <HStack className="justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button size="sm" action="primary" onClick={handleAddScoreboard}>
                    <Text className="text-white">Create</Text>
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <VStack space="sm">
          {scoreboards.length === 0 && !showAddForm ? (
            <Box className="p-8 text-center">
              <ScoreboardIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No scoreboards yet</Text>
              <Text className="text-gray-400 text-sm">Create your first scoreboard</Text>
            </Box>
          ) : (
            scoreboards.map(([myScoreboardId, scoreboard]) => (
              <Card key={myScoreboardId} variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="justify-between items-center">
                    <Pressable 
                      className="flex-1"
                      onPress={() => navigate(`/scoreboard/${scoreboard.id}`)}
                    >
                      <VStack className="flex-1">
                        <Text fontWeight="bold">{scoreboard.name}</Text>
                        <Text className="text-gray-500 text-sm">
                          {scoreboard.type || 'Live Stream'}
                        </Text>
                      </VStack>
                    </Pressable>
                    <HStack className="items-center">
                      <ChevronRightIcon size={20} className="text-gray-400" />
                      <Pressable
                        onPress={() => handleDeleteScoreboard(myScoreboardId)}
                        className="p-2 ml-2"
                      >
                        <TrashIcon size={18} className="text-red-500" />
                      </Pressable>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))
          )}
        </VStack>
      </VStack>
    </Box>
  )
}
