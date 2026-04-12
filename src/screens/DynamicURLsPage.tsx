import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, ScoreboardIcon, TrashIcon } from '@/components/icons'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import { addDynamicURL, deleteDynamicURL, subscribeToMyDynamicURLs, updateDynamicURL } from '@/functions/dynamicurls'
import { subscribeToMyScoreboards } from '@/functions/scoreboards'
import { subscribeToMyTables } from '@/functions/tables'
import { subscribeToMyTeamMatches } from '@/functions/teammatches'
import { useAuth } from '@/lib/auth'
import SyncIndicator from '@/components/realtime/SyncIndicator'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'
import LabeledField from '@/components/forms/LabeledField'

type DynamicURLDraft = {
  dynamicURLName: string
  scoreboardID: string
  targetType: 'table' | 'teamMatch'
  tableID: string
  teammatchID: string
  tableNumber: string
}

type DynamicURLRecord = {
  id: string
  dynamicURLName: string
  scoreboardID: string
  tableID?: string
  teammatchID?: string
  teamMatchID?: string
  tableNumber?: string
}

type ScoreboardSummary = {
  id: string
  name: string
}

type TableSummary = {
  tableID: string
  tableName: string
  currentGameID?: string
  activeGameAtTable?: boolean
}

type TeamMatchSummary = {
  id: string
  teamAName: string
  teamBName: string
}

type DynamicURLEntry = [string, DynamicURLRecord]
type ScoreboardEntry = [string, ScoreboardSummary]
type TableEntry = [string, TableSummary]
type TeamMatchEntry = [string, TeamMatchSummary]

const emptyDynamicURLDraft = {
  dynamicURLName: '',
  scoreboardID: '',
  targetType: 'table',
  tableID: '',
  teammatchID: '',
  tableNumber: '',
} satisfies DynamicURLDraft

export default function DynamicURLsPage() {
  const { user, loading: authLoading } = useAuth()
  const [dynamicURLs, setDynamicURLs] = useState<DynamicURLEntry[]>([])
  const [scoreboards, setScoreboards] = useState<ScoreboardEntry[]>([])
  const [tables, setTables] = useState<TableEntry[]>([])
  const [teamMatches, setTeamMatches] = useState<TeamMatchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')
  const [showDynamicURLModal, setShowDynamicURLModal] = useState(false)
  const [editingDynamicURL, setEditingDynamicURL] = useState<{ myDynamicURLID: string; dynamicURLID: string } | null>(null)
  const [dynamicURLDraft, setDynamicURLDraft] = useState<DynamicURLDraft>(emptyDynamicURLDraft)
  const [pendingDeleteDynamicURL, setPendingDeleteDynamicURL] = useState<{ myDynamicURLID: string; dynamicURLID: string; name: string } | null>(null)

  useEffect(() => {
    if (authLoading) return

    const unsubscribeState = subscribeToPathState(`users/${user?.uid || 'mylocalserver'}/myDynamicURLs`, (state) => {
      setSyncStatus(state.status)
    })
    const unsubscribeURLs = subscribeToMyDynamicURLs((urls) => {
      setDynamicURLs(urls as DynamicURLEntry[])
      setLoading(false)
    })
    const unsubscribeScoreboards = subscribeToMyScoreboards((scoreboardRows) => setScoreboards(scoreboardRows as ScoreboardEntry[]), user?.uid || 'mylocalserver')
    const unsubscribeTables = subscribeToMyTables((tableRows) => setTables(tableRows.map(([myTableID, table]) => [myTableID, table as TableSummary] as TableEntry)))
    const unsubscribeTeamMatches = subscribeToMyTeamMatches((teamMatchRows) => setTeamMatches(teamMatchRows as TeamMatchEntry[]), user?.uid || 'mylocalserver')

    return () => {
      unsubscribeState()
      unsubscribeURLs()
      unsubscribeScoreboards()
      unsubscribeTables()
      unsubscribeTeamMatches()
    }
  }, [authLoading, user])

  const reloadDynamicURLs = async () => {
    setShowDynamicURLModal(false)
  }

  const openNewDynamicURLModal = () => {
    setEditingDynamicURL(null)
    setDynamicURLDraft(emptyDynamicURLDraft)
    setShowDynamicURLModal(true)
  }

  const openEditDynamicURLModal = (myDynamicURLID: string, dynamicURL: DynamicURLRecord) => {
    setEditingDynamicURL({ myDynamicURLID, dynamicURLID: dynamicURL.id })
    setDynamicURLDraft({
      dynamicURLName: dynamicURL.dynamicURLName || '',
      scoreboardID: dynamicURL.scoreboardID || '',
      targetType: dynamicURL.teammatchID || dynamicURL.teamMatchID ? 'teamMatch' : 'table',
      tableID: dynamicURL.tableID || '',
      teammatchID: dynamicURL.teammatchID || dynamicURL.teamMatchID || '',
      tableNumber: dynamicURL.tableNumber || '',
    })
    setShowDynamicURLModal(true)
  }

  const handleSaveDynamicURL = async () => {
    if (!dynamicURLDraft.dynamicURLName.trim() || !dynamicURLDraft.scoreboardID) return

    const payload = {
      dynamicURLName: dynamicURLDraft.dynamicURLName.trim(),
      scoreboardID: dynamicURLDraft.scoreboardID,
      tableID: dynamicURLDraft.targetType === 'table' ? dynamicURLDraft.tableID : '',
      teammatchID: dynamicURLDraft.targetType === 'teamMatch' ? dynamicURLDraft.teammatchID : '',
      teamMatchID: dynamicURLDraft.targetType === 'teamMatch' ? dynamicURLDraft.teammatchID : '',
      tableNumber: dynamicURLDraft.targetType === 'teamMatch' ? dynamicURLDraft.tableNumber : '',
    }

    if (editingDynamicURL) {
      await updateDynamicURL(editingDynamicURL.myDynamicURLID, editingDynamicURL.dynamicURLID, payload)
    } else {
      await addDynamicURL(payload)
    }

    setShowDynamicURLModal(false)
    setEditingDynamicURL(null)
    setDynamicURLDraft(emptyDynamicURLDraft)
    // Subscription fires when data changes — no manual reload needed
  }

  const handleDeleteDynamicURL = async () => {
    if (!pendingDeleteDynamicURL) return
    await deleteDynamicURL(pendingDeleteDynamicURL.myDynamicURLID, pendingDeleteDynamicURL.dynamicURLID)
    setPendingDeleteDynamicURL(null)
    // Subscription fires when data changes — no manual reload needed
  }

  const scoreboardOptions = useMemo(
    () => scoreboards.map(([, scoreboard]) => ({ id: scoreboard.id, label: scoreboard.name })),
    [scoreboards],
  )

  if (authLoading || loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              <Heading size="lg">Dynamic URLs</Heading>
              <SyncIndicator status={syncStatus} />
            </HStack>
            <Text className="text-gray-500 text-sm">Shareable scoreboard links for tables and team matches</Text>
          </VStack>
          <Button onClick={openNewDynamicURLModal} className="w-full sm:w-auto">
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New Dynamic URL</Text>
          </Button>
        </HStack>

        <VStack className="gap-3">
          {dynamicURLs.length === 0 ? (
            <Box className="p-8 text-center">
              <ScoreboardIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <Text className="text-gray-500">No dynamic URLs yet</Text>
              <Text className="text-sm text-gray-400">Create one to route overlays to tables or team matches.</Text>
            </Box>
          ) : (
            dynamicURLs.map(([myDynamicURLID, dynamicURL]) => (
              <Card key={myDynamicURLID} variant="elevated">
                <CardBody>
                  <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <VStack className="flex-1">
                      <Text className="font-semibold text-slate-900">{dynamicURL.dynamicURLName}</Text>
                      <Text className="text-xs text-slate-500">
                        {dynamicURL.tableID ? `Table ${dynamicURL.tableID}` : `Team match ${dynamicURL.teammatchID || dynamicURL.teamMatchID}`}
                      </Text>
                    </VStack>
                    <HStack className="flex-wrap items-center gap-2">
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => openEditDynamicURLModal(myDynamicURLID, dynamicURL)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteDynamicURL({ myDynamicURLID, dynamicURLID: dynamicURL.id, name: dynamicURL.dynamicURLName })}>
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
        isOpen={showDynamicURLModal}
        onClose={() => setShowDynamicURLModal(false)}
        title={editingDynamicURL ? 'Edit Dynamic URL' : 'Create Dynamic URL'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowDynamicURLModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveDynamicURL}>
              <Text className="text-white">{editingDynamicURL ? 'Save Changes' : 'Create Dynamic URL'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="Dynamic URL Name">
            <Input placeholder="Dynamic URL name" value={dynamicURLDraft.dynamicURLName} onChangeText={(value) => setDynamicURLDraft((current) => ({ ...current, dynamicURLName: value }))} />
          </LabeledField>
          <LabeledField label="Scoreboard">
            <Select value={dynamicURLDraft.scoreboardID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, scoreboardID: value }))}>
              <option value="">Select scoreboard</option>
              {scoreboardOptions.map((scoreboard) => (
                <option key={scoreboard.id} value={scoreboard.id}>{scoreboard.label}</option>
              ))}
            </Select>
          </LabeledField>
          <LabeledField label="Target Type">
            <Select value={dynamicURLDraft.targetType} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, targetType: value as DynamicURLDraft['targetType'] }))}>
              <option value="table">Table</option>
              <option value="teamMatch">Team Match</option>
            </Select>
          </LabeledField>
          {dynamicURLDraft.targetType === 'table' ? (
            <LabeledField label="Table">
              <Select value={dynamicURLDraft.tableID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, tableID: value }))}>
                <option value="">Select table</option>
                {tables.map(([myTableID, table]) => (
                  <option key={myTableID} value={table.tableID}>{table.tableName}</option>
                ))}
              </Select>
            </LabeledField>
          ) : (
            <>
              <LabeledField label="Team Match">
                <Select value={dynamicURLDraft.teammatchID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, teammatchID: value }))}>
                  <option value="">Select team match</option>
                  {teamMatches.map(([myTeamMatchID, match]) => (
                    <option key={myTeamMatchID} value={match.id}>{match.teamAName} vs {match.teamBName}</option>
                  ))}
                </Select>
              </LabeledField>
              <LabeledField label="Table Number">
                <Select value={dynamicURLDraft.tableNumber} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, tableNumber: value }))}>
                  <option value="">Select available table</option>
                  {tables
                    .filter(([, table]) => !table.currentGameID && !table.activeGameAtTable)
                    .map(([, table]) => (
                      <option key={table.tableID} value={table.tableID}>{table.tableName}</option>
                    ))}
                </Select>
              </LabeledField>
            </>
          )}
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteDynamicURL}
        onClose={() => setPendingDeleteDynamicURL(null)}
        onConfirm={handleDeleteDynamicURL}
        title="Delete Dynamic URL"
        message={`Delete ${pendingDeleteDynamicURL?.name || 'this dynamic URL'}?`}
        confirmLabel="Delete"
      />
    </Box>
  )
}
