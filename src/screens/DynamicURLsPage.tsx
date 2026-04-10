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
  const [showDynamicURLModal, setShowDynamicURLModal] = useState(false)
  const [editingDynamicURL, setEditingDynamicURL] = useState<{ myDynamicURLID: string; dynamicURLID: string } | null>(null)
  const [dynamicURLDraft, setDynamicURLDraft] = useState<DynamicURLDraft>(emptyDynamicURLDraft)
  const [pendingDeleteDynamicURL, setPendingDeleteDynamicURL] = useState<{ myDynamicURLID: string; dynamicURLID: string; name: string } | null>(null)

  useEffect(() => {
    if (authLoading) return

    const unsubscribeURLs = subscribeToMyDynamicURLs((urls) => {
      setDynamicURLs(urls as DynamicURLEntry[])
      setLoading(false)
    })
    const unsubscribeScoreboards = subscribeToMyScoreboards((scoreboardRows) => setScoreboards(scoreboardRows as ScoreboardEntry[]), user?.uid || 'mylocalserver')
    const unsubscribeTables = subscribeToMyTables((tableRows) => setTables(tableRows.map(([myTableID, table]) => [myTableID, table as TableSummary] as TableEntry)))
    const unsubscribeTeamMatches = subscribeToMyTeamMatches((teamMatchRows) => setTeamMatches(teamMatchRows as TeamMatchEntry[]), user?.uid || 'mylocalserver')

    return () => {
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
    await reloadDynamicURLs()
  }

  const handleDeleteDynamicURL = async () => {
    if (!pendingDeleteDynamicURL) return
    await deleteDynamicURL(pendingDeleteDynamicURL.myDynamicURLID, pendingDeleteDynamicURL.dynamicURLID)
    setPendingDeleteDynamicURL(null)
    await reloadDynamicURLs()
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
        <HStack className="items-center justify-between">
          <Heading size="lg">Dynamic URLs</Heading>
          <Button onClick={openNewDynamicURLModal}>
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
                  <HStack className="items-center justify-between gap-3">
                    <VStack className="flex-1">
                      <Text className="font-semibold text-slate-900">{dynamicURL.dynamicURLName}</Text>
                      <Text className="text-xs text-slate-500">
                        {dynamicURL.tableID ? `Table ${dynamicURL.tableID}` : `Team match ${dynamicURL.teammatchID || dynamicURL.teamMatchID}`}
                      </Text>
                    </VStack>
                    <HStack className="items-center gap-2">
                      <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditDynamicURLModal(myDynamicURLID, dynamicURL)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteDynamicURL({ myDynamicURLID, dynamicURLID: dynamicURL.id, name: dynamicURL.dynamicURLName })}>
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
          <Input placeholder="Dynamic URL name" value={dynamicURLDraft.dynamicURLName} onChangeText={(value) => setDynamicURLDraft((current) => ({ ...current, dynamicURLName: value }))} />
          <Select value={dynamicURLDraft.scoreboardID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, scoreboardID: value }))}>
            <option value="">Select scoreboard</option>
            {scoreboardOptions.map((scoreboard) => (
              <option key={scoreboard.id} value={scoreboard.id}>{scoreboard.label}</option>
            ))}
          </Select>
          <Select value={dynamicURLDraft.targetType} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, targetType: value as DynamicURLDraft['targetType'] }))}>
            <option value="table">Table</option>
            <option value="teamMatch">Team Match</option>
          </Select>
          {dynamicURLDraft.targetType === 'table' ? (
            <Select value={dynamicURLDraft.tableID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, tableID: value }))}>
              <option value="">Select table</option>
              {tables.map(([myTableID, table]) => (
                <option key={myTableID} value={table.tableID}>{table.tableName}</option>
              ))}
            </Select>
          ) : (
            <>
              <Select value={dynamicURLDraft.teammatchID} onValueChange={(value) => setDynamicURLDraft((current) => ({ ...current, teammatchID: value }))}>
                <option value="">Select team match</option>
                {teamMatches.map(([myTeamMatchID, match]) => (
                  <option key={myTeamMatchID} value={match.id}>{match.teamAName} vs {match.teamBName}</option>
                ))}
              </Select>
              <Input placeholder="Table number" value={dynamicURLDraft.tableNumber} onChangeText={(value) => setDynamicURLDraft((current) => ({ ...current, tableNumber: value }))} />
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
