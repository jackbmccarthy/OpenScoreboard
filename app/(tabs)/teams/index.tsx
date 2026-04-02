'use client'

import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Button } from '@/components/ui'
import { PlusIcon, TeamsIcon, ChevronRightIcon } from '@/components/icons'
import { useState } from 'react'

// Mock team data
const mockTeams = [
  { id: '1', name: 'Team Alpha', players: 4 },
  { id: '2', name: 'Team Beta', players: 3 },
]

export default function TeamsPage() {
  const [teams, setTeams] = useState(mockTeams)
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Heading size="lg">Teams</Heading>
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

        <VStack space="sm">
          {teams.map((team) => (
            <Pressable key={team.id}>
              <Card variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Text fontWeight="bold">{team.name}</Text>
                      <Text className="text-gray-500 text-sm">{team.players} players</Text>
                    </VStack>
                    <ChevronRightIcon size={20} className="text-gray-400" />
                  </HStack>
                </CardBody>
              </Card>
            </Pressable>
          ))}
        </VStack>

        {teams.length === 0 && (
          <Box className="p-8 text-center">
            <TeamsIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <Text className="text-gray-500">No teams yet</Text>
            <Text className="text-gray-400 text-sm">Create your first team to get started</Text>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
