import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack, Card, CardBody } from '@/components/ui'
import { CheckIcon, CopyIcon, ExternalLinkIcon, LinkIcon, PencilIcon, PlusIcon, ScoreboardIcon, TablesIcon, TrashIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { createNewTable, deleteTable, getMyTables, updateTable } from '@/functions/tables'
import { getMyPlayerLists } from '@/functions/players'
import { supportedSports } from '@/functions/sports'
import { getMyScoreboards } from '@/functions/scoreboards'
import { addDynamicURL, getMyDynamicURLs } from '@/functions/dynamicurls'

type TableDraft = {
  tableName: string
  sportName: string
  scoringType: string
  playerListID: string
}

type TableRow = {
  myTableID: string
  tableID: string
  tableName: string
  sportName: string
  scoringType?: string
  playerListID?: string
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

  useEffect(() => {
    if (authLoading) return

    async function fetchData() {
      try {
        const [myTables, myPlayerLists] = await Promise.all([
          getMyTables(),
          getMyPlayerLists(),
        ])
        setTables((myTables as Array<[string, Omit<TableRow, 'myTableID'>]>).map(([myTableID, data]) => ({ myTableID, ...data })))
        setPlayerLists((myPlayerLists || []) as PlayerListEntry[])
        setScoreboards((await getMyScoreboards(user?.uid || 'mylocalserver')) as ScoreboardEntry[])
        setDynamicURLs((await getMyDynamicURLs()) as DynamicURLEntry[])
      } catch (error) {
        console.error('Error fetching tables:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authLoading])

  const scoringTypeOptions = useMemo(() => {
    const sport = supportedSports[tableDraft.sportName]
    return sport?.scoringTypes
      ? Object.entries(sport.scoringTypes as Record<string, { displayName: string }>)
      : []
  }, [tableDraft.sportName])

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
    })
    setShowTableModal(true)
  }

  const handleSaveTable = async () => {
    if (!tableDraft.tableName.trim()) return

    if (editingTable) {
      await updateTable(editingTable.tableID, tableDraft)
    } else {
      await createNewTable(
        tableDraft.tableName.trim(),
        tableDraft.playerListID || '',
        tableDraft.sportName,
        tableDraft.scoringType || ''
      )
    }

    setShowTableModal(false)
    setEditingTable(null)
    setTableDraft(emptyTableDraft)
    await reloadTables()
  }

  const handleDeleteTable = async () => {
    if (!pendingDeleteTable) return
    await deleteTable(pendingDeleteTable.myTableID)
    setPendingDeleteTable(null)
    await reloadTables()
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
    setDynamicURLs((await getMyDynamicURLs()).filter(Boolean) as DynamicURLEntry[])
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
        <HStack className="justify-between items-center">
          <VStack className="gap-1">
            <Heading size="lg">Tables</Heading>
            <Text className="text-gray-600">Manage tables and jump straight into scoring</Text>
          </VStack>
          <Button size="sm" action="primary" onClick={openNewTableModal}>
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">Add Table</Text>
          </Button>
        </HStack>

        <VStack className="gap-3">
          {tables.length === 0 ? (
            <Box className="p-8 text-center">
              <TablesIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500 mb-2">No tables yet</Text>
              <Text className="text-gray-400 text-sm">Create your first table to get started</Text>
            </Box>
          ) : (
            tables.map((table) => (
              <Card key={table.myTableID} variant="elevated">
                <CardBody>
                  <HStack className="items-center justify-between gap-4">
                    <VStack className="flex-1 gap-1">
                      <Text className="font-semibold text-slate-900">{table.tableName}</Text>
                      <Text className="text-xs text-slate-500">
                        {supportedSports[table.sportName]?.displayName || 'Table Tennis'}
                        {table.scoringType ? ` • ${table.scoringType}` : ''}
                      </Text>
                    </VStack>
                    <HStack className="items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/scoring/table/${table.tableID}`)}>
                        <Text>Score</Text>
                      </Button>
                      <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openTableLinksModal(table)}>
                        <LinkIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditTableModal(table)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteTable(table)}>
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
          <Input placeholder="Table name" value={tableDraft.tableName} onChangeText={(value) => setTableDraft((current) => ({ ...current, tableName: value }))} />
          <Select value={tableDraft.sportName} onValueChange={(value) => setTableDraft((current) => ({ ...current, sportName: value, scoringType: '' }))}>
            {Object.entries(supportedSports).map(([key, sport]) => (
              <option key={key} value={key}>{sport.displayName}</option>
            ))}
          </Select>
          {scoringTypeOptions.length > 0 ? (
            <Select value={tableDraft.scoringType} onValueChange={(value) => setTableDraft((current) => ({ ...current, scoringType: value }))}>
              <option value="">Default scoring</option>
              {scoringTypeOptions.map(([key, value]) => (
                <option key={key} value={key}>{value.displayName}</option>
              ))}
            </Select>
          ) : null}
          <Select value={tableDraft.playerListID} onValueChange={(value) => setTableDraft((current) => ({ ...current, playerListID: value }))}>
            <option value="">No player list</option>
            {playerLists.map(([myPlayerListID, list]) => (
              <option key={myPlayerListID} value={list.id}>{list.playerListName}</option>
            ))}
          </Select>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteTable}
        onClose={() => setPendingDeleteTable(null)}
        onConfirm={handleDeleteTable}
        title="Remove Table"
        message={`Remove ${pendingDeleteTable?.tableName || 'this table'} from your visible table list?`}
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
                  <HStack className="items-start justify-between gap-3">
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
        <Input value={dynamicURLName} onChangeText={setDynamicURLName} placeholder="Dynamic URL name" />
      </OverlayDialog>
    </Box>
  )
}
