'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Heading, HStack, Input, Select, Text, VStack } from '@/components/ui'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { tournamentScheduleBlockTypes, type TournamentScheduleBlockType } from '@/classes/Tournament'
import { useAuth } from '@/lib/auth'
import { getMyTables } from '@/functions/tables'
import {
  addTournamentBracket,
  createScheduleBlockFromBracketNode,
  addTournamentEvent,
  addTournamentRound,
  addTournamentPendingInvite,
  addTournamentStaffAssignment,
  bulkAssignTournamentRoundToTables,
  canTransferTournament,
  createTournamentScheduleMatch,
  addTournamentScheduleBlock,
  canManageTournament,
  canViewTournament,
  deleteTournamentBracket,
  deleteTournamentEvent,
  deleteTournamentRound,
  deleteTournamentScheduleBlock,
  deleteTournamentPendingInvite,
  deleteTournamentStaffAssignment,
  detectTournamentScheduleConflicts,
  generateTournamentScheduleFromFormat,
  generateTournamentBracketNodes,
  syncTournamentScheduleBlockToQueue,
  queueTournamentScheduleBlock,
  reorderTournamentRound,
  resendTournamentPendingInvite,
  subscribeToTournament,
  setTournamentRoundMatchAssignments,
  transitionTournamentRoundStatus,
  getTournamentEffectiveRole,
  getTournamentRoundProgressStatus,
  transferTournamentOwnership,
  updateTournamentPendingInvite,
  updateTournamentStaffAssignment,
  updateTournamentBracket,
  updateTournamentBracketNode,
  updateTournamentEvent,
  updateTournamentRound,
  updateTournamentScheduleBlock,
  updateTournament,
  type TournamentGrantRole,
  type TournamentBracketNode,
  type TournamentBracketRecord,
  type TournamentEventRecord,
  type TournamentPendingInviteRecord,
  type TournamentRecord,
  type TournamentRoundRecord,
  type TournamentScheduleBlockRecord,
  type TournamentStaffAssignmentRecord,
  type TournamentVisibility,
} from '@/functions/tournaments'

type TournamentTab = 'overview' | 'events' | 'brackets' | 'schedule' | 'staff' | 'registration' | 'public'

const tabs: Array<{ id: TournamentTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Events' },
  { id: 'brackets', label: 'Brackets' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'staff', label: 'Staff' },
  { id: 'registration', label: 'Registration' },
  { id: 'public', label: 'Public' },
]

function parseScheduleParticipants(value: string) {
  return Array.from(new Set(
    value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  ))
}

function formatScheduleDateTime(value: string) {
  if (!value) {
    return ''
  }
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) {
    return value
  }
  return new Date(timestamp).toLocaleString()
}

export default function TournamentDetailPage() {
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const tournamentID = params.id || ''
  const { user, loading: authLoading } = useAuth()
  const [tournament, setTournament] = useState<TournamentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TournamentTab>('overview')
  const [newEventName, setNewEventName] = useState('')
  const [newRoundTitle, setNewRoundTitle] = useState('')
  const [newRoundShortLabel, setNewRoundShortLabel] = useState('')
  const [newRoundEventID, setNewRoundEventID] = useState('')
  const [newRoundFormat, setNewRoundFormat] = useState<TournamentRoundRecord['format']>('standard')
  const [newRoundStartTime, setNewRoundStartTime] = useState('')
  const [newRoundEndTime, setNewRoundEndTime] = useState('')
  const [editingEventID, setEditingEventID] = useState('')
  const [editingEventName, setEditingEventName] = useState('')
  const [editingRoundID, setEditingRoundID] = useState('')
  const [editingRoundDraft, setEditingRoundDraft] = useState({
    title: '',
    shortLabel: '',
    eventID: '',
    format: 'standard' as TournamentRoundRecord['format'],
    visibility: 'private' as TournamentVisibility,
    scheduledStartTime: '',
    scheduledEndTime: '',
    notes: '',
    nextRoundID: '',
    autoAdvanceMode: 'unlock-only' as TournamentRoundRecord['autoAdvanceMode'],
    assignedMatchIDs: '',
    assignedTableIDs: [] as string[],
    advanceWhenComplete: true,
    allowManualOverrides: true,
    isPublished: false,
  })
  const [roundOverrideID, setRoundOverrideID] = useState('')
  const [newBracketName, setNewBracketName] = useState('')
  const [newBracketEventID, setNewBracketEventID] = useState('')
  const [newBracketFormat, setNewBracketFormat] = useState<TournamentBracketRecord['format']>('single-elimination')
  const [newBracketSeedCount, setNewBracketSeedCount] = useState('8')
  const [editingBracketID, setEditingBracketID] = useState('')
  const [editingBracketName, setEditingBracketName] = useState('')
  const [tableOptions, setTableOptions] = useState<Array<{ id: string; tableName: string }>>([])
  const [newScheduleTitle, setNewScheduleTitle] = useState('')
  const [newScheduleEventID, setNewScheduleEventID] = useState('')
  const [newScheduleRoundID, setNewScheduleRoundID] = useState('')
  const [newScheduleBlockType, setNewScheduleBlockType] = useState<TournamentScheduleBlockType>('match')
  const [newScheduleSourceMatchID, setNewScheduleSourceMatchID] = useState('')
  const [newScheduleTableID, setNewScheduleTableID] = useState('')
  const [newScheduleTime, setNewScheduleTime] = useState('')
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('')
  const [newScheduleParticipants, setNewScheduleParticipants] = useState('')
  const [newScheduleNotes, setNewScheduleNotes] = useState('')
  const [editingScheduleBlockID, setEditingScheduleBlockID] = useState('')
  const [selectedScheduleBlockIDs, setSelectedScheduleBlockIDs] = useState<string[]>([])
  const [scheduleEventFilter, setScheduleEventFilter] = useState('all')
  const [scheduleRoundFilter, setScheduleRoundFilter] = useState('all')
  const [bulkScheduleTableID, setBulkScheduleTableID] = useState('')
  const [scheduleBlockTypeFilter, setScheduleBlockTypeFilter] = useState<'all' | TournamentScheduleBlockType>('all')
  const [editingScheduleDraft, setEditingScheduleDraft] = useState({
    blockType: 'match' as TournamentScheduleBlockType,
    title: '',
    eventID: '',
    roundID: '',
    sourceMatchID: '',
    assignedTableID: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    participantLabels: '',
    notes: '',
    isPublished: true,
  })
  const [editingBracketSeeds, setEditingBracketSeeds] = useState('')
  const [editingBracketNode, setEditingBracketNode] = useState<{ bracketID: string; nodeID: string; sourceMatchID: string; status: string } | null>(null)
  const [bracketNodeScheduleTableID, setBracketNodeScheduleTableID] = useState('')
  const [bracketNodeScheduleTime, setBracketNodeScheduleTime] = useState('')
  const [newStaffSubjectID, setNewStaffSubjectID] = useState('')
  const [newStaffRole, setNewStaffRole] = useState<TournamentGrantRole>('admin')
  const [newStaffNote, setNewStaffNote] = useState('')
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<TournamentGrantRole>('viewer')
  const [newInviteNote, setNewInviteNote] = useState('')
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | TournamentGrantRole>('all')
  const [inviteRoleFilter, setInviteRoleFilter] = useState<'all' | TournamentGrantRole>('all')
  const [transferOwnerID, setTransferOwnerID] = useState('')

  useEffect(() => {
    if (authLoading || !tournamentID) return
    return subscribeToTournament(tournamentID, (nextTournament) => {
      setTournament(nextTournament)
      setLoading(false)
    })
  }, [authLoading, tournamentID])

  useEffect(() => {
    if (authLoading || !user) return
    async function loadTables() {
      const tables = await getMyTables()
      setTableOptions((tables || []).map(([, table]) => ({
        id: String((table as Record<string, unknown>).tableID || ''),
        tableName: String((table as Record<string, unknown>).tableName || 'Untitled Table'),
      })).filter((table) => table.id))
    }
    void loadTables()
  }, [authLoading, user])

  const visibility = useMemo(() => (tournament?.visibility || 'private') as TournamentVisibility, [tournament])
  const effectiveRole = useMemo(() => getTournamentEffectiveRole(tournament, user?.uid || ''), [tournament, user?.uid])
  const canManage = canManageTournament(effectiveRole)
  const canView = canViewTournament(effectiveRole)
  const canTransfer = canTransferTournament(effectiveRole)
  const updateField = async (patch: Partial<TournamentRecord>) => {
    if (!canManage) return
    await updateTournament(tournamentID, patch)
  }
  const eventEntries = useMemo(
    () => Object.entries((tournament?.events || {}) as Record<string, TournamentEventRecord>),
    [tournament?.events],
  )
  const roundEntries = useMemo(
    () => Object.entries((tournament?.rounds || {}) as Record<string, TournamentRoundRecord>)
      .sort((a, b) => (a[1].order || 0) - (b[1].order || 0)),
    [tournament?.rounds],
  )
  const bracketEntries = useMemo(
    () => Object.entries((tournament?.brackets || {}) as Record<string, TournamentBracketRecord>),
    [tournament?.brackets],
  )
  const scheduleEntries = useMemo(
    () => Object.entries((tournament?.scheduleBlocks || {}) as Record<string, TournamentScheduleBlockRecord>)
      .sort((a, b) => new Date(a[1].scheduledStartTime || 0).getTime() - new Date(b[1].scheduledStartTime || 0).getTime()),
    [tournament?.scheduleBlocks],
  )
  const staffEntries = useMemo(
    () => Object.entries((tournament?.staffAssignments || {}) as Record<string, TournamentStaffAssignmentRecord>),
    [tournament?.staffAssignments],
  )
  const pendingInviteEntries = useMemo(
    () => Object.entries((tournament?.pendingInvites || {}) as Record<string, TournamentPendingInviteRecord>),
    [tournament?.pendingInvites],
  )
  const visibleStaffEntries = useMemo(
    () => staffEntries.filter(([, assignment]) => staffRoleFilter === 'all' ? true : assignment.role === staffRoleFilter),
    [staffEntries, staffRoleFilter],
  )
  const visibleInviteEntries = useMemo(
    () => pendingInviteEntries.filter(([, invite]) => inviteRoleFilter === 'all' ? true : invite.role === inviteRoleFilter),
    [pendingInviteEntries, inviteRoleFilter],
  )
  const visibleScheduleEntries = useMemo(() => scheduleEntries.filter(([, scheduleBlock]) => {
    const eventMatches = scheduleEventFilter === 'all' ? true : scheduleBlock.eventID === scheduleEventFilter
    const roundMatches = scheduleRoundFilter === 'all' ? true : scheduleBlock.roundID === scheduleRoundFilter
    const typeMatches = scheduleBlockTypeFilter === 'all' ? true : scheduleBlock.blockType === scheduleBlockTypeFilter
    return eventMatches && roundMatches && typeMatches
  }), [scheduleBlockTypeFilter, scheduleEntries, scheduleEventFilter, scheduleRoundFilter])
  const scheduleConflictCount = useMemo(
    () => scheduleEntries.filter(([, scheduleBlock]) => scheduleBlock.hasConflicts).length,
    [scheduleEntries],
  )

  const toggleRoundDraftTable = (tableID: string) => {
    setEditingRoundDraft((current) => ({
      ...current,
      assignedTableIDs: current.assignedTableIDs.includes(tableID)
        ? current.assignedTableIDs.filter((currentTableID) => currentTableID !== tableID)
        : [...current.assignedTableIDs, tableID],
    }))
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <Text>Loading tournament...</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Text className="text-slate-600">Please sign in to manage tournaments</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  if (!tournament) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Heading size="lg">Tournament Not Found</Heading>
          <Button variant="outline" onClick={() => navigate('/tournaments')}>
            <Text>Back to Tournaments</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  if (!canView) {
    return (
      <Box className="flex-1 items-center justify-center p-8">
        <VStack className="items-center gap-3">
          <Heading size="lg">Tournament Access Restricted</Heading>
          <Text className="text-sm text-slate-600">You do not have an active tournament grant for this record.</Text>
          <Button variant="outline" onClick={() => navigate('/tournaments')}>
            <Text>Back to Tournaments</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack className="p-4 gap-4">
        <VStack className="gap-2">
          <Button variant="outline" onClick={() => navigate('/tournaments')} className="w-fit">
            <Text>Back</Text>
          </Button>
          <Heading size="lg">{tournament.name}</Heading>
          <Text className="text-sm text-slate-500">{[tournament.status, tournament.visibility, tournament.venue].filter(Boolean).join(' • ')}</Text>
          <Text className="text-xs uppercase tracking-[0.14em] text-slate-400">Role: {effectiveRole || 'viewer'}</Text>
          {!canManage ? (
            <Text className="text-sm text-amber-700">Read-only mode. Tournament management controls are disabled for your role.</Text>
          ) : null}
        </VStack>

        <HStack className="flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button key={tab.id} variant={activeTab === tab.id ? 'solid' : 'outline'} onClick={() => setActiveTab(tab.id)}>
              <Text className={activeTab === tab.id ? 'text-white' : ''}>{tab.label}</Text>
            </Button>
          ))}
        </HStack>

        {activeTab === 'overview' ? (
          <VStack className="gap-3">
            <Input value={tournament.name || ''} onChangeText={(value) => updateField({ name: value })} placeholder="Tournament name" />
            <Input value={String(tournament.shortCode || '')} onChangeText={(value) => updateField({ shortCode: value })} placeholder="Short code" />
            <Input value={String(tournament.venue || '')} onChangeText={(value) => updateField({ venue: value })} placeholder="Venue" />
            <Input value={String(tournament.timezone || '')} onChangeText={(value) => updateField({ timezone: value })} placeholder="Timezone" />
            <Input type="date" value={String(tournament.startDate || '')} onChangeText={(value) => updateField({ startDate: value })} />
            <Input type="date" value={String(tournament.endDate || '')} onChangeText={(value) => updateField({ endDate: value })} />
            <Select value={visibility} onValueChange={(value) => updateField({ visibility: value as TournamentVisibility })}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
            <textarea
              className="min-h-[8rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={String(tournament.description || '')}
              onChange={(event) => updateField({ description: event.target.value })}
              placeholder="Tournament description"
            />
          </VStack>
        ) : activeTab === 'events' ? (
          <VStack className="gap-4">
            <HStack className="gap-3">
              <Input value={newEventName} onChangeText={setNewEventName} placeholder="Event name" className="flex-1" />
              <Button
                action="primary"
                disabled={!canManage}
                onClick={async () => {
                  if (!newEventName.trim()) return
                  await addTournamentEvent(tournamentID, { name: newEventName.trim() })
                  setNewEventName('')
                }}
              >
                <Text className="text-white">Add Event</Text>
              </Button>
            </HStack>
            {eventEntries.length === 0 ? (
              <Text className="text-sm text-slate-500">No events yet.</Text>
            ) : (
              <VStack className="gap-3">
                {eventEntries.map(([eventID, event]) => (
                  <Box key={eventID} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <HStack className="items-start justify-between gap-3">
                      <VStack className="flex-1 gap-2">
                        {editingEventID === eventID ? (
                          <Input value={editingEventName} onChangeText={setEditingEventName} />
                        ) : (
                          <Text className="font-semibold text-slate-900">{event.name}</Text>
                        )}
                        <Text className="text-xs text-slate-500">{[event.shortCode, event.format, event.status].filter(Boolean).join(' • ')}</Text>
                      </VStack>
                      <HStack className="gap-2">
                        <Button
                          variant="outline"
                          disabled={!canManage}
                          onClick={async () => {
                            if (editingEventID === eventID) {
                              await updateTournamentEvent(tournamentID, eventID, { name: editingEventName.trim() || event.name })
                              setEditingEventID('')
                              setEditingEventName('')
                            } else {
                              setEditingEventID(eventID)
                              setEditingEventName(event.name)
                            }
                          }}
                        >
                          <Text>{editingEventID === eventID ? 'Save' : 'Edit'}</Text>
                        </Button>
                        <Button variant="outline" onClick={() => deleteTournamentEvent(tournamentID, eventID)} disabled={!canManage}>
                          <Text>Remove</Text>
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        ) : activeTab === 'brackets' ? (
          <VStack className="gap-4">
            <HStack className="gap-3 flex-wrap">
              <Input value={newBracketName} onChangeText={setNewBracketName} placeholder="Bracket name" className="flex-1 min-w-[12rem]" />
              <Select value={newBracketEventID} onValueChange={setNewBracketEventID}>
                <option value="">No event</option>
                {eventEntries.map(([eventID, event]) => (
                  <option key={eventID} value={eventID}>{event.name}</option>
                ))}
              </Select>
              <Select value={newBracketFormat} onValueChange={(value) => setNewBracketFormat(value as TournamentBracketRecord['format'])}>
                <option value="single-elimination">Single Elimination</option>
                <option value="double-elimination">Double Elimination</option>
                <option value="round-robin">Round Robin</option>
              </Select>
              <Input type="number" min="2" value={newBracketSeedCount} onChangeText={setNewBracketSeedCount} className="w-24" />
              <Button
                action="primary"
                disabled={!canManage}
                onClick={async () => {
                  if (!newBracketName.trim()) return
                  await addTournamentBracket(tournamentID, {
                    name: newBracketName.trim(),
                    eventID: newBracketEventID,
                    format: newBracketFormat,
                    seedCount: Number(newBracketSeedCount) || 8,
                  })
                  setNewBracketName('')
                  setNewBracketSeedCount('8')
                }}
              >
                <Text className="text-white">Add Bracket</Text>
              </Button>
            </HStack>
            {bracketEntries.length === 0 ? (
              <Text className="text-sm text-slate-500">No brackets yet.</Text>
            ) : (
              <VStack className="gap-3">
                {bracketEntries.map(([bracketID, bracket]) => (
                  <Box key={bracketID} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <HStack className="items-start justify-between gap-3">
                      <VStack className="flex-1 gap-2">
                        {editingBracketID === bracketID ? (
                          <Input value={editingBracketName} onChangeText={setEditingBracketName} />
                        ) : (
                          <Text className="font-semibold text-slate-900">{bracket.name}</Text>
                        )}
                        <Text className="text-xs text-slate-500">
                          {[bracket.format, `${bracket.seedCount} seeds`, bracket.status, eventEntries.find(([eventID]) => eventID === bracket.eventID)?.[1]?.name].filter(Boolean).join(' • ')}
                        </Text>
                      </VStack>
                      <HStack className="gap-2">
                        <Button
                          variant="outline"
                          disabled={!canManage}
                          onClick={async () => {
                            if (editingBracketID === bracketID) {
                              const parsedSeeds = editingBracketSeeds
                                .split('\n')
                                .map((line, index) => ({
                                  seedNumber: index + 1,
                                  label: line.trim() || `Seed ${index + 1}`,
                                }))
                              await updateTournamentBracket(tournamentID, bracketID, {
                                name: editingBracketName.trim() || bracket.name,
                                seeds: parsedSeeds,
                                seedCount: parsedSeeds.length || bracket.seedCount,
                              })
                              setEditingBracketID('')
                              setEditingBracketName('')
                              setEditingBracketSeeds('')
                            } else {
                              setEditingBracketID(bracketID)
                              setEditingBracketName(bracket.name)
                              setEditingBracketSeeds((bracket.seeds || []).map((seed) => seed.label).join('\n'))
                            }
                          }}
                        >
                          <Text>{editingBracketID === bracketID ? 'Save' : 'Edit'}</Text>
                        </Button>
                        <Select value={bracket.status} onValueChange={(value) => updateTournamentBracket(tournamentID, bracketID, { status: value as TournamentBracketRecord['status'] })} disabled={!canManage}>
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                          <option value="active">active</option>
                          <option value="completed">completed</option>
                          <option value="archived">archived</option>
                        </Select>
                        <Button variant="outline" onClick={() => generateTournamentBracketNodes(tournamentID, bracketID, bracket.seedCount)} disabled={!canManage}>
                          <Text>Generate</Text>
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/tournaments/${tournamentID}/brackets`)}>
                          <Text>Open View</Text>
                        </Button>
                        <Button variant="outline" onClick={() => deleteTournamentBracket(tournamentID, bracketID)} disabled={!canManage}>
                          <Text>Remove</Text>
                        </Button>
                      </HStack>
                    </HStack>
                    {bracket.nodes && Object.keys(bracket.nodes).length > 0 ? (
                      <VStack className="mt-3 gap-2">
                        {editingBracketID === bracketID ? (
                          <textarea
                            className="min-h-[8rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            value={editingBracketSeeds}
                            onChange={(event) => setEditingBracketSeeds(event.target.value)}
                            placeholder="One seed label per line"
                          />
                        ) : null}
                        {Object.values(bracket.nodes as Record<string, { id: string; roundNumber: number; topLabel: string; bottomLabel: string; status: string }>).map((node) => (
                          <Box key={node.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <VStack className="gap-2">
                              <Text className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Round {node.roundNumber}</Text>
                              <Text className="text-sm text-slate-800">{node.topLabel} vs {node.bottomLabel}</Text>
                              <Text className="text-xs text-slate-500">Status: {node.status}</Text>
                              {'sourceMatchID' in node && (node as { sourceMatchID?: string }).sourceMatchID ? (
                                <Text className="text-xs text-slate-500">Source match: {(node as { sourceMatchID?: string }).sourceMatchID}</Text>
                              ) : null}
                              {'scheduleBlockID' in node && (node as { scheduleBlockID?: string }).scheduleBlockID ? (
                                <Text className="text-xs text-emerald-600">Scheduled via {(node as { scheduleBlockID?: string }).scheduleBlockID}</Text>
                              ) : null}
                              <Button
                                variant="outline"
                                disabled={!canManage}
                                onClick={() => setEditingBracketNode({
                                  bracketID,
                                  nodeID: node.id,
                                  sourceMatchID: (node as { sourceMatchID?: string }).sourceMatchID || '',
                                  status: node.status,
                                })}
                              >
                                <Text>Edit Node</Text>
                              </Button>
                              <Button
                                variant="outline"
                                disabled={!canManage}
                                onClick={async () => {
                                  const assignedTable = tableOptions.find((table) => table.id === bracketNodeScheduleTableID)
                                  await createScheduleBlockFromBracketNode(tournamentID, bracketID, node.id, {
                                    assignedTableID: bracketNodeScheduleTableID,
                                    assignedTableLabel: assignedTable?.tableName || '',
                                    scheduledStartTime: bracketNodeScheduleTime,
                                  })
                                  setBracketNodeScheduleTableID('')
                                  setBracketNodeScheduleTime('')
                                }}
                              >
                                <Text>Schedule</Text>
                              </Button>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        ) : activeTab === 'schedule' ? (
          <VStack className="gap-4">
            <HStack className="gap-3 flex-wrap">
              <Input value={newRoundTitle} onChangeText={setNewRoundTitle} placeholder="Round title" className="flex-1" />
              <Input value={newRoundShortLabel} onChangeText={setNewRoundShortLabel} placeholder="Short label" className="min-w-[9rem]" />
              <Select value={newRoundEventID} onValueChange={setNewRoundEventID}>
                <option value="">No event</option>
                {eventEntries.map(([eventID, event]) => (
                  <option key={eventID} value={eventID}>{event.name}</option>
                ))}
              </Select>
              <Select value={newRoundFormat} onValueChange={(value) => setNewRoundFormat(value as TournamentRoundRecord['format'])}>
                <option value="standard">Standard</option>
                <option value="playoff">Playoff</option>
                <option value="tiebreaker">Tiebreaker</option>
              </Select>
              <Input type="datetime-local" value={newRoundStartTime} onChangeText={setNewRoundStartTime} className="min-w-[12rem]" />
              <Input type="datetime-local" value={newRoundEndTime} onChangeText={setNewRoundEndTime} className="min-w-[12rem]" />
              <Button
                action="primary"
                disabled={!canManage}
                onClick={async () => {
                  if (!newRoundTitle.trim()) return
                  await addTournamentRound(tournamentID, {
                    title: newRoundTitle.trim(),
                    shortLabel: newRoundShortLabel.trim(),
                    eventID: newRoundEventID,
                    order: roundEntries.length + 1,
                    format: newRoundFormat,
                    scheduledStartTime: newRoundStartTime,
                    scheduledEndTime: newRoundEndTime,
                  })
                  setNewRoundTitle('')
                  setNewRoundShortLabel('')
                  setNewRoundStartTime('')
                  setNewRoundEndTime('')
                }}
              >
                <Text className="text-white">Add Round</Text>
              </Button>
            </HStack>
            {roundEntries.length === 0 ? (
              <Text className="text-sm text-slate-500">No rounds yet.</Text>
            ) : (
              <VStack className="gap-3">
                {roundEntries.map(([roundID, round]) => (
                  <Box key={roundID} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const roundRequiresOverride = Boolean(round.isLocked) || round.status === 'completed' || round.status === 'archived'
                      const canMutateRound = !roundRequiresOverride || roundOverrideID === roundID || editingRoundID === roundID
                      const roundProgress = getTournamentRoundProgressStatus(round.status)
                      const roundScheduleBlocks = scheduleEntries.filter(([, scheduleBlock]) => scheduleBlock.roundID === roundID)
                      const nextRound = round.nextRoundID
                        ? roundEntries.find(([currentRoundID]) => currentRoundID === round.nextRoundID)?.[1]
                        : roundEntries.find(([, currentRound]) => currentRound.order === round.order + 1)?.[1]
                      const tableLabelMap = Object.fromEntries(tableOptions.map((table) => [table.id, table.tableName]))
                      return (
                    <VStack className="gap-3">
                      <HStack className="items-start justify-between gap-3">
                        <VStack className="flex-1 gap-2">
                          {editingRoundID === roundID ? (
                            <VStack className="gap-2">
                              <Input value={editingRoundDraft.title} onChangeText={(value) => setEditingRoundDraft((current) => ({ ...current, title: value }))} placeholder="Round title" />
                              <HStack className="gap-2 flex-wrap">
                                <Input value={editingRoundDraft.shortLabel} onChangeText={(value) => setEditingRoundDraft((current) => ({ ...current, shortLabel: value }))} placeholder="Short label" className="min-w-[9rem]" />
                                <Select value={editingRoundDraft.eventID} onValueChange={(value) => setEditingRoundDraft((current) => ({ ...current, eventID: value }))}>
                                  <option value="">No event</option>
                                  {eventEntries.map(([eventID, event]) => (
                                    <option key={eventID} value={eventID}>{event.name}</option>
                                  ))}
                                </Select>
                                <Select value={editingRoundDraft.format} onValueChange={(value) => setEditingRoundDraft((current) => ({ ...current, format: value as TournamentRoundRecord['format'] }))}>
                                  <option value="standard">Standard</option>
                                  <option value="playoff">Playoff</option>
                                  <option value="tiebreaker">Tiebreaker</option>
                                </Select>
                                <Select value={editingRoundDraft.visibility} onValueChange={(value) => setEditingRoundDraft((current) => ({ ...current, visibility: value as TournamentVisibility }))}>
                                  <option value="private">private</option>
                                  <option value="unlisted">unlisted</option>
                                  <option value="public">public</option>
                                </Select>
                                <Select value={editingRoundDraft.autoAdvanceMode} onValueChange={(value) => setEditingRoundDraft((current) => ({ ...current, autoAdvanceMode: value as TournamentRoundRecord['autoAdvanceMode'] }))}>
                                  <option value="unlock-only">Unlock only</option>
                                  <option value="winner-placeholders">Winner placeholders</option>
                                </Select>
                                <Select value={editingRoundDraft.nextRoundID} onValueChange={(value) => setEditingRoundDraft((current) => ({ ...current, nextRoundID: value }))}>
                                  <option value="">Next round by order</option>
                                  {roundEntries.filter(([currentRoundID]) => currentRoundID !== roundID).map(([currentRoundID, currentRound]) => (
                                    <option key={currentRoundID} value={currentRoundID}>{currentRound.title}</option>
                                  ))}
                                </Select>
                              </HStack>
                              <HStack className="gap-2 flex-wrap">
                                <Input type="datetime-local" value={editingRoundDraft.scheduledStartTime} onChangeText={(value) => setEditingRoundDraft((current) => ({ ...current, scheduledStartTime: value }))} className="min-w-[12rem]" />
                                <Input type="datetime-local" value={editingRoundDraft.scheduledEndTime} onChangeText={(value) => setEditingRoundDraft((current) => ({ ...current, scheduledEndTime: value }))} className="min-w-[12rem]" />
                              </HStack>
                              <textarea
                                className="min-h-[5rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={editingRoundDraft.assignedMatchIDs}
                                onChange={(event) => setEditingRoundDraft((current) => ({ ...current, assignedMatchIDs: event.target.value }))}
                                placeholder="Assign match IDs (comma, space, or newline separated)"
                              />
                              <textarea
                                className="min-h-[5rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                value={editingRoundDraft.notes}
                                onChange={(event) => setEditingRoundDraft((current) => ({ ...current, notes: event.target.value }))}
                                placeholder="Round notes, playoff repair plan, or tiebreaker instructions"
                              />
                              <VStack className="gap-2">
                                <Text className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Assigned tables</Text>
                                <HStack className="flex-wrap gap-2">
                                  {tableOptions.length === 0 ? (
                                    <Text className="text-xs text-slate-500">No tables available yet.</Text>
                                  ) : tableOptions.map((table) => (
                                    <label key={table.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                                      <input
                                        type="checkbox"
                                        checked={editingRoundDraft.assignedTableIDs.includes(table.id)}
                                        onChange={() => toggleRoundDraftTable(table.id)}
                                      />
                                      <span>{table.tableName}</span>
                                    </label>
                                  ))}
                                </HStack>
                              </VStack>
                              <HStack className="gap-2 flex-wrap text-xs text-slate-500">
                                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                  <input
                                    type="checkbox"
                                    checked={editingRoundDraft.advanceWhenComplete}
                                    onChange={() => setEditingRoundDraft((current) => ({ ...current, advanceWhenComplete: !current.advanceWhenComplete }))}
                                  />
                                  <span>Auto-complete when linked matches finish</span>
                                </label>
                                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                  <input
                                    type="checkbox"
                                    checked={editingRoundDraft.allowManualOverrides}
                                    onChange={() => setEditingRoundDraft((current) => ({ ...current, allowManualOverrides: !current.allowManualOverrides }))}
                                  />
                                  <span>Allow manual overrides / reseeding</span>
                                </label>
                                <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                  <input
                                    type="checkbox"
                                    checked={editingRoundDraft.isPublished}
                                    onChange={() => setEditingRoundDraft((current) => ({ ...current, isPublished: !current.isPublished, visibility: !current.isPublished ? 'public' : 'private' }))}
                                  />
                                  <span>Publish round</span>
                                </label>
                              </HStack>
                            </VStack>
                          ) : (
                            <>
                              <Text className="font-semibold text-slate-900">{round.title}</Text>
                              <Text className="text-xs text-slate-500">
                                {[round.shortLabel, round.format, round.status, eventEntries.find(([eventID]) => eventID === round.eventID)?.[1]?.name].filter(Boolean).join(' • ')}
                              </Text>
                              <HStack className="gap-2 text-xs text-slate-500 flex-wrap">
                                <Text className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-[0.12em]">{round.visibility}</Text>
                                <Text className={`rounded-full px-2 py-1 uppercase tracking-[0.12em] ${roundProgress === 'completed' ? 'bg-emerald-100 text-emerald-700' : roundProgress === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{roundProgress}</Text>
                                {round.isPublished ? <Text className="rounded-full bg-indigo-100 px-2 py-1 uppercase tracking-[0.12em] text-indigo-700">published</Text> : null}
                                {round.isLocked ? (
                                  <Text className="rounded-full bg-rose-100 px-2 py-1 uppercase tracking-[0.12em] text-rose-700">locked</Text>
                                ) : (
                                  <Text className="rounded-full bg-emerald-100 px-2 py-1 uppercase tracking-[0.12em] text-emerald-700">editable</Text>
                                )}
                                {round.allowManualOverrides ? <Text className="rounded-full bg-violet-100 px-2 py-1 uppercase tracking-[0.12em] text-violet-700">manual override</Text> : null}
                              </HStack>
                              <Text className="text-xs text-slate-500">
                                {[
                                  round.scheduledStartTime ? `Starts ${new Date(round.scheduledStartTime).toLocaleString()}` : '',
                                  round.scheduledEndTime ? `Ends ${new Date(round.scheduledEndTime).toLocaleString()}` : '',
                                  round.assignedTableLabels?.length ? `Tables: ${round.assignedTableLabels.join(', ')}` : round.assignedTableIDs?.length ? `Tables: ${round.assignedTableIDs.map((tableID) => tableLabelMap[tableID] || tableID).join(', ')}` : '',
                                  round.assignedMatchIDs?.length ? `${round.assignedMatchIDs.length} direct matches` : '',
                                  roundScheduleBlocks.length ? `${roundScheduleBlocks.length} scheduled block${roundScheduleBlocks.length === 1 ? '' : 's'}` : '',
                                  nextRound ? `Unlocks ${nextRound.title}` : '',
                                ].filter(Boolean).join(' • ')}
                              </Text>
                              {round.notes ? <Text className="text-sm text-slate-600">{round.notes}</Text> : null}
                            </>
                          )}
                        </VStack>
                        <HStack className="gap-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            disabled={!canMutateRound}
                            onClick={async () => {
                              if (editingRoundID === roundID) {
                                const assignedMatchIDs = editingRoundDraft.assignedMatchIDs
                                  .split(/[\s,]+/)
                                  .map((value) => value.trim())
                                  .filter(Boolean)
                                await updateTournamentRound(tournamentID, roundID, {
                                  title: editingRoundDraft.title.trim() || round.title,
                                  shortLabel: editingRoundDraft.shortLabel.trim(),
                                  eventID: editingRoundDraft.eventID,
                                  format: editingRoundDraft.format,
                                  scheduledStartTime: editingRoundDraft.scheduledStartTime,
                                  scheduledEndTime: editingRoundDraft.scheduledEndTime,
                                  notes: editingRoundDraft.notes.trim(),
                                  nextRoundID: editingRoundDraft.nextRoundID,
                                  autoAdvanceMode: editingRoundDraft.autoAdvanceMode,
                                  assignedTableIDs: editingRoundDraft.assignedTableIDs,
                                  assignedTableLabels: editingRoundDraft.assignedTableIDs.map((tableID) => tableLabelMap[tableID] || ''),
                                  advanceWhenComplete: editingRoundDraft.advanceWhenComplete,
                                  allowManualOverrides: editingRoundDraft.allowManualOverrides,
                                  isPublished: editingRoundDraft.isPublished,
                                  visibility: editingRoundDraft.isPublished ? 'public' : editingRoundDraft.visibility,
                                })
                                await setTournamentRoundMatchAssignments(tournamentID, roundID, assignedMatchIDs)
                                setEditingRoundID('')
                                setRoundOverrideID('')
                              } else {
                                setEditingRoundID(roundID)
                                setEditingRoundDraft({
                                  title: round.title,
                                  shortLabel: round.shortLabel || '',
                                  eventID: round.eventID || '',
                                  format: round.format || 'standard',
                                  visibility: round.visibility,
                                  scheduledStartTime: round.scheduledStartTime || '',
                                  scheduledEndTime: round.scheduledEndTime || '',
                                  notes: round.notes || '',
                                  nextRoundID: round.nextRoundID || '',
                                  autoAdvanceMode: round.autoAdvanceMode || 'unlock-only',
                                  assignedMatchIDs: (round.assignedMatchIDs || []).join('\n'),
                                  assignedTableIDs: round.assignedTableIDs || [],
                                  advanceWhenComplete: round.advanceWhenComplete !== false,
                                  allowManualOverrides: round.allowManualOverrides !== false,
                                  isPublished: Boolean(round.isPublished),
                                })
                              }
                            }}
                          >
                            <Text>{editingRoundID === roundID ? 'Save' : 'Edit'}</Text>
                          </Button>
                          <Button variant="outline" onClick={() => updateTournamentRound(tournamentID, roundID, { isLocked: !round.isLocked })} disabled={!canManage}>
                            <Text>{round.isLocked ? 'Unlock' : 'Lock'}</Text>
                          </Button>
                          <Button variant="outline" onClick={() => updateTournamentRound(tournamentID, roundID, { isPublished: !round.isPublished, visibility: round.isPublished ? 'private' : 'public' })} disabled={!canManage}>
                            <Text>{round.isPublished ? 'Unpublish' : 'Publish'}</Text>
                          </Button>
                          {roundRequiresOverride && roundOverrideID !== roundID ? (
                            <Button variant="outline" onClick={() => setRoundOverrideID(roundID)} disabled={!canManage}>
                              <Text>Override</Text>
                            </Button>
                          ) : null}
                          <Button variant="outline" onClick={() => transitionTournamentRoundStatus(tournamentID, roundID, 'ready', { override: roundOverrideID === roundID })} disabled={!canMutateRound}>
                            <Text>Ready</Text>
                          </Button>
                          <Button variant="outline" onClick={() => transitionTournamentRoundStatus(tournamentID, roundID, 'active', { override: roundOverrideID === roundID })} disabled={!canMutateRound}>
                            <Text>Start</Text>
                          </Button>
                          <Button variant="outline" onClick={() => transitionTournamentRoundStatus(tournamentID, roundID, 'paused', { override: roundOverrideID === roundID })} disabled={!canMutateRound}>
                            <Text>Pause</Text>
                          </Button>
                          <Button variant="outline" onClick={() => transitionTournamentRoundStatus(tournamentID, roundID, 'completed', { override: roundOverrideID === roundID })} disabled={!canMutateRound}>
                            <Text>Complete</Text>
                          </Button>
                          <Button variant="outline" onClick={() => transitionTournamentRoundStatus(tournamentID, roundID, 'archived', { override: true })} disabled={!canMutateRound}>
                            <Text>Archive</Text>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => bulkAssignTournamentRoundToTables(tournamentID, roundID, round.assignedTableIDs || [], tableLabelMap)}
                            disabled={!canMutateRound || !(round.assignedTableIDs || []).length || roundScheduleBlocks.length === 0}
                          >
                            <Text>Assign Tables</Text>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              for (const [scheduleBlockID] of roundScheduleBlocks) {
                                const roundScheduleBlock = roundScheduleBlocks.find(([currentScheduleBlockID]) => currentScheduleBlockID === scheduleBlockID)?.[1]
                                if (roundScheduleBlock?.blockType === 'match' && roundScheduleBlock.sourceMatchID && roundScheduleBlock.assignedTableID) {
                                  await syncTournamentScheduleBlockToQueue(tournamentID, scheduleBlockID)
                                }
                              }
                            }}
                            disabled={!canMutateRound || roundScheduleBlocks.length === 0}
                          >
                            <Text>Queue Round</Text>
                          </Button>
                          <Button variant="outline" onClick={() => reorderTournamentRound(tournamentID, roundID, 'up')} disabled={!canMutateRound}>
                            <Text>Up</Text>
                          </Button>
                          <Button variant="outline" onClick={() => reorderTournamentRound(tournamentID, roundID, 'down')} disabled={!canMutateRound}>
                            <Text>Down</Text>
                          </Button>
                          <Button variant="outline" onClick={() => deleteTournamentRound(tournamentID, roundID)} disabled={!canMutateRound}>
                            <Text>Remove</Text>
                          </Button>
                        </HStack>
                      </HStack>
                    </VStack>
                      )
                    })()}
                  </Box>
                ))}
              </VStack>
            )}
            <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <VStack className="gap-3">
                <Heading size="sm">Event Schedule</Heading>
                <Text className="text-sm text-slate-600">
                  Event schedule blocks are the canonical timeline for warm-ups, matches, and breaks. Table queues remain a derived compatibility layer synced from match blocks only.
                </Text>
                <HStack className="flex-wrap gap-2 text-xs text-slate-500">
                  <Text className="rounded-full bg-white px-3 py-1.5">{scheduleEntries.length} total blocks</Text>
                  <Text className="rounded-full bg-white px-3 py-1.5">{scheduleEntries.filter(([, scheduleBlock]) => scheduleBlock.blockType === 'warmup').length} warm-up</Text>
                  <Text className="rounded-full bg-white px-3 py-1.5">{scheduleEntries.filter(([, scheduleBlock]) => scheduleBlock.blockType === 'match').length} match</Text>
                  <Text className="rounded-full bg-white px-3 py-1.5">{scheduleEntries.filter(([, scheduleBlock]) => scheduleBlock.blockType === 'break').length} break</Text>
                  <Text className={`rounded-full px-3 py-1.5 ${scheduleConflictCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {scheduleConflictCount > 0 ? `${scheduleConflictCount} conflict${scheduleConflictCount === 1 ? '' : 's'}` : 'No conflicts'}
                  </Text>
                </HStack>
                <HStack className="gap-3 flex-wrap">
                  <Select value={scheduleEventFilter} onValueChange={setScheduleEventFilter}>
                    <option value="all">All events</option>
                    {eventEntries.map(([eventID, event]) => (
                      <option key={eventID} value={eventID}>{event.name}</option>
                    ))}
                  </Select>
                  <Select value={scheduleRoundFilter} onValueChange={setScheduleRoundFilter}>
                    <option value="all">All rounds</option>
                    {roundEntries.map(([roundID, round]) => (
                      <option key={roundID} value={roundID}>{round.title}</option>
                    ))}
                  </Select>
                  <Select value={scheduleBlockTypeFilter} onValueChange={(value) => setScheduleBlockTypeFilter(value as 'all' | TournamentScheduleBlockType)}>
                    <option value="all">All block types</option>
                    {tournamentScheduleBlockTypes.map((blockType) => (
                      <option key={blockType} value={blockType}>{blockType}</option>
                    ))}
                  </Select>
                  <Select value={bulkScheduleTableID} onValueChange={setBulkScheduleTableID}>
                    <option value="">Bulk assign table</option>
                    {tableOptions.map((table) => (
                      <option key={table.id} value={table.id}>{table.tableName}</option>
                    ))}
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!canManage}
                    onClick={async () => {
                      await generateTournamentScheduleFromFormat(tournamentID)
                    }}
                  >
                    <Text>Generate From Format</Text>
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canManage}
                    onClick={async () => {
                      await detectTournamentScheduleConflicts(tournamentID)
                    }}
                  >
                    <Text>Detect Conflicts</Text>
                  </Button>
                  {(tournament.publicVisibility || {}).schedule ? (
                    <Button variant="outline" onClick={() => navigate(`/tournaments/${tournamentID}/schedule`)}>
                      <Text>Open Public Schedule</Text>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    disabled={!canManage || !bulkScheduleTableID || selectedScheduleBlockIDs.length === 0}
                    onClick={async () => {
                      if (!bulkScheduleTableID || selectedScheduleBlockIDs.length === 0) return
                      const assignedTable = tableOptions.find((table) => table.id === bulkScheduleTableID)
                      for (const scheduleBlockID of selectedScheduleBlockIDs) {
                        const scheduleBlock = scheduleEntries.find(([currentScheduleBlockID]) => currentScheduleBlockID === scheduleBlockID)?.[1]
                        if (!scheduleBlock || scheduleBlock.blockType !== 'match') continue
                        await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
                          assignedTableID: bulkScheduleTableID,
                          assignedTableLabel: assignedTable?.tableName || '',
                          status: scheduleBlock.sourceMatchID ? 'scheduled' : 'unassigned',
                        })
                        if (scheduleBlock.assignedQueueItemID || scheduleBlock.sourceMatchID) {
                          await syncTournamentScheduleBlockToQueue(tournamentID, scheduleBlockID)
                        }
                      }
                      setSelectedScheduleBlockIDs([])
                    }}
                  >
                    <Text>Bulk Assign Table</Text>
                  </Button>
                </HStack>
                <VStack className="gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Text className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Create event schedule block</Text>
                  <HStack className="gap-3 flex-wrap">
                    <Select value={newScheduleBlockType} onValueChange={(value) => setNewScheduleBlockType(value as TournamentScheduleBlockType)}>
                      {tournamentScheduleBlockTypes.map((blockType) => (
                        <option key={blockType} value={blockType}>{blockType}</option>
                      ))}
                    </Select>
                    <Input value={newScheduleTitle} onChangeText={setNewScheduleTitle} placeholder="Block title" className="flex-1 min-w-[12rem]" />
                    <Select value={newScheduleEventID} onValueChange={setNewScheduleEventID}>
                      <option value="">No event</option>
                      {eventEntries.map(([eventID, event]) => (
                        <option key={eventID} value={eventID}>{event.name}</option>
                      ))}
                    </Select>
                    <Select value={newScheduleRoundID} onValueChange={setNewScheduleRoundID}>
                      <option value="">No round</option>
                      {roundEntries.map(([roundID, round]) => (
                        <option key={roundID} value={roundID}>{round.title}</option>
                      ))}
                    </Select>
                    <Input value={newScheduleSourceMatchID} onChangeText={setNewScheduleSourceMatchID} placeholder="Source match ID" className="min-w-[12rem]" />
                    <Select value={newScheduleTableID} onValueChange={setNewScheduleTableID}>
                      <option value="">Unassigned table</option>
                      {tableOptions.map((table) => (
                        <option key={table.id} value={table.id}>{table.tableName}</option>
                      ))}
                    </Select>
                    <Input type="datetime-local" value={newScheduleTime} onChangeText={setNewScheduleTime} className="min-w-[12rem]" />
                    <Input type="datetime-local" value={newScheduleEndTime} onChangeText={setNewScheduleEndTime} className="min-w-[12rem]" />
                    <Button
                      action="primary"
                      disabled={!canManage}
                      onClick={async () => {
                        if (!newScheduleTitle.trim()) return
                        const selectedRound = roundEntries.find(([roundID]) => roundID === newScheduleRoundID)?.[1]
                        const selectedTableID = newScheduleTableID || selectedRound?.assignedTableIDs?.[0] || ''
                        const assignedTable = tableOptions.find((table) => table.id === selectedTableID)
                        await addTournamentScheduleBlock(tournamentID, {
                          title: newScheduleTitle.trim(),
                          blockType: newScheduleBlockType,
                          eventID: newScheduleEventID,
                          roundID: newScheduleRoundID,
                          sourceMatchID: newScheduleBlockType === 'match' ? newScheduleSourceMatchID.trim() : '',
                          eventName: eventEntries.find(([eventID]) => eventID === newScheduleEventID)?.[1]?.name || '',
                          roundTitle: selectedRound?.title || '',
                          assignedTableID: selectedTableID,
                          assignedTableLabel: assignedTable?.tableName || '',
                          scheduledStartTime: newScheduleTime || selectedRound?.scheduledStartTime || '',
                          scheduledEndTime: newScheduleEndTime || selectedRound?.scheduledEndTime || '',
                          participantLabels: parseScheduleParticipants(newScheduleParticipants),
                          notes: newScheduleNotes.trim(),
                        })
                        setNewScheduleTitle('')
                        setNewScheduleBlockType('match')
                        setNewScheduleSourceMatchID('')
                        setNewScheduleParticipants('')
                        setNewScheduleNotes('')
                        setNewScheduleTime('')
                        setNewScheduleEndTime('')
                      }}
                    >
                      <Text className="text-white">Add Schedule Block</Text>
                    </Button>
                  </HStack>
                  <textarea
                    className="min-h-[4rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={newScheduleParticipants}
                    onChange={(event) => setNewScheduleParticipants(event.target.value)}
                    placeholder="Participants for conflict detection (comma or newline separated)"
                  />
                  <textarea
                    className="min-h-[4rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    value={newScheduleNotes}
                    onChange={(event) => setNewScheduleNotes(event.target.value)}
                    placeholder="Schedule notes"
                  />
                </VStack>
                {visibleScheduleEntries.length === 0 ? (
                  <Text className="text-sm text-slate-500">No schedule blocks yet.</Text>
                ) : (
                  <VStack className="gap-3">
                    {visibleScheduleEntries.map(([scheduleBlockID, scheduleBlock]) => (
                      <Box key={scheduleBlockID} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <HStack className="items-start justify-between gap-3 flex-wrap">
                          <HStack className="flex-1 items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedScheduleBlockIDs.includes(scheduleBlockID)}
                              onChange={() => setSelectedScheduleBlockIDs((current) => current.includes(scheduleBlockID)
                                ? current.filter((id) => id !== scheduleBlockID)
                                : [...current, scheduleBlockID])}
                            />
                            <VStack className="flex-1 gap-2">
                            {editingScheduleBlockID === scheduleBlockID ? (
                              <VStack className="gap-2">
                                <Select value={editingScheduleDraft.blockType} onValueChange={(value) => setEditingScheduleDraft((current) => ({ ...current, blockType: value as TournamentScheduleBlockType }))}>
                                  {tournamentScheduleBlockTypes.map((blockType) => (
                                    <option key={blockType} value={blockType}>{blockType}</option>
                                  ))}
                                </Select>
                                <Input value={editingScheduleDraft.title} onChangeText={(value) => setEditingScheduleDraft((current) => ({ ...current, title: value }))} />
                              </VStack>
                            ) : (
                              <HStack className="flex-wrap gap-2">
                                <Text className="font-semibold text-slate-900">{scheduleBlock.title}</Text>
                                <Text className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-600">{scheduleBlock.blockType}</Text>
                                {scheduleBlock.isPublished ? <Text className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-700">published</Text> : <Text className="rounded-full bg-amber-100 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-amber-700">hidden</Text>}
                                {scheduleBlock.hasConflicts ? <Text className="rounded-full bg-rose-100 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-rose-700">conflict</Text> : null}
                              </HStack>
                            )}
                            <Text className="text-xs text-slate-500">
                              {[formatScheduleDateTime(scheduleBlock.scheduledStartTime), scheduleBlock.scheduledEndTime ? `Ends ${formatScheduleDateTime(scheduleBlock.scheduledEndTime)}` : '', scheduleBlock.assignedTableLabel || 'Unassigned table', scheduleBlock.eventName, scheduleBlock.roundTitle, scheduleBlock.status].filter(Boolean).join(' • ')}
                            </Text>
                            {editingScheduleBlockID === scheduleBlockID ? (
                              <VStack className="gap-2">
                                <Select value={editingScheduleDraft.eventID} onValueChange={(value) => setEditingScheduleDraft((current) => ({ ...current, eventID: value }))}>
                                  <option value="">No event</option>
                                  {eventEntries.map(([eventID, event]) => (
                                    <option key={eventID} value={eventID}>{event.name}</option>
                                  ))}
                                </Select>
                                <Select value={editingScheduleDraft.roundID} onValueChange={(value) => setEditingScheduleDraft((current) => ({ ...current, roundID: value }))}>
                                  <option value="">No round</option>
                                  {roundEntries.map(([roundID, round]) => (
                                    <option key={roundID} value={roundID}>{round.title}</option>
                                  ))}
                                </Select>
                                <Input value={editingScheduleDraft.sourceMatchID} onChangeText={(value) => setEditingScheduleDraft((current) => ({ ...current, sourceMatchID: value }))} placeholder="Source match ID" />
                                <Select value={editingScheduleDraft.assignedTableID} onValueChange={(value) => setEditingScheduleDraft((current) => ({ ...current, assignedTableID: value }))}>
                                  <option value="">Unassigned table</option>
                                  {tableOptions.map((table) => (
                                    <option key={table.id} value={table.id}>{table.tableName}</option>
                                  ))}
                                </Select>
                                <Input type="datetime-local" value={editingScheduleDraft.scheduledStartTime} onChangeText={(value) => setEditingScheduleDraft((current) => ({ ...current, scheduledStartTime: value }))} />
                                <Input type="datetime-local" value={editingScheduleDraft.scheduledEndTime} onChangeText={(value) => setEditingScheduleDraft((current) => ({ ...current, scheduledEndTime: value }))} />
                                <textarea
                                  className="min-h-[4rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  value={editingScheduleDraft.participantLabels}
                                  onChange={(event) => setEditingScheduleDraft((current) => ({ ...current, participantLabels: event.target.value }))}
                                  placeholder="Participants for conflict detection"
                                />
                                <textarea
                                  className="min-h-[6rem] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  value={editingScheduleDraft.notes}
                                  onChange={(event) => setEditingScheduleDraft((current) => ({ ...current, notes: event.target.value }))}
                                  placeholder="Schedule notes"
                                />
                                <label className="flex items-center gap-2 text-xs text-slate-500">
                                  <input
                                    type="checkbox"
                                    checked={editingScheduleDraft.isPublished}
                                    onChange={() => setEditingScheduleDraft((current) => ({ ...current, isPublished: !current.isPublished }))}
                                  />
                                  <span>Publish this block to the spectator schedule</span>
                                </label>
                              </VStack>
                            ) : null}
                            {scheduleBlock.sourceMatchID ? <Text className="text-xs text-slate-500">Source match: {scheduleBlock.sourceMatchID}</Text> : null}
                            {scheduleBlock.participantLabels?.length ? <Text className="text-xs text-slate-500">Participants: {scheduleBlock.participantLabels.join(', ')}</Text> : null}
                            {scheduleBlock.hasConflicts && scheduleBlock.conflictingParticipantLabels?.length ? <Text className="text-xs text-rose-600">Double-booked: {scheduleBlock.conflictingParticipantLabels.join(', ')}</Text> : null}
                            {scheduleBlock.assignedQueueItemID ? <Text className="text-xs text-emerald-600">Queued as {scheduleBlock.assignedQueueItemID}</Text> : null}
                            {scheduleBlock.notes ? <Text className="text-sm text-slate-600">{scheduleBlock.notes}</Text> : null}
                            </VStack>
                          </HStack>
                          <HStack className="gap-2 flex-wrap">
                            <Select value={scheduleBlock.status} onValueChange={(value) => updateTournamentScheduleBlock(tournamentID, scheduleBlockID, { status: value as TournamentScheduleBlockRecord['status'] })} disabled={!canManage}>
                              <option value="unassigned">unassigned</option>
                              <option value="scheduled">scheduled</option>
                              <option value="called">called</option>
                              <option value="active">active</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </Select>
                            <Button variant="outline" onClick={() => queueTournamentScheduleBlock(tournamentID, scheduleBlockID)} disabled={!canManage || scheduleBlock.blockType !== 'match' || !scheduleBlock.assignedTableID || !scheduleBlock.sourceMatchID}>
                              <Text>Queue</Text>
                            </Button>
                            {scheduleBlock.blockType === 'match' && !scheduleBlock.sourceMatchID ? (
                              <Button variant="outline" onClick={() => createTournamentScheduleMatch(tournamentID, scheduleBlockID)} disabled={!canManage}>
                                <Text>Create Match</Text>
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              disabled={!canManage}
                              onClick={() => updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
                                isPublished: !scheduleBlock.isPublished,
                              })}
                            >
                              <Text>{scheduleBlock.isPublished ? 'Unpublish' : 'Publish'}</Text>
                            </Button>
                            <Button
                              variant="outline"
                              disabled={!canManage}
                              onClick={async () => {
                                if (editingScheduleBlockID === scheduleBlockID) {
                                  const assignedTable = tableOptions.find((table) => table.id === editingScheduleDraft.assignedTableID)
                                  await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
                                    blockType: editingScheduleDraft.blockType,
                                    title: editingScheduleDraft.title.trim() || scheduleBlock.title,
                                    eventID: editingScheduleDraft.eventID,
                                    roundID: editingScheduleDraft.roundID,
                                    sourceMatchID: editingScheduleDraft.blockType === 'match' ? editingScheduleDraft.sourceMatchID.trim() : '',
                                    eventName: eventEntries.find(([eventID]) => eventID === editingScheduleDraft.eventID)?.[1]?.name || '',
                                    roundTitle: roundEntries.find(([roundID]) => roundID === editingScheduleDraft.roundID)?.[1]?.title || '',
                                    assignedTableID: editingScheduleDraft.assignedTableID,
                                    assignedTableLabel: assignedTable?.tableName || '',
                                    scheduledStartTime: editingScheduleDraft.scheduledStartTime,
                                    scheduledEndTime: editingScheduleDraft.scheduledEndTime,
                                    participantLabels: parseScheduleParticipants(editingScheduleDraft.participantLabels),
                                    isPublished: editingScheduleDraft.isPublished,
                                    notes: editingScheduleDraft.notes.trim(),
                                  })
                                  if (editingScheduleDraft.blockType === 'match' && editingScheduleDraft.assignedTableID && editingScheduleDraft.sourceMatchID.trim()) {
                                    await syncTournamentScheduleBlockToQueue(tournamentID, scheduleBlockID)
                                  }
                                  setEditingScheduleBlockID('')
                                } else {
                                  setEditingScheduleBlockID(scheduleBlockID)
                                  setEditingScheduleDraft({
                                    blockType: scheduleBlock.blockType || 'match',
                                    title: scheduleBlock.title,
                                    eventID: scheduleBlock.eventID || '',
                                    roundID: scheduleBlock.roundID || '',
                                    sourceMatchID: scheduleBlock.sourceMatchID || '',
                                    assignedTableID: scheduleBlock.assignedTableID || '',
                                    scheduledStartTime: scheduleBlock.scheduledStartTime || '',
                                    scheduledEndTime: scheduleBlock.scheduledEndTime || '',
                                    participantLabels: (scheduleBlock.participantLabels || []).join('\n'),
                                    notes: scheduleBlock.notes || '',
                                    isPublished: scheduleBlock.isPublished !== false,
                                  })
                                }
                              }}
                            >
                              <Text>{editingScheduleBlockID === scheduleBlockID ? 'Save' : 'Edit'}</Text>
                            </Button>
                            {scheduleBlock.blockType === 'match' && scheduleBlock.assignedQueueItemID ? (
                              <Button variant="outline" onClick={() => syncTournamentScheduleBlockToQueue(tournamentID, scheduleBlockID)} disabled={!canManage}>
                                <Text>Sync Queue</Text>
                              </Button>
                            ) : null}
                            <Button variant="outline" onClick={() => deleteTournamentScheduleBlock(tournamentID, scheduleBlockID)} disabled={!canManage}>
                              <Text>Remove</Text>
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>
          </VStack>
        ) : (
          activeTab === 'public' ? (
            <VStack className="gap-4">
              <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <VStack className="gap-3">
                  <Heading size="sm">Public Visibility</Heading>
                  <HStack className="flex-wrap gap-3">
                    <Button
                      variant="outline"
                      disabled={!canManage}
                      onClick={() => updateField({
                        publicVisibility: {
                          ...(tournament.publicVisibility || {}),
                          registration: !Boolean((tournament.publicVisibility || {}).registration),
                        },
                      })}
                    >
                      <Text>{(tournament.publicVisibility || {}).registration ? 'Disable Registration' : 'Enable Registration'}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canManage}
                      onClick={() => updateField({
                        publicVisibility: {
                          ...(tournament.publicVisibility || {}),
                          brackets: !Boolean((tournament.publicVisibility || {}).brackets),
                        },
                      })}
                    >
                      <Text>{(tournament.publicVisibility || {}).brackets ? 'Hide Brackets' : 'Publish Brackets'}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canManage}
                      onClick={() => updateField({
                        publicVisibility: {
                          ...(tournament.publicVisibility || {}),
                          liveScores: !Boolean((tournament.publicVisibility || {}).liveScores),
                        },
                      })}
                    >
                      <Text>{(tournament.publicVisibility || {}).liveScores ? 'Hide Live Scores' : 'Publish Live Scores'}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canManage}
                      onClick={() => updateField({
                        publicVisibility: {
                          ...(tournament.publicVisibility || {}),
                          schedule: !Boolean((tournament.publicVisibility || {}).schedule),
                        },
                      })}
                    >
                      <Text>{(tournament.publicVisibility || {}).schedule ? 'Hide Schedule' : 'Publish Schedule'}</Text>
                    </Button>
                  </HStack>
                  <Text className="text-sm text-slate-600">
                    Current public state: {[
                      (tournament.publicVisibility || {}).registration ? 'registration' : '',
                      (tournament.publicVisibility || {}).brackets ? 'brackets' : '',
                      (tournament.publicVisibility || {}).liveScores ? 'live scores' : '',
                      (tournament.publicVisibility || {}).schedule ? 'schedule' : '',
                    ].filter(Boolean).join(', ') || 'nothing published'}
                  </Text>
                  {(tournament.publicVisibility || {}).brackets ? (
                    <Button variant="outline" onClick={() => navigate(`/tournaments/${tournamentID}/brackets`)}>
                      <Text>Open Public Bracket View</Text>
                    </Button>
                  ) : null}
                  {(tournament.publicVisibility || {}).schedule ? (
                    <Button variant="outline" onClick={() => navigate(`/tournaments/${tournamentID}/schedule`)}>
                      <Text>Open Public Schedule View</Text>
                    </Button>
                  ) : null}
                </VStack>
              </Box>
            </VStack>
        ) : activeTab === 'staff' ? (
          <VStack className="gap-4">
            <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <VStack className="gap-3">
                <Heading size="sm">Direct Staff Grants</Heading>
                <HStack className="gap-3 flex-wrap">
                  <Input value={newStaffSubjectID} onChangeText={setNewStaffSubjectID} placeholder="User ID" className="flex-1 min-w-[12rem]" />
                  <Select value={newStaffRole} onValueChange={(value) => setNewStaffRole(value as TournamentGrantRole)}>
                    <option value="admin">admin</option>
                    <option value="scorer">scorer</option>
                    <option value="viewer">viewer</option>
                  </Select>
                  <Input value={newStaffNote} onChangeText={setNewStaffNote} placeholder="Optional note" className="flex-1 min-w-[12rem]" />
                    <Button
                      action="primary"
                      disabled={!canManage}
                      onClick={async () => {
                        if (!newStaffSubjectID.trim()) return
                      await addTournamentStaffAssignment(tournamentID, {
                        subjectID: newStaffSubjectID.trim(),
                        role: newStaffRole,
                        note: newStaffNote.trim(),
                      })
                      setNewStaffSubjectID('')
                      setNewStaffNote('')
                    }}
                  >
                    <Text className="text-white">Grant Access</Text>
                  </Button>
                </HStack>
                <Select value={staffRoleFilter} onValueChange={(value) => setStaffRoleFilter(value as 'all' | TournamentGrantRole)}>
                  <option value="all">All roles</option>
                  <option value="admin">admin</option>
                  <option value="scorer">scorer</option>
                  <option value="viewer">viewer</option>
                </Select>
                <Text className="text-sm text-slate-500">
                  {visibleStaffEntries.length} visible grant{visibleStaffEntries.length === 1 ? '' : 's'} • {staffEntries.length} total
                </Text>
                {visibleStaffEntries.length === 0 ? (
                  <Text className="text-sm text-slate-500">{staffEntries.length === 0 ? 'No direct staff grants yet.' : 'No staff grants match this role filter.'}</Text>
                ) : (
                  <VStack className="gap-3">
                    {visibleStaffEntries.map(([assignmentID, assignment]) => (
                      <Box key={assignmentID} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <HStack className="items-start justify-between gap-3">
                          <VStack className="gap-1">
                            <Text className="font-semibold text-slate-900">{assignment.subjectID}</Text>
                            <Text className="text-xs text-slate-500">{assignment.role} • {assignment.scope}</Text>
                            {assignment.note ? <Text className="text-sm text-slate-600">{assignment.note}</Text> : null}
                          </VStack>
                          <HStack className="gap-2">
                            <Select value={assignment.role} onValueChange={(value) => updateTournamentStaffAssignment(tournamentID, assignmentID, { role: value as TournamentGrantRole })} disabled={!canManage}>
                              <option value="admin">admin</option>
                              <option value="scorer">scorer</option>
                              <option value="viewer">viewer</option>
                            </Select>
                            <Button variant="outline" onClick={() => deleteTournamentStaffAssignment(tournamentID, assignmentID)} disabled={!canManage}>
                              <Text>Revoke</Text>
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>

            <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <VStack className="gap-3">
                <Heading size="sm">Pending Email Invites</Heading>
                <HStack className="gap-3 flex-wrap">
                  <Input value={newInviteEmail} onChangeText={setNewInviteEmail} placeholder="invite@example.com" className="flex-1 min-w-[12rem]" />
                  <Select value={newInviteRole} onValueChange={(value) => setNewInviteRole(value as TournamentGrantRole)}>
                    <option value="admin">admin</option>
                    <option value="scorer">scorer</option>
                    <option value="viewer">viewer</option>
                  </Select>
                  <Input value={newInviteNote} onChangeText={setNewInviteNote} placeholder="Optional note" className="flex-1 min-w-[12rem]" />
                    <Button
                      action="primary"
                      disabled={!canManage}
                      onClick={async () => {
                        if (!newInviteEmail.trim()) return
                      await addTournamentPendingInvite(tournamentID, {
                        email: newInviteEmail.trim(),
                        role: newInviteRole,
                        note: newInviteNote.trim(),
                      })
                      setNewInviteEmail('')
                      setNewInviteNote('')
                    }}
                  >
                    <Text className="text-white">Invite</Text>
                  </Button>
                </HStack>
                <Select value={inviteRoleFilter} onValueChange={(value) => setInviteRoleFilter(value as 'all' | TournamentGrantRole)}>
                  <option value="all">All invite roles</option>
                  <option value="admin">admin</option>
                  <option value="scorer">scorer</option>
                  <option value="viewer">viewer</option>
                </Select>
                <Text className="text-sm text-slate-500">
                  {visibleInviteEntries.length} visible invite{visibleInviteEntries.length === 1 ? '' : 's'} • {pendingInviteEntries.length} total
                </Text>
                {visibleInviteEntries.length === 0 ? (
                  <Text className="text-sm text-slate-500">{pendingInviteEntries.length === 0 ? 'No pending invites.' : 'No pending invites match this role filter.'}</Text>
                ) : (
                  <VStack className="gap-3">
                    {visibleInviteEntries.map(([inviteID, invite]) => (
                      <Box key={inviteID} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <HStack className="items-start justify-between gap-3">
                          <VStack className="gap-1">
                            <Text className="font-semibold text-slate-900">{invite.email}</Text>
                            <Text className="text-xs text-slate-500">
                              {invite.role} • expires {new Date(invite.expiresAt).toLocaleDateString()} • {new Date(invite.expiresAt).getTime() < Date.now() ? 'expired' : 'active'}
                            </Text>
                            {invite.note ? <Text className="text-sm text-slate-600">{invite.note}</Text> : null}
                          </VStack>
                          <HStack className="gap-2">
                            <Select value={invite.role} onValueChange={(value) => updateTournamentPendingInvite(tournamentID, inviteID, { role: value as TournamentGrantRole })} disabled={!canManage}>
                              <option value="admin">admin</option>
                              <option value="scorer">scorer</option>
                              <option value="viewer">viewer</option>
                            </Select>
                            <Button variant="outline" onClick={() => resendTournamentPendingInvite(tournamentID, inviteID)} disabled={!canManage}>
                              <Text>Resend</Text>
                            </Button>
                            <Button variant="outline" onClick={() => deleteTournamentPendingInvite(tournamentID, inviteID)} disabled={!canManage}>
                              <Text>Revoke</Text>
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>

            {canTransfer ? (
              <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <VStack className="gap-3">
                  <Heading size="sm">Ownership Transfer</Heading>
                  <Text className="text-sm text-slate-600">
                    Transfer this tournament to an existing granted user. The current owner will be retained as an admin.
                  </Text>
                  <HStack className="gap-3 flex-wrap">
                    <Select value={transferOwnerID} onValueChange={setTransferOwnerID}>
                      <option value="">Choose new owner</option>
                      {staffEntries.map(([assignmentID, assignment]) => (
                        <option key={assignmentID} value={assignment.subjectID}>{assignment.subjectID}</option>
                      ))}
                    </Select>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!transferOwnerID) return
                        await transferTournamentOwnership(tournamentID, transferOwnerID)
                        setTransferOwnerID('')
                      }}
                    >
                      <Text>Transfer Ownership</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            ) : null}
          </VStack>
        ) : (
          <Box className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <VStack className="gap-2">
              <Heading size="sm">{tabs.find((tab) => tab.id === activeTab)?.label}</Heading>
              <Text className="text-sm text-slate-600">
                This tournament section is wired into the new tournament shell and ready for deeper event/bracket/schedule work without changing existing match IDs or scoreboard links.
              </Text>
            </VStack>
          </Box>
          )
        )}
      </VStack>

      <OverlayDialog
        isOpen={Boolean(editingBracketNode)}
        onClose={() => setEditingBracketNode(null)}
        title="Edit Bracket Node"
        footer={(
          <>
            <Button variant="outline" onClick={() => setEditingBracketNode(null)}>
              <Text>Cancel</Text>
            </Button>
            <Button
              action="primary"
              onClick={async () => {
                if (!editingBracketNode) return
                await updateTournamentBracketNode(tournamentID, editingBracketNode.bracketID, editingBracketNode.nodeID, {
                  sourceMatchID: editingBracketNode.sourceMatchID,
                  status: editingBracketNode.status as TournamentBracketNode['status'],
                })
                setEditingBracketNode(null)
              }}
            >
              <Text className="text-white">Save Node</Text>
            </Button>
          </>
        )}
      >
        {editingBracketNode ? (
          <VStack className="gap-3">
            <Input value={editingBracketNode.sourceMatchID} onChangeText={(value) => setEditingBracketNode((current) => current ? { ...current, sourceMatchID: value } : current)} placeholder="Source match ID" />
            <Select value={editingBracketNode.status} onValueChange={(value) => setEditingBracketNode((current) => current ? { ...current, status: value } : current)}>
              <option value="unassigned">unassigned</option>
              <option value="queued">queued</option>
              <option value="on-table">on-table</option>
              <option value="in-progress">in-progress</option>
              <option value="final">final</option>
              <option value="disputed">disputed</option>
            </Select>
            <Select value={bracketNodeScheduleTableID} onValueChange={setBracketNodeScheduleTableID}>
              <option value="">Unassigned table</option>
              {tableOptions.map((table) => (
                <option key={table.id} value={table.id}>{table.tableName}</option>
              ))}
            </Select>
            <Input type="datetime-local" value={bracketNodeScheduleTime} onChangeText={setBracketNodeScheduleTime} />
          </VStack>
        ) : null}
      </OverlayDialog>
    </Box>
  )
}
