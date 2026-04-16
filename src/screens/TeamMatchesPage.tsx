import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Select, Spinner, Text, VStack } from '@/components/ui'
import { PencilIcon, PlusIcon, TeamsIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import OverlayDialog from '@/components/crud/OverlayDialog'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OwnershipDeleteImpact from '@/components/crud/OwnershipDeleteImpact'
import { useOwnershipDeleteReport } from '@/components/crud/useOwnershipDeleteReport'
import LiveCollectionState from '@/components/realtime/LiveCollectionState'
import LiveStatusAlert from '@/components/realtime/LiveStatusAlert'
import LiveStatusBadge from '@/components/realtime/LiveStatusBadge'
import OperationToast from '@/components/realtime/OperationToast'
import { addNewTeamMatch, deleteTeamMatch, getTeamMatch, subscribeToMyTeamMatches, updateTeamMatch } from '@/functions/teammatches'
import { subscribeToMyTeams } from '@/functions/teams'
import { supportedSports } from '@/functions/sports'
import { newTeamMatch } from '@/classes/TeamMatch'
import { combineLiveSyncStates } from '@/lib/liveSync'
import { useRealtimeCollection } from '@/lib/useRealtimeCollection'
import { useOperationFeedback } from '@/lib/useOperationFeedback'
import LabeledField from '@/components/forms/LabeledField'

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
  teamAScore?: number
  teamBScore?: number
  tableCount?: number
  activeTableCount?: number
  currentTableSummaries?: Array<{
    tableNumber: string
    matchID: string
    label: string
    status: string
    contextLabel?: string
  }>
  status?: string
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

  const [showMatchModal, setShowMatchModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState<{ myTeamMatchID: string; teamMatchID: string } | null>(null)
  const [matchDraft, setMatchDraft] = useState<TeamMatchDraft>(emptyMatchDraft)
  const [pendingDeleteMatch, setPendingDeleteMatch] = useState<{ myTeamMatchID: string; name: string } | null>(null)
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<TeamMatchRow | null>(null)
  const feedback = useOperationFeedback()

  const teamMatchesSubscription = useRealtimeCollection<TeamMatchEntry[]>({
    enabled: !authLoading,
    initialValue: [],
    statePath: `users/${user?.uid || 'mylocalserver'}/myTeamMatches`,
    subscribe: (callback) => subscribeToMyTeamMatches((matches) => {
      callback(matches as TeamMatchEntry[])
    }, user?.uid || 'mylocalserver'),
  })
  const teamsSubscription = useRealtimeCollection<TeamEntry[]>({
    enabled: !authLoading,
    initialValue: [],
    statePath: `users/${user?.uid || 'mylocalserver'}/myTeams`,
    subscribe: (callback) => subscribeToMyTeams((myTeams) => {
      callback(myTeams as TeamEntry[])
    }, user?.uid || 'mylocalserver'),
  })
  const teamMatches = teamMatchesSubscription.value
  const teams = teamsSubscription.value
  const pageSyncState = combineLiveSyncStates([
    teamMatchesSubscription.liveState,
    teamsSubscription.liveState,
  ], 'loading')
  const syncStatus = pageSyncState.status
  const syncError = pageSyncState.error
  const loading = teamMatchesSubscription.loading

  const scoringTypeOptions = useMemo(() => {
    const sport = supportedSports[matchDraft.sportName]
    return sport?.scoringTypes
      ? Object.entries(sport.scoringTypes as Record<string, { displayName: string }>)
      : []
  }, [matchDraft.sportName])

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
      matchDraft.scoringType || '',
      user?.uid || 'mylocalserver',
    )

    if (editingMatch) {
      await updateTeamMatch(editingMatch.teamMatchID, editingMatch.myTeamMatchID, payload)
      feedback.showSuccess('Team match updated.')
    } else {
      await addNewTeamMatch(payload)
      feedback.showSuccess('Team match created.')
    }

    setShowMatchModal(false)
    setEditingMatch(null)
    setMatchDraft(emptyMatchDraft)
  }

  const handleDeleteMatch = async () => {
    if (!pendingDeleteMatch || deleteTeamMatchReport.loading || deleteTeamMatchReport.error) return
    await deleteTeamMatch(pendingDeleteMatch.myTeamMatchID)
    feedback.showSuccess('Team match archived.')
    setPendingDeleteMatch(null)
  }
  const deleteTeamMatchReport = useOwnershipDeleteReport(
    pendingDeleteMatch?.myTeamMatchID || '',
    pendingDeleteMatch ? () => deleteTeamMatch(pendingDeleteMatch.myTeamMatchID, { dryRun: true }) : null,
  )

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
        <HStack className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <VStack className="gap-1">
            <Heading size="lg">Team Matches</Heading>
            <LiveStatusBadge status={syncStatus} />
          </VStack>
          <Button onClick={openNewMatchModal} className="w-full sm:w-auto">
            <PlusIcon size={16} />
            <Text className="ml-1 text-white">New Match</Text>
          </Button>
        </HStack>

        <LiveStatusAlert status={syncStatus} error={syncError} />

        {teamMatches.length > 0 ? (
          <VStack className="gap-3">
            {teamMatches.map(([myTeamMatchID, match]) => (
              <Card key={myTeamMatchID} variant="elevated">
                <CardBody>
                  <VStack className="gap-3">
                    <HStack className="flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-start">
                      <VStack className="flex-1 gap-1">
                        <Text className="font-bold text-slate-900">{match.teamAName || 'Team A'} vs {match.teamBName || 'Team B'}</Text>
                        <Text className="text-sm text-gray-500">
                          {match.startTime ? new Date(match.startTime).toLocaleString() : 'No start time'}
                        </Text>
                        <Text className="text-xs text-blue-600">
                          {supportedSports[match.sportName]?.displayName || match.sportName || 'Table Tennis'}
                          {match.scoringType ? ` • ${match.scoringType}` : ''}
                        </Text>
                        <Text className="text-xs font-medium text-slate-700">
                          Team score: {match.teamAScore || 0} - {match.teamBScore || 0}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {match.activeTableCount || 0} active table{match.activeTableCount === 1 ? '' : 's'} of {match.tableCount || 0}
                        </Text>
                        {match.currentTableSummaries && match.currentTableSummaries.length > 0 ? (
                          <VStack className="gap-1 pt-1">
                            {match.currentTableSummaries.map((tableSummary) => (
                              <VStack key={tableSummary.matchID} className="gap-0.5">
                                <Text className="text-xs text-slate-500">
                                  Table {tableSummary.tableNumber}: {tableSummary.label}
                                </Text>
                                {tableSummary.contextLabel ? (
                                  <Text className="text-[11px] text-slate-400">{tableSummary.contextLabel}</Text>
                                ) : null}
                              </VStack>
                            ))}
                          </VStack>
                        ) : null}
                      </VStack>
                      <HStack className="flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedMatchDetail(match)} className="w-full sm:w-auto">
                          <Text>Details</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/teamscoring/teammatch/${match.id}`)} className="w-full sm:w-auto">
                          <Text>Score</Text>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/qrcode?capabilityType=team_match_scoring&teamMatchID=${match.id}&table=1&matchID=${match.currentTableSummaries?.[0]?.matchID || ''}&label=${encodeURIComponent(`${match.teamAName || 'Team A'} vs ${match.teamBName || 'Team B'}`)}`)} className="w-full sm:w-auto">
                          <Text>Secure Link</Text>
                        </Button>
                        <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2" onPress={() => openEditMatchModal(myTeamMatchID, match)}>
                          <PencilIcon size={16} className="text-slate-500" />
                        </Pressable>
                        <Pressable className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2" onPress={() => setPendingDeleteMatch({ myTeamMatchID, name: `${match.teamAName || 'Team A'} vs ${match.teamBName || 'Team B'}` })}>
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
          <VStack className="gap-4">
            <LiveCollectionState
              icon={<TeamsIcon size={48} className="text-slate-300" />}
              title="No team matches yet"
              description="Create a team match to start tracking multi-table scoring live."
            />
            <Button onClick={openNewMatchModal} className="w-full sm:w-auto self-center">
              <Text className="text-white">Create First Match</Text>
            </Button>
          </VStack>
        )}
      </VStack>
      <OperationToast tone={feedback.tone} message={feedback.message} />

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
          <LabeledField label="Team A">
            <Select value={matchDraft.teamAID} onValueChange={(value) => setMatchDraft((current) => ({ ...current, teamAID: value }))}>
              <option value="">Select Team A</option>
              {teams.map(([myTeamID, team]) => (
                <option key={myTeamID} value={team.id}>{team.name}</option>
              ))}
            </Select>
          </LabeledField>
          <LabeledField label="Team B">
            <Select value={matchDraft.teamBID} onValueChange={(value) => setMatchDraft((current) => ({ ...current, teamBID: value }))}>
              <option value="">Select Team B</option>
              {teams.map(([myTeamID, team]) => (
                <option key={myTeamID} value={team.id}>{team.name}</option>
              ))}
            </Select>
          </LabeledField>
          <LabeledField label="Start Time">
            <Input type="datetime-local" value={matchDraft.startTime} onChangeText={(value) => setMatchDraft((current) => ({ ...current, startTime: value }))} />
          </LabeledField>
          <LabeledField label="Sport">
            <Select value={matchDraft.sportName} onValueChange={(value) => setMatchDraft((current) => ({ ...current, sportName: value, scoringType: '' }))}>
              {Object.entries(supportedSports).map(([key, sport]) => (
                <option key={key} value={key}>{sport.displayName}</option>
              ))}
            </Select>
          </LabeledField>
          {scoringTypeOptions.length > 0 ? (
            <LabeledField label="Scoring Type">
              <Select value={matchDraft.scoringType} onValueChange={(value) => setMatchDraft((current) => ({ ...current, scoringType: value }))}>
                <option value="">Default scoring</option>
                {scoringTypeOptions.map(([key, value]) => (
                  <option key={key} value={key}>{value.displayName}</option>
                ))}
              </Select>
            </LabeledField>
          ) : null}
        </VStack>
      </OverlayDialog>

      <ConfirmDialog
        isOpen={!!pendingDeleteMatch}
        onClose={() => setPendingDeleteMatch(null)}
        onConfirm={handleDeleteMatch}
        title="Remove Team Match"
        message={`Remove ${pendingDeleteMatch?.name || 'this team match'} from your visible team match list?`}
        description="This will archive the team match and all its sub-match references. The team match data will be preserved and can be recovered during the retention window."
        confirmLabel="Remove"
        confirmDisabled={deleteTeamMatchReport.loading || Boolean(deleteTeamMatchReport.error)}
      >
        <OwnershipDeleteImpact
          report={deleteTeamMatchReport.report}
          loading={deleteTeamMatchReport.loading}
          error={deleteTeamMatchReport.error}
        />
      </ConfirmDialog>

      <OverlayDialog
        isOpen={Boolean(selectedMatchDetail)}
        onClose={() => setSelectedMatchDetail(null)}
        title="Team Match Details"
        footer={(
          <Button variant="outline" onClick={() => setSelectedMatchDetail(null)}>
            <Text>Close</Text>
          </Button>
        )}
      >
        {selectedMatchDetail ? (
          <VStack className="gap-3">
            <Text className="font-semibold text-slate-900">{selectedMatchDetail.teamAName || 'Team A'} vs {selectedMatchDetail.teamBName || 'Team B'}</Text>
            <Text className="text-sm text-slate-600">Status: {selectedMatchDetail.status || 'not-started'}</Text>
            <Text className="text-sm text-slate-600">Team score: {selectedMatchDetail.teamAScore || 0} - {selectedMatchDetail.teamBScore || 0}</Text>
            <Text className="text-sm text-slate-600">Active tables: {selectedMatchDetail.activeTableCount || 0} / {selectedMatchDetail.tableCount || 0}</Text>
            {selectedMatchDetail.currentTableSummaries && selectedMatchDetail.currentTableSummaries.length > 0 ? (
              <VStack className="gap-2">
                {selectedMatchDetail.currentTableSummaries.map((tableSummary) => (
                  <Box key={tableSummary.matchID} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <Text className="font-medium text-slate-900">Table {tableSummary.tableNumber}</Text>
                    <Text className="text-sm text-slate-600">{tableSummary.label}</Text>
                    {tableSummary.contextLabel ? <Text className="text-xs text-slate-500">{tableSummary.contextLabel}</Text> : null}
                    <Text className="text-xs text-slate-500">Status: {tableSummary.status}</Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text className="text-sm text-slate-500">No active table assignments.</Text>
            )}
          </VStack>
        ) : null}
      </OverlayDialog>
    </Box>
  )
}
