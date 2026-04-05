// @ts-nocheck

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, ScoreboardIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { addNewScoreboard, deleteMyScoreboard, getMyScoreboards, getScoreboardTypesList, updateScoreboardDetails } from '@/functions/scoreboards'

const emptyScoreboardDraft = {
  name: '',
  type: 'liveStream',
}

export default function ScoreboardsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [scoreboards, setScoreboards] = useState([])
  const [scoreboardTypes, setScoreboardTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showScoreboardModal, setShowScoreboardModal] = useState(false)
  const [editingScoreboard, setEditingScoreboard] = useState(null)
  const [scoreboardDraft, setScoreboardDraft] = useState(emptyScoreboardDraft)
  const [pendingDeleteScoreboard, setPendingDeleteScoreboard] = useState(null)

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

  const openNewScoreboardModal = () => {
    setEditingScoreboard(null)
    setScoreboardDraft(emptyScoreboardDraft)
    setShowScoreboardModal(true)
  }

  const openEditScoreboardModal = (myScoreboardID, scoreboard) => {
    setEditingScoreboard({ myScoreboardID, scoreboardID: scoreboard.id })
    setScoreboardDraft({
      name: scoreboard.name || '',
      type: scoreboard.type || 'liveStream',
    })
    setShowScoreboardModal(true)
  }

  const handleSaveScoreboard = async () => {
    if (!scoreboardDraft.name.trim()) return

    if (editingScoreboard) {
      await updateScoreboardDetails(
        editingScoreboard.scoreboardID,
        editingScoreboard.myScoreboardID,
        scoreboardDraft.name.trim(),
        scoreboardDraft.type
      )
    } else {
      await addNewScoreboard(scoreboardDraft.name.trim(), scoreboardDraft.type)
    }

    setShowScoreboardModal(false)
    setEditingScoreboard(null)
    setScoreboardDraft(emptyScoreboardDraft)
    await loadScoreboards()
  }

  const handleDeleteScoreboard = async () => {
    if (!pendingDeleteScoreboard) return
    await deleteMyScoreboard(pendingDeleteScoreboard.myScoreboardID)
    setPendingDeleteScoreboard(null)
    await loadScoreboards()
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
          <Button size="sm" variant="solid" action="primary" onClick={openNewScoreboardModal}>
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New</Text>
          </Button>
        </HStack>

        <VStack className="gap-3">
          {scoreboards.length === 0 ? (
            <Box className="p-8 text-center">
              <ScoreboardIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No scoreboards yet</Text>
              <Text className="text-gray-400 text-sm">Create your first scoreboard</Text>
            </Box>
          ) : (
            scoreboards.map(([myScoreboardID, scoreboard]) => (
              <Card key={myScoreboardID} variant="elevated">
                <CardBody>
                  <HStack className="justify-between items-center gap-3">
                    <VStack className="flex-1">
                      <Text fontWeight="bold">{scoreboard.name}</Text>
                      <Text className="text-gray-500 text-sm">{scoreboard.type || 'Live Stream'}</Text>
                    </VStack>
                    <HStack className="items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/editor?sid=${scoreboard.id}`)}>
                        <Text>Editor</Text>
                      </Button>
                      <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditScoreboardModal(myScoreboardID, scoreboard)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteScoreboard({ myScoreboardID, name: scoreboard.name })}>
                        <TrashIcon size={16} className="text-red-500" />
                      </Pressable>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))
          )}
        </VStack>
      </VStack>

      <OverlayDialog
        isOpen={showScoreboardModal}
        onClose={() => setShowScoreboardModal(false)}
        title={editingScoreboard ? 'Edit Scoreboard' : 'Create Scoreboard'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowScoreboardModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveScoreboard}>
              <Text className="text-white">{editingScoreboard ? 'Save Changes' : 'Create Scoreboard'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Input placeholder="Scoreboard name" value={scoreboardDraft.name} onChangeText={(value) => setScoreboardDraft((current) => ({ ...current, name: value }))} />
          <Select value={scoreboardDraft.type} onValueChange={(value) => setScoreboardDraft((current) => ({ ...current, type: value }))}>
            {scoreboardTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </Select>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteScoreboard}
        onClose={() => setPendingDeleteScoreboard(null)}
        onConfirm={handleDeleteScoreboard}
        title="Remove Scoreboard"
        message={`Remove ${pendingDeleteScoreboard?.name || 'this scoreboard'} from your visible scoreboard list?`}
        confirmLabel="Remove"
      />
    </Box>
  )
}
