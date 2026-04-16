import { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, HStack, Input, Select, Spinner, Text, VStack } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useSearchParams } from 'react-router-dom'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import LiveStatusAlert from '@/components/realtime/LiveStatusAlert'
import OperationToast from '@/components/realtime/OperationToast'
import { replacePlayersInList, sortPlayers, subscribeToMyPlayerLists, subscribeToPlayerListPlayers } from '@/functions/players'
import { v4 as uuidv4 } from 'uuid'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import countries from '@/flags/countries.json'
import { UserIcon } from '@/components/icons'
import { combineLiveSyncStates } from '@/lib/liveSync'
import { useRealtimeCollection } from '@/lib/useRealtimeCollection'
import { useOperationFeedback } from '@/lib/useOperationFeedback'

type PlayerListPreview = {
  id: string
  playerListName: string
}

type PlayerListEntry = [string, PlayerListPreview]

type ImportedPlayer = {
  firstName?: string
  lastName?: string
  imageURL?: string
  country?: string
  clubName?: string
  jerseyColor?: string
  firstNameInitial?: boolean
  lastNameInitial?: boolean
  isImported?: boolean
}

type PlayerRow = {
  id: string
  firstName: string
  lastName: string
  imageURL: string
  country: string
  raw?: ImportedPlayer
  isNew: boolean
}

type PlayerEntry = [string, ImportedPlayer]

function createEmptyRow(): PlayerRow {
  return {
    id: uuidv4(),
    firstName: '',
    lastName: '',
    imageURL: '',
    country: '',
    isNew: true,
  }
}

function parseSpreadsheetRows(value: string): PlayerRow[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const columns = line.includes('\t') ? line.split('\t') : line.split(',')
      return {
        id: uuidv4(),
        firstName: (columns[0] || '').trim(),
        lastName: (columns[1] || '').trim(),
        imageURL: (columns[2] || '').trim(),
        country: (columns[3] || '').trim().toUpperCase(),
        isNew: true,
      }
    })
}

const countryOptions = Object.entries(countries)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{children}</Text>
}

function ImagePreview({
  src,
  alt,
}: {
  src?: string
  alt: string
}) {
  const [hasError, setHasError] = useState(false)
  const hasImage = Boolean(src?.trim()) && !hasError

  return (
    <Box className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <UserIcon size={22} className="text-slate-300" />
      )}
    </Box>
  )
}

export default function BulkPlayerPage() {
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [selectedPlayerListID, setSelectedPlayerListID] = useState(searchParams.get('playerListID') || '')
  const [rows, setRows] = useState<PlayerRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; label: string } | null>(null)
  const [viewMode, setViewMode] = useState<'form' | 'spreadsheet'>('form')
  const [spreadsheetValue, setSpreadsheetValue] = useState('')
  const feedback = useOperationFeedback()

  function loadPlayers(players: PlayerEntry[]) {
    const sortedPlayers = players.length > 0 ? sortPlayers(players as PlayerEntry[]) : []
    setRows((sortedPlayers as PlayerEntry[]).map(([id, player]) => ({
      id,
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      imageURL: player.imageURL || '',
      country: player.country || '',
      raw: player,
      isNew: false,
    })))
  }

  const playerListsSubscription = useRealtimeCollection<PlayerListEntry[]>({
    enabled: !authLoading,
    initialValue: [],
    statePath: `users/${user?.uid || 'mylocalserver'}/myPlayerLists`,
    subscribe: (callback) => subscribeToMyPlayerLists((lists) => {
      callback((lists || []) as PlayerListEntry[])
    }),
  })
  const playersSubscription = useRealtimeCollection<PlayerEntry[]>({
    enabled: Boolean(selectedPlayerListID),
    initialValue: [],
    statePath: `playerLists/${selectedPlayerListID || 'unselected'}/players`,
    subscribe: (callback) => subscribeToPlayerListPlayers(selectedPlayerListID, (players) => {
      callback(players as PlayerEntry[])
    }),
  })
  const myPlayerLists = playerListsSubscription.value
  const pageSyncState = combineLiveSyncStates([
    playerListsSubscription.liveState,
    playersSubscription.liveState,
  ], 'loading')
  const syncStatus = pageSyncState.status
  const syncError = pageSyncState.error

  useEffect(() => {
    if (!selectedPlayerListID && myPlayerLists.length > 0) {
      setSelectedPlayerListID(myPlayerLists[0][1].id)
    }
  }, [myPlayerLists, selectedPlayerListID])

  useEffect(() => {
    if (!selectedPlayerListID) {
      setRows([])
      return
    }
    loadPlayers(playersSubscription.value)
  }, [playersSubscription.value, selectedPlayerListID])

  const visibleRows = useMemo(() => rows, [rows])

  useEffect(() => {
    setSpreadsheetValue(
      rows
        .map((row) => [row.firstName || '', row.lastName || '', row.imageURL || '', row.country || ''].join('\t'))
        .join('\n')
    )
  }, [rows])

  const updateRow = (id: string, field: keyof PlayerRow, value: string) => {
    setRows((current) =>
      current.map((row) => row.id === id ? { ...row, [field]: value } : row)
    )
  }

  const handleAddRow = () => {
    setRows((current) => [...current, createEmptyRow()])
  }

  const handleApplySpreadsheet = () => {
    const parsedRows = parseSpreadsheetRows(spreadsheetValue)
    setRows(parsedRows)
    setError(null)
    feedback.showSuccess(`Loaded ${parsedRows.length} player row${parsedRows.length === 1 ? '' : 's'}.`)
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

    try {
      const payload: Record<string, ImportedPlayer> = {}
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
      feedback.showSuccess('Bulk player changes saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save player changes')
      feedback.showError(err instanceof Error ? err.message : 'Failed to save player changes')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || playerListsSubscription.loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <VStack className="gap-1">
          <Text className="text-2xl font-bold">Bulk Manage Players</Text>
          <Text className="text-sm text-gray-600">
            Add rows, edit fields inline, or remove rows before saving the entire player list in one pass.
          </Text>
          <LiveStatusBadge status={syncStatus} />
        </VStack>
        <LiveStatusAlert status={syncStatus} error={syncError} />

        <HStack className="gap-2">
          <Button variant={viewMode === 'form' ? 'solid' : 'outline'} onClick={() => setViewMode('form')}>
            <Text className={viewMode === 'form' ? 'text-white' : ''}>Field View</Text>
          </Button>
          <Button variant={viewMode === 'spreadsheet' ? 'solid' : 'outline'} onClick={() => setViewMode('spreadsheet')}>
            <Text className={viewMode === 'spreadsheet' ? 'text-white' : ''}>Spreadsheet View</Text>
          </Button>
        </HStack>

        <Box>
          <FieldLabel>Player List</FieldLabel>
          <Select value={selectedPlayerListID} onValueChange={setSelectedPlayerListID}>
            <option value="">Select a player list</option>
            {myPlayerLists.map(([id, list]) => (
              <option key={id} value={list.id}>{list.playerListName}</option>
            ))}
          </Select>
        </Box>

        {viewMode === 'form' ? (
          <VStack className="gap-3">
            {visibleRows.map((row) => (
              <Box key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <VStack className="gap-3">
                  <HStack className="items-start gap-4">
                    <ImagePreview
                      src={row.imageURL}
                      alt={`${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Player image preview'}
                    />
                    <VStack className="flex-1 gap-3">
                      <HStack className="gap-3">
                        <Box className="flex-1">
                          <FieldLabel>First Name</FieldLabel>
                          <Input value={row.firstName} onChangeText={(value) => updateRow(row.id, 'firstName', value)} />
                        </Box>
                        <Box className="flex-1">
                          <FieldLabel>Last Name</FieldLabel>
                          <Input value={row.lastName} onChangeText={(value) => updateRow(row.id, 'lastName', value)} />
                        </Box>
                      </HStack>
                      <HStack className="gap-3">
                        <Box className="flex-[1.4]">
                          <FieldLabel>Image URL</FieldLabel>
                          <Input value={row.imageURL} onChangeText={(value) => updateRow(row.id, 'imageURL', value)} />
                        </Box>
                        <Box className="flex-1">
                          <FieldLabel>Country</FieldLabel>
                          <Select value={row.country} onValueChange={(value) => updateRow(row.id, 'country', value.toUpperCase())}>
                            <option value="">Select country</option>
                            {countryOptions.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.name}
                              </option>
                            ))}
                          </Select>
                        </Box>
                      </HStack>
                    </VStack>
                  </HStack>
                  <Button variant="outline" onClick={() => setPendingRemoval({ id: row.id, label: `${row.firstName} ${row.lastName}`.trim() || 'this player row' })}>
                    <Text>Remove Row</Text>
                  </Button>
                </VStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="rounded-2xl border border-slate-200 bg-white p-4">
            <VStack className="gap-3">
              <Text className="text-sm text-slate-600">
                Paste rows from Excel, Google Sheets, or Numbers using this column order:
                <br />
                `First Name`, `Last Name`, `Image URL`, `Country Code`
              </Text>
              <Box>
                <FieldLabel>Spreadsheet Rows</FieldLabel>
                <textarea
                  className="min-h-[320px] w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={spreadsheetValue}
                  onChange={(event) => setSpreadsheetValue(event.target.value)}
                  placeholder={`First Name\tLast Name\tImage URL\tCountry Code\nJane\tDoe\thttps://example.com/avatar.jpg\tUS`}
                />
              </Box>
              <HStack className="gap-3">
                <Button variant="outline" onClick={handleApplySpreadsheet}>
                  <Text>Apply Spreadsheet Changes</Text>
                </Button>
                <Text className="self-center text-xs text-slate-500">
                  Tab-separated values work best, but comma-separated rows are also accepted.
                </Text>
              </HStack>
            </VStack>
          </Box>
        )}

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

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
      <OperationToast tone={feedback.tone} message={feedback.message} />
    </Box>
  )
}
