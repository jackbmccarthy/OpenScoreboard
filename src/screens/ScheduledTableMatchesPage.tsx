import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Box, Text, VStack, HStack, Button, Spinner, Card, CardBody } from '@/components/ui'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { FormDialog, TextInputField } from '@/components/crud/FormDialog'
import {
  addScheduledMatch,
  createNewScheduledMatch,
  deleteScheduledTableMatch,
  getTableInfo,
  updateScheduledMatch,
} from '@/functions/scoring'
import { getScheduledTableMatches } from '@/functions/tables'

interface ScheduledMatch {
  matchID: string
  playerA?: string
  playerB?: string
  startTime?: string
}

export default function ScheduledTableMatchesPage() {
  const params = useParams<{ tableID?: string }>()
  const tableID = params.tableID
  const { user, loading: authLoading } = useAuth()
  const [matches, setMatches] = useState<[string, ScheduledMatch][]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sportName, setSportName] = useState('tableTennis')
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState({ scheduledMatchID: '', startTime: '' })
  const [pendingDelete, setPendingDelete] = useState<{ scheduledMatchID: string; label: string } | null>(null)

  const loadScheduledMatches = async () => {
    if (!tableID) {
      setMatches([])
      setLoading(false)
      return
    }

    try {
      const [result, tableInfo] = await Promise.all([
        getScheduledTableMatches(tableID),
        getTableInfo(tableID),
      ])
      setMatches((result || []) as [string, ScheduledMatch][])
      setSportName(tableInfo?.sportName || 'tableTennis')
    } catch (error) {
      console.error('Error loading scheduled matches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    loadScheduledMatches()
  }, [authLoading, tableID])

  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = new Date(a[1]?.startTime || 0).getTime()
    const dateB = new Date(b[1]?.startTime || 0).getTime()
    return dateA - dateB
  })

  const openCreateModal = () => {
    setDraft({ scheduledMatchID: '', startTime: '' })
    setShowModal(true)
  }

  const openEditModal = ([scheduledMatchID, match]: [string, ScheduledMatch]) => {
    setDraft({
      scheduledMatchID,
      startTime: match.startTime ? String(match.startTime).slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const handleSaveScheduledMatch = async () => {
    if (!tableID || !draft.startTime) {
      return
    }

    setIsSubmitting(true)
    try {
      if (draft.scheduledMatchID) {
        const existing = matches.find(([scheduledMatchID]) => scheduledMatchID === draft.scheduledMatchID)?.[1]
        if (!existing?.matchID) {
          return
        }
        await updateScheduledMatch(tableID, draft.scheduledMatchID, existing.matchID, new Date(draft.startTime).toISOString())
      } else {
        const matchID = await createNewScheduledMatch(sportName)
        await addScheduledMatch(tableID, matchID, new Date(draft.startTime).toISOString())
      }

      setShowModal(false)
      await loadScheduledMatches()
    } catch (error) {
      console.error('Error saving scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteScheduledMatch = async () => {
    if (!tableID || !pendingDelete) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteScheduledTableMatch(tableID, pendingDelete.scheduledMatchID)
      setPendingDelete(null)
      await loadScheduledMatches()
    } catch (error) {
      console.error('Error deleting scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Text className="text-gray-600">Please sign in to manage scheduled matches</Text>
          <Button onClick={() => window.location.assign('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Text className="text-2xl font-bold">Scheduled Matches</Text>
          <Button onClick={openCreateModal}>
            <Text className="text-white">+ New</Text>
          </Button>
        </HStack>

        {sortedMatches.length > 0 ? (
          <VStack space="sm">
            {sortedMatches.map(([scheduledMatchID, match]) => (
              <Card key={scheduledMatchID} variant="elevated">
                <CardBody>
                  <HStack className="justify-between items-start gap-3">
                    <VStack className="flex-1">
                      <Text className="font-bold">{match.playerA || 'TBD'} vs {match.playerB || 'TBD'}</Text>
                      {match.startTime ? (
                        <Text className="text-gray-600">{new Date(match.startTime).toLocaleString()}</Text>
                      ) : (
                        <Text className="text-gray-500 text-sm">No start time</Text>
                      )}
                    </VStack>
                    <HStack className="gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal([scheduledMatchID, match])}>
                        <Text>Edit</Text>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPendingDelete({ scheduledMatchID, label: `${match.playerA || 'TBD'} vs ${match.playerB || 'TBD'}` })}>
                        <Text>Remove</Text>
                      </Button>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No scheduled matches</Text>
              <Button onClick={openCreateModal}>
                <Text className="text-white">Create One</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      <FormDialog
        title={draft.scheduledMatchID ? 'Edit Scheduled Match' : 'Schedule Match'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveScheduledMatch}
        submitLabel={draft.scheduledMatchID ? 'Save Match' : 'Create Match'}
        isSubmitting={isSubmitting}
        isSubmitDisabled={!draft.startTime}
      >
        <TextInputField
          label="Start Time"
          type="datetime-local"
          value={draft.startTime}
          onChangeText={(value) => setDraft((current) => ({ ...current, startTime: value }))}
        />
      </FormDialog>

      <ConfirmDialog
        title="Remove Scheduled Match?"
        message={`This removes "${pendingDelete?.label || ''}" from the scheduled matches list.`}
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteScheduledMatch}
        confirmLabel="Remove Match"
      />
    </Box>
  )
}
