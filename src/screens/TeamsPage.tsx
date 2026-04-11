import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, TeamsIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { addNewTeam, deleteMyTeam, getTeam, subscribeToMyTeams, updateMyTeam, updateTeam } from '@/functions/teams'
import SyncIndicator from '@/components/realtime/SyncIndicator'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'
import LabeledField from '@/components/forms/LabeledField'

interface TeamRow {
  id: string
  name: string
  createdOn?: string
}

type TeamDraft = {
  teamName: string
  teamLogoURL: string
}

type TeamRecord = {
  teamName: string
  teamLogoURL?: string
  players?: Record<string, unknown>
}

type TeamEntry = [string, TeamRow]

const emptyTeamDraft = {
  teamName: '',
  teamLogoURL: '',
} satisfies TeamDraft

export default function TeamsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<{ myTeamID: string; teamID?: string } | null>(null)
  const [teamDraft, setTeamDraft] = useState<TeamDraft>(emptyTeamDraft)
  const [pendingDeleteTeam, setPendingDeleteTeam] = useState<{ myTeamID: string; name: string } | null>(null)

  useEffect(() => {
    if (authLoading) return
    const unsubscribeState = subscribeToPathState(`users/${user?.uid || 'mylocalserver'}/myTeams`, (state) => {
      setSyncStatus(state.status)
    })
    const unsubscribeTeams = subscribeToMyTeams((myTeams) => {
      setTeams(myTeams as TeamEntry[])
      setLoading(false)
    }, user?.uid || 'mylocalserver')
    return () => {
      unsubscribeState()
      unsubscribeTeams()
    }
  }, [authLoading, user])

  const openNewTeamModal = () => {
    setEditingTeam(null)
    setTeamDraft(emptyTeamDraft)
    setShowTeamModal(true)
  }

  const handleSaveTeam = async () => {
    if (!teamDraft.teamName.trim()) return

    const payload = {
      teamName: teamDraft.teamName.trim(),
      teamLogoURL: teamDraft.teamLogoURL.trim(),
      players: editingTeam?.teamID ? ((await getTeam(editingTeam.teamID)) as TeamRecord | null)?.players || {} : {},
    }

    if (editingTeam?.teamID) {
      await updateTeam(editingTeam.teamID, payload)
      await updateMyTeam(editingTeam.myTeamID, payload.teamName)
    } else {
      await addNewTeam(payload)
    }

    setShowTeamModal(false)
    setEditingTeam(null)
    setTeamDraft(emptyTeamDraft)
  }

  const handleDeleteTeam = async () => {
    if (!pendingDeleteTeam) return
    await deleteMyTeam(pendingDeleteTeam.myTeamID)
    setPendingDeleteTeam(null)
  }

  if (authLoading || loading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </Box>
    )
  }

  if (!user && !authLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Text className="text-gray-600">Please sign in to manage teams</Text>
          <Button onClick={() => navigate('/login')}>
            <Text className="text-white">Sign In</Text>
          </Button>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md" className="p-4">
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <HStack className="items-center gap-2">
              <Heading size="lg">Teams</Heading>
              <SyncIndicator status={syncStatus} />
            </HStack>
            <Text className="text-gray-500 text-sm">Manage your teams for matches</Text>
          </VStack>
          <HStack className="flex-col gap-2 sm:flex-row sm:items-center">
            <Button size="sm" variant="outline" onClick={() => navigate('/bulkteams')} className="w-full sm:w-auto">
              <Text>Bulk Manage</Text>
            </Button>
            <Button size="sm" variant="solid" action="primary" onClick={openNewTeamModal} className="w-full sm:w-auto">
              <PlusIcon size={16} />
              <Text className="ml-1 text-white">Add Team</Text>
            </Button>
          </HStack>
        </HStack>

        <VStack space="sm">
          {teams.length === 0 ? (
            <Box className="p-8 text-center">
              <TeamsIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No teams yet</Text>
              <Text className="text-gray-400 text-sm">Create your first team to get started</Text>
            </Box>
          ) : (
            teams.map(([myTeamId, team]) => (
              <Card key={myTeamId} variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <Pressable className="flex-1" onPress={() => navigate(`/teams/${team.id}`)}>
                      <VStack className="flex-1">
                        <Text fontWeight="bold">{team.name}</Text>
                        {team.createdOn ? (
                          <Text className="text-gray-500 text-sm">Created {new Date(team.createdOn).toLocaleDateString()}</Text>
                        ) : null}
                      </VStack>
                    </Pressable>
                    <HStack className="flex-wrap items-center gap-2">
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => navigate(`/teams/${team.id}`)}>
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteTeam({ myTeamID: myTeamId, name: team.name })}>
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
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title={editingTeam ? 'Edit Team' : 'Add Team'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowTeamModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveTeam}>
              <Text className="text-white">{editingTeam ? 'Save Changes' : 'Create Team'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <LabeledField label="Team Name">
            <Input placeholder="Team name" value={teamDraft.teamName} onChangeText={(value) => setTeamDraft((current) => ({ ...current, teamName: value }))} />
          </LabeledField>
          <LabeledField label="Team Logo URL">
            <Input placeholder="Team logo URL" value={teamDraft.teamLogoURL} onChangeText={(value) => setTeamDraft((current) => ({ ...current, teamLogoURL: value }))} />
          </LabeledField>
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteTeam}
        onClose={() => setPendingDeleteTeam(null)}
        onConfirm={handleDeleteTeam}
        title="Remove Team"
        message={`Remove ${pendingDeleteTeam?.name || 'this team'} from your visible team list?`}
        description="This will archive the team. If this team is still referenced by active team matches, those references will be preserved in the archive. The team can be recovered during the retention window."
        confirmLabel="Remove"
      />
    </Box>
  )
}
