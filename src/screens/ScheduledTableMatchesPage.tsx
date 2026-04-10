import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Badge, Box, Input, Select, Text, VStack, HStack, Button, Spinner, Card, CardBody } from '@/components/ui'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { FormDialog, SelectField, TextAreaField, TextInputField } from '@/components/crud/FormDialog'
import {
  addScheduledMatch,
  canTransitionScheduledMatchStatus,
  copyScheduledTableMatchesToTable,
  createNewScheduledMatch,
  deleteScheduledTableMatch,
  promoteNextScheduledMatch,
  promoteScheduledTableMatch,
  reorderScheduledTableMatch,
  scheduledMatchStatusOptions,
  setScheduledTableMatchStatus,
  sortScheduledMatchEntries,
  updateScheduledMatch,
} from '@/functions/scoring'
import { getMyTables, subscribeToTable } from '@/functions/tables'
import type { ScheduledMatch, ScheduledMatchStatus } from '@/types/matches'

const statusLabelMap: Record<ScheduledMatchStatus, string> = {
  scheduled: 'Scheduled',
  queued: 'Queued',
  called: 'Called',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
}

const statusToneMap: Record<ScheduledMatchStatus, string> = {
  scheduled: 'bg-slate-100 text-slate-700',
  queued: 'bg-blue-100 text-blue-700',
  called: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
  archived: 'bg-slate-200 text-slate-600',
}

const editableScheduledMatchStatuses = scheduledMatchStatusOptions.filter((status) => status !== 'active')

type TableOption = {
  id: string
  tableName: string
}

export default function ScheduledTableMatchesPage() {
  const params = useParams<{ tableID?: string }>()
  const [searchParams] = useSearchParams()
  const tableID = params.tableID || searchParams.get('tableID') || ''
  const { user, loading: authLoading } = useAuth()
  const [matches, setMatches] = useState<[string, ScheduledMatch][]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sportName, setSportName] = useState('tableTennis')
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState({
    scheduledMatchID: '',
    startTime: '',
    status: 'scheduled' as ScheduledMatchStatus,
    operatorNotes: '',
    assignedScorerID: '',
  })
  const [pendingDelete, setPendingDelete] = useState<{ scheduledMatchID: string; label: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduledMatchStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScheduledMatchIDs, setSelectedScheduledMatchIDs] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<ScheduledMatchStatus>('queued')
  const [bulkStartTime, setBulkStartTime] = useState('')
  const [bulkFeedback, setBulkFeedback] = useState('')
  const [tableOptions, setTableOptions] = useState<TableOption[]>([])
  const [bulkTargetTableID, setBulkTargetTableID] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!tableID) {
      setMatches([])
      setLoading(false)
      return
    }

    return subscribeToTable(tableID, (tableInfo) => {
      const scheduledMatches = tableInfo?.scheduledMatches && typeof tableInfo.scheduledMatches === 'object'
        ? Object.entries(tableInfo.scheduledMatches as Record<string, ScheduledMatch>)
        : []
      setMatches(scheduledMatches)
      setSportName(typeof tableInfo?.sportName === 'string' ? tableInfo.sportName : 'tableTennis')
      setLoading(false)
    })
  }, [authLoading, tableID])

  useEffect(() => {
    if (authLoading || !user) return

    async function loadTableOptions() {
      const tables = await getMyTables()
      setTableOptions((tables || []).map(([, table]) => ({
        id: String((table as Record<string, unknown>).tableID || ''),
        tableName: String((table as Record<string, unknown>).tableName || 'Untitled Table'),
      })).filter((table) => table.id && table.id !== tableID))
    }

    void loadTableOptions()
  }, [authLoading, user, tableID])

  const sortedMatches = sortScheduledMatchEntries(matches)
  const promotableMatches = sortedMatches.filter(([, match]) => ['scheduled', 'queued', 'called', 'paused'].includes(match.status || 'scheduled'))
  const visibleMatches = sortedMatches.filter(([, match]) => {
    const statusMatches = statusFilter === 'all' ? true : match.status === statusFilter
    const searchValue = `${match.playerA || ''} ${match.playerB || ''} ${match.operatorNotes || ''}`.toLowerCase()
    const searchMatches = searchTerm.trim().length === 0 ? true : searchValue.includes(searchTerm.trim().toLowerCase())
    return statusMatches && searchMatches
  })
  const allVisibleSelected = visibleMatches.length > 0 && visibleMatches.every(([scheduledMatchID]) => selectedScheduledMatchIDs.includes(scheduledMatchID))

  const openCreateModal = () => {
    setDraft({
      scheduledMatchID: '',
      startTime: '',
      status: 'scheduled',
      operatorNotes: '',
      assignedScorerID: '',
    })
    setShowModal(true)
  }

  const openEditModal = ([scheduledMatchID, match]: [string, ScheduledMatch]) => {
    if (match.status === 'active') {
      return
    }
    setDraft({
      scheduledMatchID,
      startTime: match.startTime ? String(match.startTime).slice(0, 16) : '',
      status: (match.status || 'scheduled') as ScheduledMatchStatus,
      operatorNotes: match.operatorNotes || '',
      assignedScorerID: match.assignedScorerID || '',
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
        await updateScheduledMatch(tableID, draft.scheduledMatchID, existing.matchID, new Date(draft.startTime).toISOString(), {
          status: draft.status,
          operatorNotes: draft.operatorNotes,
          assignedScorerID: draft.assignedScorerID,
        })
      } else {
        const matchID = await createNewScheduledMatch(sportName)
        const scheduledMatchID = await addScheduledMatch(tableID, matchID, new Date(draft.startTime).toISOString())
        if (scheduledMatchID) {
          await updateScheduledMatch(tableID, scheduledMatchID, matchID, new Date(draft.startTime).toISOString(), {
            status: draft.status,
            operatorNotes: draft.operatorNotes,
            assignedScorerID: draft.assignedScorerID,
          })
        }
      }

      setShowModal(false)
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
    } catch (error) {
      console.error('Error deleting scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePromoteNext = async () => {
    if (!tableID) return
    setIsSubmitting(true)
    try {
      await promoteNextScheduledMatch(tableID)
    } catch (error) {
      console.error('Error promoting next scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePromoteSelected = async (scheduledMatchID: string) => {
    if (!tableID) return
    setIsSubmitting(true)
    try {
      await promoteScheduledTableMatch(tableID, scheduledMatchID)
    } catch (error) {
      console.error('Error promoting scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMove = async (scheduledMatchID: string, direction: 'up' | 'down') => {
    if (!tableID) return
    setIsSubmitting(true)
    try {
      await reorderScheduledTableMatch(tableID, scheduledMatchID, direction)
    } catch (error) {
      console.error('Error reordering scheduled match:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (scheduledMatchID: string, status: ScheduledMatchStatus) => {
    if (!tableID) return
    setIsSubmitting(true)
    try {
      await setScheduledTableMatchStatus(tableID, scheduledMatchID, status)
    } catch (error) {
      console.error('Error updating scheduled match status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleScheduledMatchSelection = (scheduledMatchID: string) => {
    setSelectedScheduledMatchIDs((current) => current.includes(scheduledMatchID)
      ? current.filter((id) => id !== scheduledMatchID)
      : [...current, scheduledMatchID])
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedScheduledMatchIDs((current) => current.filter((scheduledMatchID) => !visibleMatches.some(([visibleID]) => visibleID === scheduledMatchID)))
      return
    }
    setSelectedScheduledMatchIDs((current) => Array.from(new Set([...current, ...visibleMatches.map(([scheduledMatchID]) => scheduledMatchID)])))
  }

  const handleBulkStatusChange = async () => {
    if (!tableID || selectedScheduledMatchIDs.length === 0) return
    setIsSubmitting(true)
    let successCount = 0
    let failureCount = 0
    try {
      for (const scheduledMatchID of selectedScheduledMatchIDs) {
        try {
          await setScheduledTableMatchStatus(tableID, scheduledMatchID, bulkStatus)
          successCount += 1
        } catch {
          failureCount += 1
        }
      }
      setBulkFeedback(`Updated ${successCount} queue item${successCount === 1 ? '' : 's'}${failureCount ? `, ${failureCount} failed` : ''}.`)
      setSelectedScheduledMatchIDs([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkStartTime = async () => {
    if (!tableID || selectedScheduledMatchIDs.length === 0 || !bulkStartTime) return
    setIsSubmitting(true)
    let successCount = 0
    let failureCount = 0
    try {
      for (const scheduledMatchID of selectedScheduledMatchIDs) {
        const existing = matches.find(([currentScheduledMatchID]) => currentScheduledMatchID === scheduledMatchID)?.[1]
        if (!existing?.matchID) {
          failureCount += 1
          continue
        }
        try {
          await updateScheduledMatch(tableID, scheduledMatchID, existing.matchID, new Date(bulkStartTime).toISOString())
          successCount += 1
        } catch {
          failureCount += 1
        }
      }
      setBulkFeedback(`Rescheduled ${successCount} queue item${successCount === 1 ? '' : 's'}${failureCount ? `, ${failureCount} failed` : ''}.`)
      setSelectedScheduledMatchIDs([])
      setBulkStartTime('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkRemove = async () => {
    if (!tableID || selectedScheduledMatchIDs.length === 0) return
    setIsSubmitting(true)
    let successCount = 0
    let failureCount = 0
    try {
      for (const scheduledMatchID of selectedScheduledMatchIDs) {
        try {
          await deleteScheduledTableMatch(tableID, scheduledMatchID)
          successCount += 1
        } catch {
          failureCount += 1
        }
      }
      setBulkFeedback(`Removed ${successCount} queue item${successCount === 1 ? '' : 's'}${failureCount ? `, ${failureCount} failed` : ''}.`)
      setSelectedScheduledMatchIDs([])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkCopyOrMove = async (removeSource: boolean) => {
    if (!tableID || !bulkTargetTableID || selectedScheduledMatchIDs.length === 0) return
    setIsSubmitting(true)
    try {
      const result = await copyScheduledTableMatchesToTable(tableID, bulkTargetTableID, selectedScheduledMatchIDs, removeSource)
      setBulkFeedback(`${removeSource ? 'Moved' : 'Copied'} ${result.copied} queue item${result.copied === 1 ? '' : 's'}${result.skipped ? `, skipped ${result.skipped}` : ''}.`)
      setSelectedScheduledMatchIDs([])
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

  if (!tableID) {
    return (
      <Box className="flex items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Text className="text-gray-600">Choose a table before managing its queue.</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <VStack className="gap-1">
            <Text className="text-2xl font-bold">Table Queue</Text>
            <Text className="text-sm text-slate-500">{promotableMatches.length} promotable matches</Text>
          </VStack>
          <HStack className="gap-2">
            <Button variant="outline" onClick={handlePromoteNext} disabled={isSubmitting || promotableMatches.length === 0}>
              <Text>Promote Next</Text>
            </Button>
            <Button onClick={openCreateModal}>
              <Text className="text-white">+ New</Text>
            </Button>
          </HStack>
        </HStack>

        <HStack className="gap-3">
          <Input value={searchTerm} onChangeText={setSearchTerm} placeholder="Search competitors or notes" className="flex-1" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | ScheduledMatchStatus)} className="min-w-[12rem]">
            <option value="all">All statuses</option>
            {scheduledMatchStatusOptions.map((status) => (
              <option key={status} value={status}>{statusLabelMap[status]}</option>
            ))}
          </Select>
        </HStack>

        <Card variant="elevated">
          <CardBody>
            <VStack className="gap-3">
              <HStack className="items-center justify-between gap-3">
                <HStack className="items-center gap-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                  <Text className="text-sm text-slate-600">
                    {selectedScheduledMatchIDs.length} selected
                  </Text>
                </HStack>
                {bulkFeedback ? <Text className="text-sm text-slate-500">{bulkFeedback}</Text> : null}
              </HStack>
              <HStack className="flex-wrap gap-3">
                <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as ScheduledMatchStatus)} className="min-w-[12rem]">
                  {editableScheduledMatchStatuses.map((status) => (
                    <option key={status} value={status}>{statusLabelMap[status]}</option>
                  ))}
                </Select>
                <Button variant="outline" onClick={handleBulkStatusChange} disabled={isSubmitting || selectedScheduledMatchIDs.length === 0}>
                  <Text>Bulk Status</Text>
                </Button>
                <Input type="datetime-local" value={bulkStartTime} onChangeText={setBulkStartTime} className="min-w-[14rem]" />
                <Button variant="outline" onClick={handleBulkStartTime} disabled={isSubmitting || selectedScheduledMatchIDs.length === 0 || !bulkStartTime}>
                  <Text>Bulk Time</Text>
                </Button>
                <Select value={bulkTargetTableID} onValueChange={setBulkTargetTableID} className="min-w-[14rem]">
                  <option value="">Choose target table</option>
                  {tableOptions.map((table) => (
                    <option key={table.id} value={table.id}>{table.tableName}</option>
                  ))}
                </Select>
                <Button variant="outline" onClick={() => handleBulkCopyOrMove(false)} disabled={isSubmitting || selectedScheduledMatchIDs.length === 0 || !bulkTargetTableID}>
                  <Text>Bulk Copy</Text>
                </Button>
                <Button variant="outline" onClick={() => handleBulkCopyOrMove(true)} disabled={isSubmitting || selectedScheduledMatchIDs.length === 0 || !bulkTargetTableID}>
                  <Text>Bulk Move</Text>
                </Button>
                <Button variant="outline" onClick={handleBulkRemove} disabled={isSubmitting || selectedScheduledMatchIDs.length === 0}>
                  <Text>Bulk Remove</Text>
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {visibleMatches.length > 0 ? (
          <VStack space="sm">
            {visibleMatches.map(([scheduledMatchID, match]) => {
              const queuePosition = promotableMatches.findIndex(([currentScheduledMatchID]) => currentScheduledMatchID === scheduledMatchID)
              return (
              <Card key={scheduledMatchID} variant="elevated">
                <CardBody>
                  <VStack className="gap-3">
                    <HStack className="justify-between items-start gap-3">
                      <HStack className="flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedScheduledMatchIDs.includes(scheduledMatchID)}
                          onChange={() => toggleScheduledMatchSelection(scheduledMatchID)}
                        />
                        <VStack className="flex-1 gap-1">
                        <HStack className="items-center gap-2 flex-wrap">
                          <Text className="font-bold">{match.playerA || 'TBD'} vs {match.playerB || 'TBD'}</Text>
                          <Badge className={`rounded-full px-2.5 py-1 text-[11px] ${statusToneMap[(match.status || 'scheduled') as ScheduledMatchStatus]}`}>
                            {statusLabelMap[(match.status || 'scheduled') as ScheduledMatchStatus]}
                          </Badge>
                          {queuePosition >= 0 ? (
                            <Badge className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] text-white">Queue #{queuePosition + 1}</Badge>
                          ) : null}
                        </HStack>
                        {match.startTime ? (
                          <Text className="text-gray-600">{new Date(match.startTime).toLocaleString()}</Text>
                        ) : (
                          <Text className="text-gray-500 text-sm">No start time</Text>
                        )}
                        {match.assignedScorerID ? (
                          <Text className="text-xs text-slate-500">Assigned scorer: {match.assignedScorerID}</Text>
                        ) : null}
                        {match.operatorNotes ? (
                          <Text className="text-xs text-slate-500">{match.operatorNotes}</Text>
                        ) : null}
                        </VStack>
                      </HStack>
                      <HStack className="gap-2 flex-wrap justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePromoteSelected(scheduledMatchID)}
                          disabled={isSubmitting || !['scheduled', 'queued', 'called', 'paused'].includes(match.status || 'scheduled')}
                        >
                          <Text>Promote</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMove(scheduledMatchID, 'up')} disabled={isSubmitting}>
                          <Text>Up</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleMove(scheduledMatchID, 'down')} disabled={isSubmitting}>
                          <Text>Down</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEditModal([scheduledMatchID, match])} disabled={match.status === 'active'}>
                          <Text>Edit</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingDelete({ scheduledMatchID, label: `${match.playerA || 'TBD'} vs ${match.playerB || 'TBD'}` })}>
                          <Text>Remove</Text>
                        </Button>
                      </HStack>
                    </HStack>
                    <HStack className="flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(scheduledMatchID, 'called')}
                        disabled={isSubmitting || !canTransitionScheduledMatchStatus((match.status || 'scheduled') as ScheduledMatchStatus, 'called')}
                      >
                        <Text>Mark Called</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(scheduledMatchID, 'queued')}
                        disabled={isSubmitting || !canTransitionScheduledMatchStatus((match.status || 'scheduled') as ScheduledMatchStatus, 'queued')}
                      >
                        <Text>Mark Queued</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(scheduledMatchID, 'paused')}
                        disabled={isSubmitting || !canTransitionScheduledMatchStatus((match.status || 'scheduled') as ScheduledMatchStatus, 'paused')}
                      >
                        <Text>Pause</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(scheduledMatchID, 'completed')}
                        disabled={isSubmitting || !canTransitionScheduledMatchStatus((match.status || 'scheduled') as ScheduledMatchStatus, 'completed')}
                      >
                        <Text>Complete</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(scheduledMatchID, 'cancelled')}
                        disabled={isSubmitting || !canTransitionScheduledMatchStatus((match.status || 'scheduled') as ScheduledMatchStatus, 'cancelled')}
                      >
                        <Text>Cancel</Text>
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )})}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <Text className="text-xl text-gray-500">No queue items</Text>
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
        <SelectField
          label="Queue Status"
          value={draft.status}
          onChange={(value) => setDraft((current) => ({ ...current, status: value as ScheduledMatchStatus }))}
          options={editableScheduledMatchStatuses.map((status) => ({ label: statusLabelMap[status], value: status }))}
        />
        <TextInputField
          label="Assigned Scorer"
          value={draft.assignedScorerID}
          onChangeText={(value) => setDraft((current) => ({ ...current, assignedScorerID: value }))}
          placeholder="Optional scorer identifier"
        />
        <TextAreaField
          label="Operator Notes"
          value={draft.operatorNotes}
          onChange={(value) => setDraft((current) => ({ ...current, operatorNotes: value }))}
          placeholder="Late start, lineup pending, special instructions, etc."
          rows={4}
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
