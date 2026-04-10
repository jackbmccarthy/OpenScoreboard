import { useEffect, useState } from 'react'
import { Box, Button, HStack, Input, Spinner, Text, VStack } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { addNewTeam, deleteMyTeam, getMyTeams, subscribeToMyTeams, getTeam, updateMyTeam, updateTeam } from '@/functions/teams'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { UserIcon } from '@/components/icons'

type TeamPlayers = Record<string, unknown>

type BulkTeamRow = {
  id: string
  myTeamID: string
  teamID: string
  teamName: string
  teamLogoURL: string
  players: TeamPlayers
  isNew: boolean
}

type TeamPreview = {
  id: string
  name: string
}

type TeamEntry = [string, TeamPreview]

type TeamRecord = {
  teamName?: string
  teamLogoURL?: string
  players?: TeamPlayers
}

function createEmptyRow(): BulkTeamRow {
  return {
    id: `new-${Math.random().toString(36).slice(2)}`,
    myTeamID: '',
    teamID: '',
    teamName: '',
    teamLogoURL: '',
    players: {},
    isNew: true,
  }
}

function parseSpreadsheetRows(value: string): BulkTeamRow[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const columns = line.includes('\t') ? line.split('\t') : line.split(',')
      return {
        id: `new-${Math.random().toString(36).slice(2)}`,
        myTeamID: '',
        teamID: '',
        teamName: (columns[0] || '').trim(),
        teamLogoURL: (columns[1] || '').trim(),
        players: {},
        isNew: true,
      }
    })
}

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

export default function BulkTeamsPage() {
  const { loading: authLoading } = useAuth()
  const [rows, setRows] = useState<BulkTeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; label: string } | null>(null)
  const [viewMode, setViewMode] = useState<'form' | 'spreadsheet'>('form')
  const [spreadsheetValue, setSpreadsheetValue] = useState('')

  async function loadTeams(myTeamsOverride?: TeamEntry[]) {
    setLoading(true)
    try {
      const myTeams = myTeamsOverride || await getMyTeams()
      const detailedRows = await Promise.all(
        (myTeams as TeamEntry[]).map(async ([myTeamID, preview]) => {
          const team = await getTeam(preview.id) as TeamRecord | null
          return {
            id: preview.id,
            myTeamID,
            teamID: preview.id,
            teamName: team?.teamName || preview.name || '',
            teamLogoURL: team?.teamLogoURL || '',
            players: team?.players || {},
            isNew: false,
          }
        })
      )
      setRows(detailedRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    return subscribeToMyTeams((myTeams) => {
      loadTeams(myTeams as TeamEntry[])
    })
  }, [authLoading])

  useEffect(() => {
    setSpreadsheetValue(
      rows
        .map((row) => [row.teamName || '', row.teamLogoURL || ''].join('\t'))
        .join('\n')
    )
  }, [rows])

  const updateRow = (id: string, field: keyof BulkTeamRow, value: string) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  const confirmRemoveRow = () => {
    if (!pendingRemoval) return
    setRows((current) => current.filter((row) => row.id !== pendingRemoval.id))
    setPendingRemoval(null)
  }

  const handleApplySpreadsheet = () => {
    const parsedRows = parseSpreadsheetRows(spreadsheetValue)
    setRows(parsedRows)
    setSuccess(`Loaded ${parsedRows.length} row${parsedRows.length === 1 ? '' : 's'} from spreadsheet data.`)
    setError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const currentTeams = await getMyTeams()
      const currentMap = new Map((currentTeams as TeamEntry[]).map(([myTeamID, preview]) => [preview.id, { myTeamID, preview }]))
      const nextTeamIDs = new Set(rows.filter((row) => !row.isNew).map((row) => row.teamID))

      for (const row of rows) {
        if (!row.teamName.trim()) {
          continue
        }

        const payload = {
          teamName: row.teamName.trim(),
          teamLogoURL: row.teamLogoURL.trim(),
          players: row.players || {},
        }

        if (row.isNew) {
          await addNewTeam(payload)
        } else {
          await updateTeam(row.teamID, payload)
          await updateMyTeam(row.myTeamID, payload.teamName)
        }
      }

      for (const [teamID, { myTeamID }] of currentMap.entries()) {
        if (!nextTeamIDs.has(teamID)) {
          await deleteMyTeam(myTeamID)
        }
      }

      setSuccess('Bulk team changes saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save teams')
    } finally {
      setSaving(false)
    }
  }

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
        <Text className="text-2xl font-bold">Bulk Manage Teams</Text>
        <Text className="text-sm text-gray-600">
          Add, rename, and remove teams in one pass. Removing a row hides that team from your visible team list.
        </Text>

        <HStack className="gap-2">
          <Button variant={viewMode === 'form' ? 'solid' : 'outline'} onClick={() => setViewMode('form')}>
            <Text className={viewMode === 'form' ? 'text-white' : ''}>Field View</Text>
          </Button>
          <Button variant={viewMode === 'spreadsheet' ? 'solid' : 'outline'} onClick={() => setViewMode('spreadsheet')}>
            <Text className={viewMode === 'spreadsheet' ? 'text-white' : ''}>Spreadsheet View</Text>
          </Button>
        </HStack>

        {viewMode === 'form' ? (
          <VStack className="gap-3">
            {rows.map((row) => (
              <Box key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <VStack className="gap-3">
                  <HStack className="items-start gap-4">
                    <ImagePreview
                      src={row.teamLogoURL}
                      alt={row.teamName || 'Team logo preview'}
                    />
                    <VStack className="flex-1 gap-3">
                      <Box>
                        <FieldLabel>Team Name</FieldLabel>
                        <Input value={row.teamName} onChangeText={(value) => updateRow(row.id, 'teamName', value)} />
                      </Box>
                      <Box>
                        <FieldLabel>Team Logo URL</FieldLabel>
                        <Input value={row.teamLogoURL} onChangeText={(value) => updateRow(row.id, 'teamLogoURL', value)} />
                      </Box>
                    </VStack>
                  </HStack>
                  <Button variant="outline" onClick={() => setPendingRemoval({ id: row.id, label: row.teamName || 'this team row' })}>
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
                `Team Name`, `Team Logo URL`
              </Text>
              <textarea
                className="min-h-[320px] w-full rounded-xl border border-slate-200 px-3 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={spreadsheetValue}
                onChange={(event) => setSpreadsheetValue(event.target.value)}
                placeholder={`Team Name\tTeam Logo URL\nFalcons\thttps://example.com/falcons.png`}
              />
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
        {success ? <Text className="text-sm text-green-600">{success}</Text> : null}

        <HStack className="gap-3">
          <Button variant="outline" onClick={() => setRows((current) => [...current, createEmptyRow()])}>
            <Text>Add Row</Text>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Text className="text-white">{saving ? 'Saving...' : 'Save All Changes'}</Text>
          </Button>
        </HStack>
      </VStack>

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={confirmRemoveRow}
        title="Remove Team Row?"
        message={`Remove ${pendingRemoval?.label || 'this team row'} from the pending bulk changes? This does not save until you confirm the full bulk update.`}
        confirmLabel="Remove Row"
      />
    </Box>
  )
}
