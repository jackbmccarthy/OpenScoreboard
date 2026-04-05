// @ts-nocheck

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useSearchParams } from 'react-router-dom'
import { getImportPlayerList, getMyPlayerLists, replacePlayersInList, sortPlayers } from '@/functions/players'
import { v4 as uuidv4 } from 'uuid'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'

function createEmptyRow() {
  return {
    id: uuidv4(),
    firstName: '',
    lastName: '',
    imageURL: '',
    country: '',
    isNew: true,
  }
}

export default function BulkPlayerPage() {
  const { loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [doneLoading, setDoneLoading] = useState(false)
  const [myPlayerLists, setMyPlayerLists] = useState([])
  const [selectedPlayerListID, setSelectedPlayerListID] = useState(searchParams.get('playerListID') || '')
  const [rows, setRows] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)

  async function loadPlayerLists() {
    setDoneLoading(false)
    try {
      const lists = await getMyPlayerLists()
      setMyPlayerLists(lists || [])
      if (!selectedPlayerListID && lists?.length) {
        setSelectedPlayerListID(lists[0][1].id)
      }
    } catch (err) {
      console.error('Error loading player lists:', err)
    } finally {
      setDoneLoading(true)
    }
  }

  async function loadPlayers(playerListID) {
    if (!playerListID) {
      setRows([])
      return
    }

    const players = await getImportPlayerList(playerListID)
    const sortedPlayers = players.length > 0 ? sortPlayers(players) : []
    setRows(sortedPlayers.map(([id, player]) => ({
      id,
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      imageURL: player.imageURL || '',
      country: player.country || '',
      raw: player,
      isNew: false,
    })))
  }

  useEffect(() => {
    if (authLoading) return
    loadPlayerLists()
  }, [authLoading])

  useEffect(() => {
    if (!selectedPlayerListID) return
    loadPlayers(selectedPlayerListID)
  }, [selectedPlayerListID])

  const visibleRows = useMemo(() => rows, [rows])

  const updateRow = (id, field, value) => {
    setRows((current) =>
      current.map((row) => row.id === id ? { ...row, [field]: value } : row)
    )
  }

  const handleAddRow = () => {
    setRows((current) => [...current, createEmptyRow()])
  }

  const confirmRemoveRow = () => {
    if (!pendingRemoval) return
    setRows((current) => current.filter((row) => row.id !== pendingRemoval.id))
    setPendingRemoval(null)
  }

  const handleSave = async () => {
    if (!selectedPlayerListID) {
      setError('Select a player list first')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {}
      visibleRows.forEach((row) => {
        if (!row.firstName.trim() && !row.lastName.trim()) {
          return
        }

        const rowID = row.isNew ? uuidv4() : row.id
        payload[rowID] = {
          ...(row.raw || {}),
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          imageURL: row.imageURL.trim(),
          country: row.country.trim().toUpperCase(),
          clubName: row.raw?.clubName || '',
          jerseyColor: row.raw?.jerseyColor || '',
          firstNameInitial: row.raw?.firstNameInitial || false,
          lastNameInitial: row.raw?.lastNameInitial || false,
          isImported: row.raw?.isImported || false,
        }
      })

      await replacePlayersInList(selectedPlayerListID, payload)
      setSuccess('Bulk player changes saved.')
      await loadPlayers(selectedPlayerListID)
    } catch (err: any) {
      setError(err.message || 'Failed to save player changes')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !doneLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <Text className="text-2xl font-bold">Bulk Manage Players</Text>
        <Text className="text-sm text-gray-600">
          Add rows, edit fields inline, or remove rows before saving the entire player list in one pass.
        </Text>

        <Select value={selectedPlayerListID} onValueChange={setSelectedPlayerListID}>
          <option value="">Select a player list</option>
          {myPlayerLists.map(([id, list]) => (
            <option key={id} value={list.id}>{list.playerListName}</option>
          ))}
        </Select>

        <VStack className="gap-3">
          {visibleRows.map((row) => (
            <Box key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <VStack className="gap-3">
                <HStack className="gap-3">
                  <Input placeholder="First name" value={row.firstName} onChangeText={(value) => updateRow(row.id, 'firstName', value)} />
                  <Input placeholder="Last name" value={row.lastName} onChangeText={(value) => updateRow(row.id, 'lastName', value)} />
                </HStack>
                <HStack className="gap-3">
                  <Input placeholder="Image URL" value={row.imageURL} onChangeText={(value) => updateRow(row.id, 'imageURL', value)} />
                  <Input placeholder="Country" value={row.country} onChangeText={(value) => updateRow(row.id, 'country', value.toUpperCase())} />
                </HStack>
                <Button variant="outline" onClick={() => setPendingRemoval({ id: row.id, label: `${row.firstName} ${row.lastName}`.trim() || 'this player row' })}>
                  <Text>Remove Row</Text>
                </Button>
              </VStack>
            </Box>
          ))}
        </VStack>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        {success ? <Text className="text-sm text-green-600">{success}</Text> : null}

        <HStack className="gap-3">
          <Button variant="outline" onClick={handleAddRow}>
            <Text>Add Row</Text>
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedPlayerListID}>
            <Text className="text-white">{saving ? 'Saving...' : 'Save All Changes'}</Text>
          </Button>
        </HStack>
      </VStack>

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={confirmRemoveRow}
        title="Remove Player Row?"
        message={`Remove ${pendingRemoval?.label || 'this player row'} from the pending bulk changes? This does not save until you confirm the full bulk update.`}
        confirmLabel="Remove Row"
      />
    </Box>
  )
}
