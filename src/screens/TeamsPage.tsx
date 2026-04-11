import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Box, Button, Card, CardBody, Heading, HStack, Input, Pressable, Text, VStack } from '@/components/ui'
import { ChevronRightIcon, PencilIcon, PlusIcon, TeamsIcon, TrashIcon } from '@/components/icons'
import { useAuth } from '@/lib/auth'
import ConfirmDialog from '@/components/crud/ConfirmDialog'
import OverlayDialog from '@/components/crud/OverlayDialog'
import { addNewTeam, deleteMyTeam, getTeam, subscribeToMyTeams, updateMyTeam, updateTeam } from '@/functions/teams'
import SyncIndicator from '@/components/realtime/SyncIndicator'
import { subscribeToPathState, type RealtimeStatus } from '@/lib/realtime'
import LabeledField from '@/components/forms/LabeledField'

type TeamPlayer = {
  firstName?: string
  lastName?: string
}

type TeamPlayers = Record<string, TeamPlayer>

interface TeamRow {
  id: string
  name: string
  createdOn?: string
  teamLogoURL?: string
  players?: TeamPlayers
  tags?: string[]
}

type TeamDraft = {
  teamName: string
  teamLogoURL: string
  tags: string[]
}

type TeamRecord = {
  teamName?: string
  teamLogoURL?: string
  players?: TeamPlayers
  tags?: string[]
}

type TeamEntry = [string, TeamRow]

const ALL_TAG_FILTER = 'All'

const emptyTeamDraft = {
  teamName: '',
  teamLogoURL: '',
  tags: [],
} satisfies TeamDraft

const playerAvatarTones = [
  'border-blue-200 bg-blue-100 text-blue-700',
  'border-emerald-200 bg-emerald-100 text-emerald-700',
  'border-violet-200 bg-violet-100 text-violet-700',
  'border-amber-200 bg-amber-100 text-amber-700',
  'border-rose-200 bg-rose-100 text-rose-700',
  'border-cyan-200 bg-cyan-100 text-cyan-700',
]

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, ' ')
}

function getTagKey(tag: string) {
  return normalizeTag(tag).toLowerCase()
}

function dedupeTags(tags: string[]) {
  const seen = new Set<string>()
  const normalizedTags: string[] = []

  tags.forEach((tag) => {
    const normalizedTag = normalizeTag(tag)
    if (!normalizedTag) return

    const tagKey = getTagKey(normalizedTag)
    if (seen.has(tagKey)) return

    seen.add(tagKey)
    normalizedTags.push(normalizedTag)
  })

  return normalizedTags
}

function getPlayerName(player?: TeamPlayer) {
  const firstName = player?.firstName?.trim() || ''
  const lastName = player?.lastName?.trim() || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  return fullName || 'Player'
}

function getAvatarTone(label: string) {
  const toneIndex = Array.from(label).reduce((total, character) => total + character.charCodeAt(0), 0) % playerAvatarTones.length
  return playerAvatarTones[toneIndex]
}

function TeamLogoPreview({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false)
  const hasImage = Boolean(src?.trim()) && !hasError

  useEffect(() => {
    setHasError(false)
  }, [src])

  return (
    <Box className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <TeamsIcon size={22} className="text-slate-300" />
      )}
    </Box>
  )
}

function TeamPlayerPreview({ players }: { players?: TeamPlayers }) {
  const playerList = Object.values(players || {})
  const previewPlayers = playerList.slice(0, 3)
  const extraCount = Math.max(playerList.length - previewPlayers.length, 0)

  if (playerList.length === 0) {
    return <Text className="text-sm text-slate-400">No players added yet</Text>
  }

  return (
    <HStack className="flex-wrap items-center gap-3">
      <HStack className="-space-x-2">
        {previewPlayers.map((player, index) => {
          const playerName = getPlayerName(player)

          return (
            <Box
              key={`${playerName}-${index}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold shadow-sm ${getAvatarTone(playerName)}`}
              title={playerName}
            >
              {playerName.charAt(0).toUpperCase()}
            </Box>
          )
        })}
      </HStack>
      <Text className="text-sm text-slate-500">
        {previewPlayers.map((player) => getPlayerName(player)).join(', ')}
        {extraCount > 0 ? ` +${extraCount} more` : ''}
      </Text>
    </HStack>
  )
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<RealtimeStatus>('loading')
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<{ myTeamID: string; teamID?: string } | null>(null)
  const [teamDraft, setTeamDraft] = useState<TeamDraft>(emptyTeamDraft)
  const [tagInput, setTagInput] = useState('')
  const [activeTagFilter, setActiveTagFilter] = useState<string>(ALL_TAG_FILTER)
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

  const availableTags = useMemo(() => (
    dedupeTags(
      teams.flatMap(([, team]) => team.tags || [])
    ).sort((left, right) => left.localeCompare(right))
  ), [teams])

  const filteredTeams = useMemo(() => {
    if (activeTagFilter === ALL_TAG_FILTER) {
      return teams
    }

    const activeTagKey = getTagKey(activeTagFilter)
    return teams.filter(([, team]) => (team.tags || []).some((tag) => getTagKey(tag) === activeTagKey))
  }, [activeTagFilter, teams])

  const tagSuggestions = useMemo(() => {
    const currentTagKeys = new Set(teamDraft.tags.map((tag) => getTagKey(tag)))
    const filterValue = getTagKey(tagInput)

    return availableTags
      .filter((tag) => !currentTagKeys.has(getTagKey(tag)))
      .filter((tag) => !filterValue || getTagKey(tag).includes(filterValue))
      .slice(0, 6)
  }, [availableTags, tagInput, teamDraft.tags])

  useEffect(() => {
    if (activeTagFilter === ALL_TAG_FILTER) return

    if (!availableTags.some((tag) => getTagKey(tag) === getTagKey(activeTagFilter))) {
      setActiveTagFilter(ALL_TAG_FILTER)
    }
  }, [activeTagFilter, availableTags])

  const closeTeamModal = () => {
    setShowTeamModal(false)
    setEditingTeam(null)
    setTeamDraft(emptyTeamDraft)
    setTagInput('')
  }

  const openNewTeamModal = () => {
    setEditingTeam(null)
    setTeamDraft(emptyTeamDraft)
    setTagInput('')
    setShowTeamModal(true)
  }

  const openEditTeamModal = async (myTeamID: string, team: TeamRow) => {
    const teamData = await getTeam(team.id) as TeamRecord | null

    setEditingTeam({ myTeamID, teamID: team.id })
    setTeamDraft({
      teamName: teamData?.teamName || team.name || '',
      teamLogoURL: teamData?.teamLogoURL || team.teamLogoURL || '',
      tags: dedupeTags(teamData?.tags || team.tags || []),
    })
    setTagInput('')
    setShowTeamModal(true)
  }

  const addTagToDraft = (value: string) => {
    const normalizedTag = normalizeTag(value)
    if (!normalizedTag) return

    setTeamDraft((current) => {
      if (current.tags.some((tag) => getTagKey(tag) === getTagKey(normalizedTag))) {
        return current
      }

      return {
        ...current,
        tags: [...current.tags, normalizedTag],
      }
    })
    setTagInput('')
  }

  const removeTagFromDraft = (tagToRemove: string) => {
    setTeamDraft((current) => ({
      ...current,
      tags: current.tags.filter((tag) => getTagKey(tag) !== getTagKey(tagToRemove)),
    }))
  }

  const handleSaveTeam = async () => {
    if (!teamDraft.teamName.trim()) return

    const payload = {
      teamName: teamDraft.teamName.trim(),
      teamLogoURL: teamDraft.teamLogoURL.trim(),
      players: editingTeam?.teamID ? ((await getTeam(editingTeam.teamID)) as TeamRecord | null)?.players || {} : {},
      tags: dedupeTags(teamDraft.tags),
    }

    if (editingTeam?.teamID) {
      await updateTeam(editingTeam.teamID, payload)
      await updateMyTeam(editingTeam.myTeamID, payload.teamName)
    } else {
      await addNewTeam(payload)
    }

    closeTeamModal()
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

        <Box className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
          <VStack className="gap-3">
            <VStack className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Filter by tag</Text>
              <Text className="text-sm text-slate-500">
                {availableTags.length > 0 ? 'Show only teams that match a tag.' : 'Create team tags to unlock quick filters.'}
              </Text>
            </VStack>
            <HStack className="flex-wrap gap-2">
              {[ALL_TAG_FILTER, ...availableTags].map((tag) => {
                const isActive = activeTagFilter === tag

                return (
                  <Button
                    key={tag}
                    size="sm"
                    variant={isActive ? 'solid' : 'outline'}
                    onClick={() => setActiveTagFilter(tag)}
                  >
                    <Text className={isActive ? 'text-white' : ''}>{tag}</Text>
                  </Button>
                )
              })}
            </HStack>
          </VStack>
        </Box>

        <VStack space="sm">
          {teams.length === 0 ? (
            <Box className="p-8 text-center">
              <TeamsIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">No teams yet</Text>
              <Text className="text-gray-400 text-sm">Create your first team to get started</Text>
            </Box>
          ) : filteredTeams.length === 0 ? (
            <Box className="rounded-[1.5rem] border border-dashed border-slate-200 p-8 text-center">
              <Text className="text-slate-500">No teams found for the “{activeTagFilter}” tag.</Text>
              <Text className="mt-1 text-sm text-slate-400">Choose another filter or tag a team to make it appear here.</Text>
            </Box>
          ) : (
            filteredTeams.map(([myTeamId, team]) => (
              <Card key={myTeamId} variant="elevated" className="mb-2">
                <CardBody>
                  <HStack className="flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <Pressable className="flex-1" onPress={() => navigate(`/teams/${team.id}`)}>
                      <HStack className="items-start gap-4">
                        <TeamLogoPreview src={team.teamLogoURL} alt={team.name || 'Team logo'} />
                        <VStack className="min-w-0 flex-1 gap-2">
                          <HStack className="items-start justify-between gap-3">
                            <VStack className="min-w-0 flex-1 gap-1">
                              <Text className="text-base font-semibold text-slate-900">{team.name}</Text>
                              {team.createdOn ? (
                                <Text className="text-gray-500 text-sm">Created {new Date(team.createdOn).toLocaleDateString()}</Text>
                              ) : null}
                            </VStack>
                            <ChevronRightIcon size={20} className="shrink-0 text-gray-400" />
                          </HStack>

                          <TeamPlayerPreview players={team.players} />

                          {team.tags && team.tags.length > 0 ? (
                            <HStack className="flex-wrap gap-2">
                              {team.tags.map((tag) => (
                                <Badge key={`${team.id}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                  {tag}
                                </Badge>
                              ))}
                            </HStack>
                          ) : null}
                        </VStack>
                      </HStack>
                    </Pressable>

                    <HStack className="flex-wrap items-center gap-2 sm:self-center">
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-slate-200 p-2"
                        onPress={() => openEditTeamModal(myTeamId, team)}
                      >
                        <PencilIcon size={16} className="text-slate-500" />
                      </Pressable>
                      <Pressable
                        className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-red-200 p-2"
                        onPress={() => setPendingDeleteTeam({ myTeamID: myTeamId, name: team.name })}
                      >
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
        onClose={closeTeamModal}
        title={editingTeam ? 'Edit Team' : 'Add Team'}
        footer={(
          <>
            <Button variant="outline" onClick={closeTeamModal}>
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
          <LabeledField label="Tags">
            <VStack className="gap-3">
              {teamDraft.tags.length > 0 ? (
                <HStack className="flex-wrap gap-2">
                  {teamDraft.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                      onClick={() => removeTagFromDraft(tag)}
                    >
                      <span>{tag}</span>
                      <span aria-hidden="true" className="text-slate-400">×</span>
                    </button>
                  ))}
                </HStack>
              ) : (
                <Text className="text-sm text-slate-400">Add tags like Mens, Womens, Junior, or Pro.</Text>
              )}

              <HStack className="flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  list="team-tag-suggestions"
                  onChangeText={setTagInput}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                      event.preventDefault()
                      addTagToDraft(tagInput)
                    }
                  }}
                />
                <Button size="sm" variant="outline" onClick={() => addTagToDraft(tagInput)} className="w-full sm:w-auto">
                  <Text>Add Tag</Text>
                </Button>
              </HStack>

              <datalist id="team-tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>

              {tagSuggestions.length > 0 ? (
                <VStack className="gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Suggestions</Text>
                  <HStack className="flex-wrap gap-2">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => addTagToDraft(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </HStack>
                </VStack>
              ) : null}
            </VStack>
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
