import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, TeamsIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import getMyTeamMatches, { addNewTeamMatch, deleteTeamMatch, getTeamMatch, updateTeamMatch } from '@/functions/teammatches'
import { getMyTeams } from '@/functions/teams'
import { supportedSports } from '@/functions/sports'
import { newTeamMatch } from '@/classes/TeamMatch'

type TeamMatchDraft = {
  teamAID: string
  teamBID: string
  startTime: string
  sportName: string
  scoringType: string
}

type TeamRow = {
  id: string
  name: string
}

type TeamEntry = [string, TeamRow]

type TeamMatchRow = {
  id: string
  teamAName?: string
  teamBName?: string
  startTime?: string
  sportName: string
  scoringType?: string
}

type TeamMatchEntry = [string, TeamMatchRow]

const emptyMatchDraft = {
  teamAID: '',
  teamBID: '',
  startTime: '',
  sportName: 'tableTennis',
  scoringType: '',
} satisfies TeamMatchDraft

export default function TeamMatchesPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [teamMatches, setTeamMatches] = useState<TeamMatchEntry[]>([])
  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState<{ myTeamMatchID: string; teamMatchID: string } | null>(null)
  const [matchDraft, setMatchDraft] = useState<TeamMatchDraft>(emptyMatchDraft)
  const [pendingDeleteMatch, setPendingDeleteMatch] = useState<{ myTeamMatchID: string; name: string } | null>(null)

  useEffect(() => {
    if (authLoading) return

    async function loadData() {
      try {
        const [matches, myTeams] = await Promise.all([
          getMyTeamMatches(),
          getMyTeams(user?.uid || 'mylocalserver'),
        ])
        setTeamMatches((matches || []) as TeamMatchEntry[])
        setTeams((myTeams || []) as TeamEntry[])
      } catch (error) {
        console.error('Error loading team matches:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, user])

  const scoringTypeOptions = useMemo(() => {
    const sport = supportedSports[matchDraft.sportName]
    return sport?.scoringTypes
      ? Object.entries(sport.scoringTypes as Record<string, { displayName: string }>)
      : []
  }, [matchDraft.sportName])

  const reloadMatches = async () => {
    const matches = await getMyTeamMatches()
    setTeamMatches((matches || []) as TeamMatchEntry[])
  }

  const openNewMatchModal = () => {
    setEditingMatch(null)
    setMatchDraft(emptyMatchDraft)
    setShowMatchModal(true)
  }

  const openEditMatchModal = async (myTeamMatchID: string, match: TeamMatchRow) => {
    const teamMatch = await getTeamMatch(match.id)
    setEditingMatch({ myTeamMatchID, teamMatchID: match.id })
    setMatchDraft({
      teamAID: teamMatch?.teamAID || '',
      teamBID: teamMatch?.teamBID || '',
      startTime: teamMatch?.startTime ? String(teamMatch.startTime).slice(0, 16) : '',
      sportName: teamMatch?.sportName || 'tableTennis',
      scoringType: teamMatch?.scoringType || '',
    })
    setShowMatchModal(true)
  }

  const handleSaveMatch = async () => {
    if (!matchDraft.teamAID || !matchDraft.teamBID || !matchDraft.startTime) return

    const payload = newTeamMatch(
      matchDraft.teamAID,
      matchDraft.teamBID,
      new Date(matchDraft.startTime).toISOString(),
      matchDraft.sportName,
      matchDraft.scoringType || ''
    )

    if (editingMatch) {
      await updateTeamMatch(editingMatch.teamMatchID, editingMatch.myTeamMatchID, payload)
    } else {
      await addNewTeamMatch(payload)
    }

    setShowMatchModal(false)
    setEditingMatch(null)
    setMatchDraft(emptyMatchDraft)
    await reloadMatches()
  }

  const handleDeleteMatch = async () => {
    if (!pendingDeleteMatch) return
    await deleteTeamMatch(pendingDeleteMatch.myTeamMatchID)
    setPendingDeleteMatch(null)
    await reloadMatches()
  }

  if (loading || authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="p-4">
      <VStack space="md">
        <HStack className="justify-between items-center">
          <Heading size="lg">Team Matches</Heading>
          <Button onClick={openNewMatchModal}>
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New Match</Text>
          </Button>
        </HStack>

        {teamMatches.length > 0 ? (
          <VStack className="gap-3">
            {teamMatches.map(([myTeamMatchID, match]) => (
              <Card key={myTeamMatchID} variant="elevated">
                <CardBody>
                  <VStack className="gap-3">
                    <HStack className="justify-between items-start gap-3">
                      <VStack className="flex-1 gap-1">
                        <Text className="font-bold text-slate-900">{match.teamAName || 'Team A'} vs {match.teamBName || 'Team B'}</Text>
                        <Text className="text-sm text-gray-500">
                          {match.startTime ? new Date(match.startTime).toLocaleString() : 'No start time'}
                        </Text>
                        <Text className="text-xs text-blue-600">
                          {supportedSports[match.sportName]?.displayName || match.sportName || 'Table Tennis'}
                          {match.scoringType ? ` • ${match.scoringType}` : ''}
                        </Text>
                      </VStack>
                      <HStack className="items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/teamscoring/teammatch/${match.id}`)}>
                          <Text>Score</Text>
                        </Button>
                        <Pressable className="rounded-lg border border-slate-200 p-2" onPress={() => openEditMatchModal(myTeamMatchID, match)}>
                          <PencilIcon size={16} className="text-slate-500" />
                        </Pressable>
                        <Pressable className="rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteMatch({ myTeamMatchID, name: `${match.teamAName || 'Team A'} vs ${match.teamBName || 'Team B'}` })}>
                          <TrashIcon size={16} className="text-red-500" />
                        </Pressable>
                      </HStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        ) : (
          <Box className="flex items-center justify-center py-12">
            <VStack space="md" className="items-center">
              <TeamsIcon size={48} className="text-slate-300" />
              <Text className="text-xl text-gray-500">No team matches</Text>
              <Button onClick={openNewMatchModal}>
                <Text className="text-white">Create First Match</Text>
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>

      <OverlayDialog
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        title={editingMatch ? 'Edit Team Match' : 'Create Team Match'}
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowMatchModal(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button action="primary" onClick={handleSaveMatch}>
              <Text className="text-white">{editingMatch ? 'Save Changes' : 'Create Match'}</Text>
            </Button>
          </>
        )}
      >
        <VStack className="gap-3">
          <Select value={matchDraft.teamAID} onValueChange={(value) => setMatchDraft((current) => ({ ...current, teamAID: value }))}>
            <option value="">Select Team A</option>
            {teams.map(([myTeamID, team]) => (
              <option key={myTeamID} value={team.id}>{team.name}</option>
            ))}
          </Select>
          <Select value={matchDraft.teamBID} onValueChange={(value) => setMatchDraft((current) => ({ ...current, teamBID: value }))}>
            <option value="">Select Team B</option>
            {teams.map(([myTeamID, team]) => (
              <option key={myTeamID} value={team.id}>{team.name}</option>
            ))}
          </Select>
          <Input type="datetime-local" value={matchDraft.startTime} onChangeText={(value) => setMatchDraft((current) => ({ ...current, startTime: value }))} />
          <Select value={matchDraft.sportName} onValueChange={(value) => setMatchDraft((current) => ({ ...current, sportName: value, scoringType: '' }))}>
            {Object.entries(supportedSports).map(([key, sport]) => (
              <option key={key} value={key}>{sport.displayName}</option>
            ))}
          </Select>
          {scoringTypeOptions.length > 0 ? (
            <Select value={matchDraft.scoringType} onValueChange={(value) => setMatchDraft((current) => ({ ...current, scoringType: value }))}>
              <option value="">Default scoring</option>
              {scoringTypeOptions.map(([key, value]) => (
                <option key={key} value={key}>{value.displayName}</option>
              ))}
            </Select>
          ) : null}
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteMatch}
        onClose={() => setPendingDeleteMatch(null)}
        onConfirm={handleDeleteMatch}
        title="Remove Team Match"
        message={`Remove ${pendingDeleteMatch?.name || 'this team match'} from your visible team match list?`}
        confirmLabel="Remove"
      />
    </Box>
  )
}
