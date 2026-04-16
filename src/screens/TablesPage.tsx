import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack, Card, CardBody } from '@/components/ui'
import { CheckIcon, CopyIcon, ExternalLinkIcon, LinkIcon, PencilIcon, PlusIcon, ScoreboardIcon, TablesIcon, TrashIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import { createNewTable, deleteTable, getMyTables, subscribeToMyTables, updateTable } from '@/functions/tables'
import { getMyPlayerLists } from '@/functions/players'
import { supportedSports } from '@/functions/sports'
import { getMyScoreboards, subscribeToMyScoreboards } from '@/functions/scoreboards'
import { addDynamicURL, getMyDynamicURLs, subscribeToMyDynamicURLs } from '@/functions/dynamicurls'
import { promoteNextScheduledMatch } from '@/functions/scoring'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'
import LabeledField from '@/components/forms/LabeledField'

type TableDraft = {
  tableName: string
  sportName: string
  scoringType: string
  playerListID: string
  autoAdvanceMode: 'manual' | 'prompt' | 'automatic'
  autoAdvanceDelaySeconds: string
}

type TableRow = {
  myTableID: string
  tableID: string
  tableName: string
  sportName: string
  scoringType?: string
  playerListID?: string
  currentMatchID?: string
  currentMatchSummary?: {
    label: string
    scoreLabel: string
    contextLabel?: string
  } | null
  queueCount?: number
  nextScheduledMatch?: {
    label: string
    startTime: string
    contextLabel?: string
  } | null
  autoAdvanceMode?: 'manual' | 'prompt' | 'automatic'
  autoAdvanceDelaySeconds?: number
  status?: string
}

type PlayerListRow = {
  id: string
  playerListName: string
}

type PlayerListEntry = [string, PlayerListRow]

type ScoreboardRow = {
  id: string
  name: string
  type?: string
}

type ScoreboardEntry = [string, ScoreboardRow]

type DynamicURLRow = {
  dynamicURLName?: string
  scoreboardID?: string
  tableID?: string
}

type DynamicURLEntry = [string, DynamicURLRow]

type TableScoreboardLink = {
  myScoreboardID: string
  scoreboardID: string
  scoreboardName: string
  scoreboardType: string
  href: string
  existingDynamicURL?: DynamicURLEntry
}

const emptyTableDraft = {
  tableName: '',
  sportName: 'tableTennis',
  scoringType: '',
  playerListID: '',
  autoAdvanceMode: 'manual',
  autoAdvanceDelaySeconds: '0',
} satisfies TableDraft

export default function TablesPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [tables, setTables] = useState<TableRow[]>([])
  const [playerLists, setPlayerLists] = useState<PlayerListEntry[]>([])
  const [scoreboards, setScoreboards] = useState<ScoreboardEntry[]>([])
  const [dynamicURLs, setDynamicURLs] = useState<DynamicURLEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showTableLinksModal, setShowTableLinksModal] = useState(false)
  const [showDynamicURLSaveModal, setShowDynamicURLSaveModal] = useState(false)
  const [editingTable, setEditingTable] = useState<TableRow | null>(null)
  const [selectedTableForLinks, setSelectedTableForLinks] = useState<TableRow | null>(null)
  const [selectedLinkCombo, setSelectedLinkCombo] = useState<{ table: TableRow; combo: TableScoreboardLink } | null>(null)
  const [tableDraft, setTableDraft] = useState<TableDraft>(emptyTableDraft)
  const [dynamicURLName, setDynamicURLName] = useState('')
  const [pendingDeleteTable, setPendingDeleteTable] = useState<TableRow | null>(null)
  const [copiedHref, setCopiedHref] = useState('')
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')
  const [promotingTableID, setPromotingTableID] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')

  useEffect(() => {
    if (authLoading) return

    async function fetchStaticData() {
      try {
        const myPlayerLists = await getMyPlayerLists()
        setPlayerLists((myPlayerLists || []) as PlayerListEntry[])
      } catch (error) {
        console.error('Error fetching tables:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStaticData()

    const unsubscribeTableState = subscribeToPathState(`users/${user?.uid || 'mylocalserver'}/myTables`, (state) => {
      setSyncStatus(state.status)
    })
    const unsubscribeTables = subscribeToMyTables((nextTables) => {
      setTables(nextTables.map(([myTableID, data]) => ({ myTableID, ...(data as Omit<TableRow, 'myTableID'>) })))
    })
    const unsubscribeScoreboards = subscribeToMyScoreboards((nextScoreboards) => {
      setScoreboards(nextScoreboards as ScoreboardEntry[])
    }, user?.uid || 'mylocalserver')
    const unsubscribeDynamicURLs = subscribeToMyDynamicURLs((nextDynamicURLs) => {
      setDynamicURLs(nextDynamicURLs as DynamicURLEntry[])
    })

    return () => {
      unsubscribeTableState()
      unsubscribeTables()
      unsubscribeScoreboards()
      unsubscribeDynamicURLs()
    }
  }, [authLoading, user])

  const scoringTypeOptions = useMemo(() => {
    const sport = supportedSports[tableDraft.sportName]
    return sport?.scoringTypes
      ? Object.entries(sport.scoringTypes as Record<string, { displayName: string }>)
      : []
  }, [tableDraft.sportName])

  const autoAdvanceOptions = [
    { value: 'manual', label: 'Manual Only' },
    { value: 'prompt', label: 'Prompt Operator' },
    { value: 'automatic', label: 'Automatic After Match' },
  ]
  const tableStatusOptions = ['idle', 'queued', 'called', 'paused', 'active']
  const visibleTables = tables.filter((table) => statusFilter === 'all' ? true : (table.status || 'idle') === statusFilter)

  const handlePromoteNext = async (tableID: string) => {
    setPromotingTableID(tableID)
    try {
      await promoteNextScheduledMatch(tableID)
    } catch (error) {
      console.error('Error promoting next match:', error)
    } finally {
      setPromotingTableID('')
    }
  }

  const reloadTables = async () => {
    const myTables = await getMyTables()
    setTables((myTables as Array<[string, Omit<TableRow, 'myTableID'>]>).map(([myTableID, data]) => ({ myTableID, ...data })))
    setDynamicURLs((await getMyDynamicURLs()) as DynamicURLEntry[])
  }

  const openNewTableModal = () => {
    setEditingTable(null)
    setTableDraft(emptyTableDraft)
    setShowTableModal(true)
  }

  const openEditTableModal = (table: TableRow) => {
    setEditingTable(table)
    setTableDraft({
      tableName: table.tableName || '',
      sportName: table.sportName || 'tableTennis',
      scoringType: table.scoringType || '',
      playerListID: table.playerListID || '',
      autoAdvanceMode: table.autoAdvanceMode || 'manual',
      autoAdvanceDelaySeconds: `${table.autoAdvanceDelaySeconds || 0}`,
    })
    setShowTableModal(true)
  }

  const handleSaveTable = async () => {
    if (!tableDraft.tableName.trim()) return

    if (editingTable) {
      await updateTable(editingTable.tableID, {
        ...tableDraft,
        autoAdvanceDelaySeconds: Number(tableDraft.autoAdvanceDelaySeconds) || 0,
      })
    } else {
      await createNewTable(
        tableDraft.tableName.trim(),
        tableDraft.playerListID || '',
        tableDraft.sportName,
        tableDraft.scoringType || '',
        tableDraft.autoAdvanceMode,
        Number(tableDraft.autoAdvanceDelaySeconds) || 0,
      )
    }

    setShowTableModal(false)
    setEditingTable(null)
    setTableDraft(emptyTableDraft)
    // Subscription (subscribeToPathState + subscribeToMyTables) fires when data changes — no manual reload needed
  }

  const handleDeleteTable = async () => {
    if (!pendingDeleteTable) return
    await deleteTable(pendingDeleteTable.myTableID)
    setPendingDeleteTable(null)
    // Subscription fires when data changes — no manual reload needed
  }

  const getTableScoreboardLinks = (table: TableRow): TableScoreboardLink[] => {
    const baseURL = typeof window !== 'undefined' ? window.location.origin : ''
    return scoreboards.map(([myScoreboardID, scoreboard]) => {
      const href = `${baseURL}/scoreboard/view?sid=${scoreboard.id}&tid=${table.tableID}`
      const existingDynamicURL = dynamicURLs.find(([, dynamicURL]) => dynamicURL.tableID === table.tableID && dynamicURL.scoreboardID === scoreboard.id)
      return {
        myScoreboardID,
        scoreboardID: scoreboard.id,
        scoreboardName: scoreboard.name || 'Untitled Scoreboard',
        scoreboardType: scoreboard.type || 'liveStream',
        href,
        existingDynamicURL,
      }
    })
  }

  const handleCopyLink = async (href: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(href)
      setCopiedHref(href)
      window.setTimeout(() => {
        setCopiedHref((current) => current === href ? '' : current)
      }, 1800)
    }
  }

  const openTableLinksModal = (table: TableRow) => {
    setSelectedTableForLinks(table)
    setShowTableLinksModal(true)
  }

  const openSaveDynamicURLModal = (table: TableRow, combo: TableScoreboardLink) => {
    setSelectedLinkCombo({ table, combo })
    setDynamicURLName(`${table.tableName} • ${combo.scoreboardName}`)
    setShowDynamicURLSaveModal(true)
  }

  const handleSaveDynamicURL = async () => {
    if (!selectedLinkCombo || !dynamicURLName.trim()) return

    await addDynamicURL({
      dynamicURLName: dynamicURLName.trim(),
      scoreboardID: selectedLinkCombo.combo.scoreboardID,
      tableID: selectedLinkCombo.table.tableID,
    })

    setShowDynamicURLSaveModal(false)
    setSelectedLinkCombo(null)
    setDynamicURLName('')
    // Subscription handles live updates — no manual reload needed
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Spinner size="lg" />
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to view your tables</Text>
          <Pressable className="bg-blue-600 px-4 py-2 rounded" onPress={() => navigate('/login')}>
            <Text className="text-white font-medium">Sign In</Text>
          </Pressable>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <Heading size="lg">Tables</Heading>
            <Text className="text-gray-600">Manage tables and jump straight into scoring</Text>
            <LiveStatusBadge status={syncStatus} />
          </VStack>
          <HStack className="gap-2 items-end">
            <LabeledField label="Status Filter" className="min-w-[11rem]">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)} className="w-full min-w-0 sm:min-w-[11rem]">
                <option value="all">All statuses</option>
                {tableStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </LabeledField>
            <Button size="sm" action="primary" onClick={openNewTableModal} className="w-full sm:w-auto">
              <PlusIcon size={16} />
              <Text className="ml-1 text-white">Add Table</Text>
            </Button>
          </HStack>
        </HStack>

        <VStack className="gap-3">
          {visibleTables.length === 0 ? (
            <Box className="p-8 text-center">
              <TablesIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500 mb-2">{tables.length === 0 ? 'No tables yet' : 'No tables match this status'}</Text>
              <Text className="text-gray-400 text-sm">{tables.length === 0 ? 'Create your first table to get started' : 'Try a different filter to see more tables'}</Text>
            </Box>
          ) : (
            visibleTables.map((table) => (
              <Card key={table.myTableID} variant="elevated">
                <CardBody>
                  <HStack className="flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
                    <VStack className="flex-1 gap-1">
                      <Text className="font-semibold text-slate-900">{table.tableName}</Text>
                      <Text className="text-xs text-slate-500">
                        {supportedSports[table.sportName]?.displayName || 'Table Tennis'}
                        {table.scoringType ? ` • ${table.scoringType}` : ''}
                      </Text>
                      <HStack className="flex-wrap gap-2 text-xs text-slate-500">
                        <Text className="rounded-full bg-slate-100 px-2 py-1 uppercase tracking-[0.12em]">{table.status || 'idle'}</Text>
                        <Text>{table.queueCount || 0} queued</Text>
                        <Text>Advance: {table.autoAdvanceMode || 'manual'}</Text>
                      </HStack>
                      {table.currentMatchSummary ? (
                        <VStack className="gap-0.5">
                          <Text className="text-xs text-slate-700">
                            Live: {table.currentMatchSummary.label} • {table.currentMatchSummary.scoreLabel}
                          </Text>
                          {table.currentMatchSummary.contextLabel ? (
                            <Text className="text-[11px] text-slate-500">{table.currentMatchSummary.contextLabel}</Text>
                          ) : null}
                        </VStack>
                      ) : null}
                      {table.nextScheduledMatch ? (
                        <VStack className="gap-0.5">
                          <Text className="text-xs text-slate-500">
                            Next: {table.nextScheduledMatch.label}
                          </Text>
                          {table.nextScheduledMatch.contextLabel ? (
                            <Text className="text-[11px] text-slate-400">{table.nextScheduledMatch.contextLabel}</Text>
                          ) : null}
                        </VStack>
                      ) : null}
                    </VStack>
                    <HStack className="flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/scoring/table/${table.tableID}`)} className="w-full sm:w-auto">
                        <Text>Score</Text>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/scheduledtablematches?tableID=${table.tableID}`)} className="w-full sm:w-auto">
                        <Text>Queue</Text>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteNext(table.tableID)}
                        disabled={promotingTableID === table.tableID || Boolean(table.currentMatchID) || !table.queueCount}
                        className="w-full sm:w-auto"
                      >
                        <Text>{promotingTableID === table.tableID ? 'Promoting...' : 'Promote Next'}</Text>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/qrcode?capabilityType=table_scoring&tableID=${table.tableID}&matchID=${table.currentMatchID || ''}&label=${encodeURIComponent(table.tableName)}`)} className="w-full sm:w-auto">
                        <Text>Secure Link</Text>
                      </Button>
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => openTableLinksModal(table)}>
                        <LinkIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => openEditTableModal(table)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteTable(table)}>
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
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title={editingTable ? 'Edit Table' : 'Add Table'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowTableModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveTable}>
              <Text className="text-white">{editingTable ? 'Save Changes' : 'Create Table'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="Table Name">
            <Input placeholder="Table name" value={tableDraft.tableName} onChangeText={(value) => setTableDraft((current) => ({ ...current, tableName: value }))} />
          </LabeledField>
          <LabeledField label="Sport">
            <Select value={tableDraft.sportName} onValueChange={(value) => setTableDraft((current) => ({ ...current, sportName: value, scoringType: '' }))}>
              {Object.entries(supportedSports).map(([key, sport]) => (
                <option key={key} value={key}>{sport.displayName}</option>
              ))}
            </Select>
          </LabeledField>
          {scoringTypeOptions.length > 0 ? (
            <LabeledField label="Scoring Type">
              <Select value={tableDraft.scoringType} onValueChange={(value) => setTableDraft((current) => ({ ...current, scoringType: value }))}>
                <option value="">Default scoring</option>
                {scoringTypeOptions.map(([key, value]) => (
                  <option key={key} value={key}>{value.displayName}</option>
                ))}
              </Select>
            </LabeledField>
          ) : null}
          <LabeledField label="Player List">
            <Select value={tableDraft.playerListID} onValueChange={(value) => setTableDraft((current) => ({ ...current, playerListID: value }))}>
              <option value="">No player list</option>
              {playerLists.map(([myPlayerListID, list]) => (
                <option key={myPlayerListID} value={list.id}>{list.playerListName}</option>
              ))}
            </Select>
          </LabeledField>
          <LabeledField label="Auto-Advance Mode">
            <Select value={tableDraft.autoAdvanceMode} onValueChange={(value) => setTableDraft((current) => ({ ...current, autoAdvanceMode: value as TableDraft['autoAdvanceMode'] }))}>
              {autoAdvanceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </LabeledField>
          <LabeledField label="Auto-Advance Delay (Seconds)">
            <Input
              type="number"
              min="0"
              placeholder="Auto-advance delay in seconds"
              value={tableDraft.autoAdvanceDelaySeconds}
              onChangeText={(value) => setTableDraft((current) => ({ ...current, autoAdvanceDelaySeconds: value }))}
            />
          </LabeledField>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteTable}
        onClose={() => setPendingDeleteTable(null)}
        onConfirm={handleDeleteTable}
        title="Remove Table"
        message={`Remove ${pendingDeleteTable?.tableName || 'this table'} from your visible table list?`}
        description="This will archive the table and remove it from your dashboard. The table data will be preserved and can be recovered during the retention window."
        confirmLabel="Remove"
      />

      <OverlayDialog
        isOpen={showTableLinksModal && !!selectedTableForLinks}
        onClose={() => {
          setShowTableLinksModal(false)
          setSelectedTableForLinks(null)
        }}
        title={`Scoreboard Links for ${selectedTableForLinks?.tableName || 'Table'}`}
        description="Each link combines this table's data with one scoreboard display. Open or copy a link directly, or save a combo as a dynamic URL."
        size="xl"
      >
        <VStack className="gap-3">
          {selectedTableForLinks ? getTableScoreboardLinks(selectedTableForLinks).map((combo) => (
            <Card key={combo.scoreboardID} variant="elevated">
              <CardBody>
                <VStack className="gap-3">
                  <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
                    <HStack className="items-start gap-3">
                      <Box className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-400/10">
                        <ScoreboardIcon size={18} className="text-blue-600" />
                      </Box>
                      <VStack className="gap-1">
                        <Text className="font-semibold text-slate-900">{combo.scoreboardName}</Text>
                        <Text className="text-xs uppercase tracking-[0.18em] text-slate-500">{combo.scoreboardType}</Text>
                      </VStack>
                    </HStack>
                    {combo.existingDynamicURL ? (
                      <Text className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Saved as {combo.existingDynamicURL[1].dynamicURLName || 'Dynamic URL'}
                      </Text>
                    ) : null}
                  </HStack>

                  <Box className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Text className="break-all font-mono text-xs text-slate-600">{combo.href}</Text>
                  </Box>

                  <HStack className="flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(combo.href)}
                      className={copiedHref === combo.href ? 'copy-pop border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : ''}
                    >
                      {copiedHref === combo.href ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                      <Text className="ml-1">{copiedHref === combo.href ? 'Copied' : 'Copy Link'}</Text>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(combo.href, '_blank')}>
                      <ExternalLinkIcon size={14} />
                      <Text className="ml-1">Open Link</Text>
                    </Button>
                    {!combo.existingDynamicURL ? (
                      <Button size="sm" action="primary" onClick={() => openSaveDynamicURLModal(selectedTableForLinks, combo)}>
                        <PlusIcon size={14} />
                        <Text className="ml-1 text-white">Save as Dynamic URL</Text>
                      </Button>
                    ) : null}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )) : null}
        </VStack>
      </OverlayDialog>

      <OverlayDialog
        isOpen={showDynamicURLSaveModal && !!selectedLinkCombo}
        onClose={() => {
          setShowDynamicURLSaveModal(false)
          setSelectedLinkCombo(null)
        }}
        title="Save Dynamic URL"
        description="Dynamic URLs let you save a table + scoreboard display combo as a reusable entry."
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowDynamicURLSaveModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveDynamicURL}>
              <Text className="text-white">Save Dynamic URL</Text>
            </Button>
          </>
        )}
      >
        <LabeledField label="Dynamic URL Name">
          <Input value={dynamicURLName} onChangeText={setDynamicURLName} placeholder="Dynamic URL name" />
        </LabeledField>
      </OverlayDialog>
    </Box>
  )
}
