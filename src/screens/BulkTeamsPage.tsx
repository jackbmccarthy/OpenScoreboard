// @ts-nocheck

import { useEffect, useState } from 'react'
import { Box, Button, HStack, Input, Spinner, Text, VStack } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { addNewTeam, deleteMyTeam, getMyTeams, getTeam, updateMyTeam, updateTeam } from '@/functions/teams'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'

function createEmptyRow() {
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

export default function BulkTeamsPage() {
  const { loading: authLoading } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)

  async function loadTeams() {
    setLoading(true)
    try {
      const myTeams = await getMyTeams()
      const detailedRows = await Promise.all(
        myTeams.map(async ([myTeamID, preview]) => {
          const team = await getTeam(preview.id)
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
    } catch (err: any) {
      setError(err.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    loadTeams()
  }, [authLoading])

  const updateRow = (id, field, value) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row))
  }

  const confirmRemoveRow = () => {
    if (!pendingRemoval) return
    setRows((current) => current.filter((row) => row.id !== pendingRemoval.id))
    setPendingRemoval(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const currentTeams = await getMyTeams()
      const currentMap = new Map(currentTeams.map(([myTeamID, preview]) => [preview.id, { myTeamID, preview }]))
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
      await loadTeams()
    } catch (err: any) {
      setError(err.message || 'Failed to save teams')
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

        <VStack className="gap-3">
          {rows.map((row) => (
            <Box key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <VStack className="gap-3">
                <Input placeholder="Team name" value={row.teamName} onChangeText={(value) => updateRow(row.id, 'teamName', value)} />
                <Input placeholder="Team logo URL" value={row.teamLogoURL} onChangeText={(value) => updateRow(row.id, 'teamLogoURL', value)} />
                <Button variant="outline" onClick={() => setPendingRemoval({ id: row.id, label: row.teamName || 'this team row' })}>
                  <Text>Remove Row</Text>
                </Button>
              </VStack>
            </Box>
          ))}
        </VStack>

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
