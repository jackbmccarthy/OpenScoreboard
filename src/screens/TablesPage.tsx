// @ts-nocheck

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack, Card, CardBody } from '@/components/ui'
import { PencilIcon, PlusIcon, TablesIcon, TrashIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { createNewTable, deleteTable, getMyTables, updateTable } from '@/functions/tables'
import { getMyPlayerLists } from '@/functions/players'
import { supportedSports } from '@/functions/sports'

const emptyTableDraft = {
  tableName: '',
  sportName: 'tableTennis',
  scoringType: '',
  playerListID: '',
}

export default function TablesPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [tables, setTables] = useState([])
  const [playerLists, setPlayerLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTableModal, setShowTableModal] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [tableDraft, setTableDraft] = useState(emptyTableDraft)
  const [pendingDeleteTable, setPendingDeleteTable] = useState(null)

  useEffect(() => {
    if (authLoading) return

    async function fetchData() {
      try {
        const [myTables, myPlayerLists] = await Promise.all([
          getMyTables(),
          getMyPlayerLists(),
        ])
        setTables(myTables.map(([myTableID, data]) => ({ myTableID, ...data })))
        setPlayerLists(myPlayerLists)
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
    return sport?.scoringTypes ? Object.entries(sport.scoringTypes) : []
  }, [tableDraft.sportName])

  const reloadTables = async () => {
    const myTables = await getMyTables()
    setTables(myTables.map(([myTableID, data]) => ({ myTableID, ...data })))
  }

  const openNewTableModal = () => {
    setEditingTable(null)
    setTableDraft(emptyTableDraft)
    setShowTableModal(true)
  }

  const openEditTableModal = (table) => {
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
    </Box>
  )
}
