// @ts-nocheck
// Teams Page
// Migrated from Expo MyTeams.tsx

import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Button, Input } from '@/components/ui'
import { PlusIcon, TeamsIcon, ChevronRightIcon, TrashIcon } from '@/components/icons'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTeams, addNewTeam, deleteMyTeam, getTeam } from '@/functions/teams'
import { useAuth } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

interface Team {
  teamName: string
  teamPlayers: Record<string, any>
  [key: string]: any
}

interface MyTeamEntry {
  id: string
  name: string
  createdOn?: string
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  const [teams, setTeams] = useState<[string, MyTeamEntry][]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  const loadTeams = useCallback(async () => {
    try {
      const myTeams = await getMyTeams(user?.uid || 'mylocalserver')
      setTeams(myTeams)
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (authLoading) return
    loadTeams()
  }, [authLoading, loadTeams])

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return
    
    try {
      const newTeam: Team = {
        teamName: newTeamName.trim(),
        teamPlayers: {}
      }
      await addNewTeam(newTeam)
      setNewTeamName('')
      setShowAddForm(false)
      await loadTeams()
    } catch (error) {
      console.error('Error adding team:', error)
    }
  }

  const handleDeleteTeam = async (myTeamId: string) => {
    try {
      await deleteMyTeam(myTeamId)
      await loadTeams()
    } catch (error) {
      console.error('Error deleting team:', error)
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
          <Text className="text-gray-600">Please sign in to manage teams</Text>
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
          <Heading size="lg">Teams</Heading>
          <Button 
            size="sm" 
            variant="solid" 
            action="primary"
            onClick={() => setShowAddForm(!showAddForm)}
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
                  placeholder="Team Name"
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                />
                <HStack className="justify-end space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                    <Text>Cancel</Text>
                  </Button>
                  <Button size="sm" action="primary" onClick={handleAddTeam}>
                    <Text className="text-white">Create Team</Text>
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <VStack space="sm">
          {teams.length === 0 && !showAddForm ? (
            <Box className="p-8 text-center">
              <TeamsIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No teams yet</Text>
              <Text className="text-gray-400 text-sm">Create your first team to get started</Text>
            </Box>
          ) : (
            teams.map(([myTeamId, team]) => (
              <Card key={myTeamId} variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="justify-between items-center">
                    <Pressable 
                      className="flex-1"
                      onPress={() => navigate(`/teams/${team.id}`)}
                    >
                      <VStack className="flex-1">
                        <Text fontWeight="bold">{team.name}</Text>
                        {team.createdOn && (
                          <Text className="text-gray-500 text-sm">
                            Created {new Date(team.createdOn).toLocaleDateString()}
                          </Text>
                        )}
                      </VStack>
                    </Pressable>
                    <HStack className="items-center">
                      <ChevronRightIcon size={20} className="text-gray-400" />
                      <Pressable
                        onPress={() => handleDeleteTeam(myTeamId)}
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
