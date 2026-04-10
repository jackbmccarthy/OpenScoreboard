import db, { getUserPath } from '@/lib/database'
import { canManageTournament, canTransferTournament, canViewTournament } from '@/lib/tournamentPermissions'
import { subscribeToPathValue } from '@/lib/realtime'
import { newTournament } from '@/classes/Tournament'
import { getPreviewValue, isRecordActive, softDeleteCanonical } from './deletion'
import { addScheduledMatch, deleteScheduledTableMatch, moveScheduledTableMatchToTable, updateScheduledMatch } from './scoring'
import Match from '@/classes/Match'

export type TournamentVisibility = 'private' | 'unlisted' | 'public'
export type TournamentStatus = 'draft' | 'published' | 'in-progress' | 'completed' | 'archived'

export type TournamentRecord = {
  ownerID: string
  name: string
  shortCode: string
  venue: string
  timezone: string
  startDate: string
  endDate: string
  description: string
  visibility: TournamentVisibility
  status: TournamentStatus
  settings: Record<string, unknown>
  events: Record<string, unknown>
  rounds: Record<string, unknown>
  brackets: Record<string, unknown>
  scheduleBlocks: Record<string, unknown>
  staffAssignments: Record<string, unknown>
  pendingInvites?: Record<string, unknown>
  publicVisibility: Record<string, unknown>
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export type TournamentPreview = {
  id: string
  name: string
  shortCode?: string
  venue?: string
  timezone?: string
  startDate?: string
  endDate?: string
  status?: TournamentStatus
  visibility?: TournamentVisibility
  accessRole?: TournamentGrantRole
  ownerID?: string
  createdAt?: string
  updatedAt?: string
}

export type TournamentEventRecord = {
  name: string
  shortCode: string
  format: string
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived'
  visibility: TournamentVisibility
  createdAt: string
  updatedAt: string
}

export type TournamentRoundRecord = {
  title: string
  shortLabel: string
  eventID: string
  order: number
  status: 'draft' | 'ready' | 'active' | 'paused' | 'completed' | 'archived'
  visibility: TournamentVisibility
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export type TournamentScheduleBlockRecord = {
  title: string
  eventID: string
  roundID: string
  sourceMatchID: string
  eventName: string
  roundTitle: string
  scheduledStartTime: string
  assignedTableID: string
  assignedTableLabel: string
  assignedQueueItemID: string
  status: 'unassigned' | 'scheduled' | 'called' | 'active' | 'completed' | 'cancelled'
  notes: string
  createdAt: string
  updatedAt: string
}

export type TournamentBracketRecord = {
  name: string
  eventID: string
  format: 'single-elimination' | 'double-elimination' | 'round-robin'
  seedCount: number
  seeds: Array<{ seedNumber: number; label: string }>
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived'
  visibility: TournamentVisibility
  nodes: Record<string, unknown>
  settings: {
    includeThirdPlaceMatch: boolean
    allowManualOverrides: boolean
    byeStrategy: 'top-seeds' | 'spread-evenly'
  }
  createdAt: string
  updatedAt: string
}

export type TournamentBracketNode = {
  id: string
  roundNumber: number
  matchNumber: number
  topSeed: number | null
  bottomSeed: number | null
  topLabel: string
  bottomLabel: string
  status: 'unassigned' | 'queued' | 'on-table' | 'in-progress' | 'final' | 'disputed'
  sourceMatchID: string
  scheduleBlockID?: string
  winnerSeed: number | null
}

export type TournamentGrantRole = 'owner' | 'admin' | 'scorer' | 'viewer'

export type TournamentStaffAssignmentRecord = {
  subjectType: 'user'
  subjectID: string
  role: TournamentGrantRole
  scope: 'tournament'
  note: string
  createdAt: string
  updatedAt: string
}

export type TournamentPendingInviteRecord = {
  email: string
  role: TournamentGrantRole
  scope: 'tournament'
  note: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

function buildSingleEliminationBracketNodes(
  seedCount: number,
  seeds?: Array<{ seedNumber: number; label: string }>,
) {
  const normalizedSeedCount = Math.max(2, 2 ** Math.ceil(Math.log2(seedCount)))
  const nodes: Record<string, TournamentBracketNode> = {}
  const seedMap = new Map((seeds || []).map((seed) => [seed.seedNumber, seed.label]))
  const seedOrder = Array.from({ length: normalizedSeedCount }, (_, index) => index + 1)

  let currentRoundSeeds: Array<{ seed: number | null; label: string }> = seedOrder.map((seed) => ({
    seed,
    label: seed <= seedCount ? (seedMap.get(seed) || `Seed ${seed}`) : 'BYE',
  }))

  let roundNumber = 1
  while (currentRoundSeeds.length > 1) {
    const nextRoundSeeds: Array<{ seed: number | null; label: string }> = []
    for (let matchIndex = 0; matchIndex < currentRoundSeeds.length; matchIndex += 2) {
      const top = currentRoundSeeds[matchIndex]
      const bottom = currentRoundSeeds[matchIndex + 1]
      const nodeID = `round-${roundNumber}-match-${(matchIndex / 2) + 1}`
      nodes[nodeID] = {
        id: nodeID,
        roundNumber,
        matchNumber: (matchIndex / 2) + 1,
        topSeed: top?.seed ?? null,
        bottomSeed: bottom?.seed ?? null,
        topLabel: top?.label || 'TBD',
        bottomLabel: bottom?.label || 'TBD',
        status: 'unassigned',
        sourceMatchID: '',
        winnerSeed: null,
      }
      nextRoundSeeds.push({
        seed: null,
        label: `Winner ${nodeID}`,
      })
    }
    currentRoundSeeds = nextRoundSeeds
    roundNumber += 1
  }

  return nodes
}

export async function addNewTournament(input: {
  name: string
  shortCode?: string
  venue?: string
  timezone?: string
  startDate?: string
  endDate?: string
  description?: string
  visibility?: TournamentVisibility
}) {
  const tournament = newTournament(input)
  const pushedTournament = await db.ref('tournaments').push(tournament)
  const preview: TournamentPreview = {
    id: pushedTournament.key || '',
    name: tournament.name,
    shortCode: tournament.shortCode,
    venue: tournament.venue,
    timezone: tournament.timezone,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    status: tournament.status as TournamentStatus,
    visibility: tournament.visibility as TournamentVisibility,
    accessRole: 'owner',
    ownerID: tournament.ownerID,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
  }
  await db.ref(`users/${getUserPath()}/myTournaments`).push(preview)
  return pushedTournament.key
}

export async function getTournament(tournamentID: string) {
  const snapshot = await db.ref(`tournaments/${tournamentID}`).get()
  const tournament = snapshot.val()
  return isRecordActive(tournament) ? tournament as TournamentRecord : null
}

export function subscribeToTournament(
  tournamentID: string,
  callback: (tournament: TournamentRecord | null) => void,
) {
  return subscribeToPathValue(`tournaments/${tournamentID}`, (tournamentValue) => {
    callback(isRecordActive(tournamentValue) ? tournamentValue as TournamentRecord : null)
  })
}

export async function updateTournament(tournamentID: string, patch: Partial<TournamentRecord>) {
  const currentTournament = await getTournament(tournamentID)
  if (!currentTournament) {
    throw new Error('Tournament not found')
  }
  const nextTournament: TournamentRecord = {
    ...currentTournament,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}`).set(nextTournament)
  return nextTournament
}

export function getTournamentEffectiveRole(
  tournament: TournamentRecord | null,
  userID: string,
): TournamentGrantRole | null {
  if (!tournament || !userID) {
    return null
  }
  if (tournament.ownerID === userID) {
    return 'owner'
  }
  const assignments = tournament.staffAssignments && typeof tournament.staffAssignments === 'object'
    ? tournament.staffAssignments as Record<string, TournamentStaffAssignmentRecord>
    : {}
  const assignment = Object.values(assignments).find((candidate) => candidate.subjectType === 'user' && candidate.subjectID === userID)
  return assignment?.role || null
}
export { canManageTournament, canTransferTournament, canViewTournament }

export async function getMyTournaments(userID = getUserPath()) {
  const [ownedSnapshot, sharedSnapshot] = await Promise.all([
    db.ref(`users/${userID}/myTournaments`).get(),
    db.ref(`users/${userID}/sharedTournaments`).get(),
  ])
  const previews = {
    ...((ownedSnapshot.val() && typeof ownedSnapshot.val() === 'object') ? ownedSnapshot.val() as Record<string, TournamentPreview> : {}),
    ...((sharedSnapshot.val() && typeof sharedSnapshot.val() === 'object') ? sharedSnapshot.val() as Record<string, TournamentPreview> : {}),
  }
  if (Object.keys(previews).length === 0) {
    return []
  }

  return Promise.all(Object.entries(previews).map(async ([myTournamentID, preview]) => {
    const previewEntry = preview as TournamentPreview
    const tournamentID = previewEntry?.id
    if (!tournamentID) {
      return null
    }
    const tournament = await getTournament(tournamentID)
    if (!tournament) {
      return null
    }
    return [myTournamentID, {
      ...previewEntry,
      status: (tournament.status || previewEntry.status || 'draft') as TournamentStatus,
      visibility: (tournament.visibility || previewEntry.visibility || 'private') as TournamentVisibility,
      accessRole: (previewEntry.accessRole || getTournamentEffectiveRole(tournament, userID) || 'viewer') as TournamentGrantRole,
      ownerID: String(tournament.ownerID || previewEntry.ownerID || ''),
      updatedAt: String(tournament.updatedAt || previewEntry.updatedAt || ''),
    }] as [string, TournamentPreview]
  })).then((entries) => entries.filter(Boolean) as Array<[string, TournamentPreview]>)
}

export function subscribeToMyTournaments(
  callback: (tournaments: Array<[string, TournamentPreview]>) => void,
  userID = getUserPath(),
) {
  const emit = async () => {
    callback(await getMyTournaments(userID))
  }

  const unsubscribeOwned = subscribeToPathValue(`users/${userID}/myTournaments`, () => {
    void emit()
  })
  const unsubscribeShared = subscribeToPathValue(`users/${userID}/sharedTournaments`, () => {
    void emit()
  })

  void emit()

  return () => {
    unsubscribeOwned()
    unsubscribeShared()
  }
}

export async function updateMyTournamentPreview(myTournamentID: string, patch: Partial<TournamentPreview>) {
  await db.ref(`users/${getUserPath()}/myTournaments/${myTournamentID}`).update({
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteMyTournament(myTournamentID: string) {
  const previewPath = `users/${getUserPath()}/myTournaments/${myTournamentID}`
  const preview = await getPreviewValue(previewPath)
  const tournamentID = preview?.id
  if (typeof tournamentID === 'string' && tournamentID.length > 0) {
    await softDeleteCanonical(`tournaments/${tournamentID}`, {
      deleteReason: 'delete_tournament',
    }, {
      entityType: 'tournament',
      canonicalID: tournamentID,
      ownerID: getUserPath(),
      previewPath,
    })
  }
  await db.ref(previewPath).remove()
}

async function addSharedTournamentPreview(subjectID: string, tournamentID: string, role: TournamentGrantRole) {
  const tournament = await getTournament(tournamentID)
  if (!tournament) {
    return null
  }
  const preview: TournamentPreview = {
    id: tournamentID,
    name: tournament.name,
    shortCode: String(tournament.shortCode || ''),
    venue: String(tournament.venue || ''),
    timezone: String(tournament.timezone || ''),
    startDate: String(tournament.startDate || ''),
    endDate: String(tournament.endDate || ''),
    status: (tournament.status || 'draft') as TournamentStatus,
    visibility: (tournament.visibility || 'private') as TournamentVisibility,
    accessRole: role,
    ownerID: String(tournament.ownerID || ''),
    createdAt: String(tournament.createdAt || ''),
    updatedAt: String(tournament.updatedAt || ''),
  }
  return db.ref(`users/${subjectID}/sharedTournaments`).push(preview)
}

async function findSharedTournamentPreviewPath(subjectID: string, tournamentID: string) {
  const snapshot = await db.ref(`users/${subjectID}/sharedTournaments`).get()
  const sharedTournaments = snapshot.val()
  if (!sharedTournaments || typeof sharedTournaments !== 'object') {
    return null
  }
  const previewEntry = Object.entries(sharedTournaments).find(([, preview]) => (preview as TournamentPreview).id === tournamentID)
  return previewEntry ? `users/${subjectID}/sharedTournaments/${previewEntry[0]}` : null
}

async function findOwnedTournamentPreviewPath(subjectID: string, tournamentID: string) {
  const snapshot = await db.ref(`users/${subjectID}/myTournaments`).get()
  const ownedTournaments = snapshot.val()
  if (!ownedTournaments || typeof ownedTournaments !== 'object') {
    return null
  }
  const previewEntry = Object.entries(ownedTournaments).find(([, preview]) => (preview as TournamentPreview).id === tournamentID)
  return previewEntry ? `users/${subjectID}/myTournaments/${previewEntry[0]}` : null
}

export async function addTournamentStaffAssignment(tournamentID: string, input: {
  subjectID: string
  role: TournamentGrantRole
  note?: string
}) {
  const assignment: TournamentStaffAssignmentRecord = {
    subjectType: 'user',
    subjectID: input.subjectID,
    role: input.role,
    scope: 'tournament',
    note: input.note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pushedAssignment = await db.ref(`tournaments/${tournamentID}/staffAssignments`).push(assignment)
  await addSharedTournamentPreview(input.subjectID, tournamentID, input.role)
  await updateTournament(tournamentID, {})
  return pushedAssignment.key
}

export async function updateTournamentStaffAssignment(
  tournamentID: string,
  assignmentID: string,
  patch: Partial<TournamentStaffAssignmentRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/staffAssignments/${assignmentID}`).get()
  const currentAssignment = snapshot.val()
  if (!currentAssignment || typeof currentAssignment !== 'object') {
    throw new Error('Tournament staff assignment not found')
  }
  const nextAssignment: TournamentStaffAssignmentRecord = {
    ...(currentAssignment as TournamentStaffAssignmentRecord),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/staffAssignments/${assignmentID}`).set(nextAssignment)
  const sharedPreviewPath = await findSharedTournamentPreviewPath(nextAssignment.subjectID, tournamentID)
  if (sharedPreviewPath) {
    await db.ref(sharedPreviewPath).update({
      accessRole: nextAssignment.role,
      updatedAt: new Date().toISOString(),
    })
  }
  return nextAssignment
}

export async function deleteTournamentStaffAssignment(tournamentID: string, assignmentID: string) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/staffAssignments/${assignmentID}`).get()
  const assignment = snapshot.val() as TournamentStaffAssignmentRecord | null
  await db.ref(`tournaments/${tournamentID}/staffAssignments/${assignmentID}`).remove()
  if (assignment?.subjectID) {
    const sharedPreviewPath = await findSharedTournamentPreviewPath(assignment.subjectID, tournamentID)
    if (sharedPreviewPath) {
      await db.ref(sharedPreviewPath).remove()
    }
  }
}

export async function addTournamentPendingInvite(tournamentID: string, input: {
  email: string
  role: TournamentGrantRole
  note?: string
  expiresInDays?: number
}) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (input.expiresInDays || 14) * 24 * 60 * 60 * 1000)
  const invite: TournamentPendingInviteRecord = {
    email: input.email,
    role: input.role,
    scope: 'tournament',
    note: input.note || '',
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
  const pushedInvite = await db.ref(`tournaments/${tournamentID}/pendingInvites`).push(invite)
  await updateTournament(tournamentID, {})
  return pushedInvite.key
}

export async function deleteTournamentPendingInvite(tournamentID: string, inviteID: string) {
  await db.ref(`tournaments/${tournamentID}/pendingInvites/${inviteID}`).remove()
}

export async function updateTournamentPendingInvite(
  tournamentID: string,
  inviteID: string,
  patch: Partial<TournamentPendingInviteRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/pendingInvites/${inviteID}`).get()
  const currentInvite = snapshot.val()
  if (!currentInvite || typeof currentInvite !== 'object') {
    throw new Error('Tournament invite not found')
  }
  const nextInvite: TournamentPendingInviteRecord = {
    ...(currentInvite as TournamentPendingInviteRecord),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/pendingInvites/${inviteID}`).set(nextInvite)
  return nextInvite
}

export async function resendTournamentPendingInvite(
  tournamentID: string,
  inviteID: string,
  expiresInDays = 14,
) {
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  return updateTournamentPendingInvite(tournamentID, inviteID, { expiresAt })
}

export async function duplicateTournament(tournamentID: string, name?: string) {
  const tournament = await getTournament(tournamentID)
  if (!tournament) {
    throw new Error('Tournament not found')
  }

  const duplicateName = name?.trim() || `${tournament.name} Copy`
  return addNewTournament({
    name: duplicateName,
    shortCode: String(tournament.shortCode || ''),
    venue: String(tournament.venue || ''),
    timezone: String(tournament.timezone || ''),
    startDate: String(tournament.startDate || ''),
    endDate: String(tournament.endDate || ''),
    description: String(tournament.description || ''),
    visibility: (tournament.visibility || 'private') as TournamentVisibility,
  })
}

export async function archiveTournament(tournamentID: string) {
  return updateTournament(tournamentID, { status: 'archived' })
}

export async function transferTournamentOwnership(tournamentID: string, newOwnerID: string) {
  const tournament = await getTournament(tournamentID)
  if (!tournament) {
    throw new Error('Tournament not found')
  }
  if (!newOwnerID || newOwnerID === tournament.ownerID) {
    throw new Error('Choose a different owner')
  }

  const staffAssignments = tournament.staffAssignments && typeof tournament.staffAssignments === 'object'
    ? tournament.staffAssignments as Record<string, TournamentStaffAssignmentRecord>
    : {}
  const newOwnerEntry = Object.entries(staffAssignments).find(([, assignment]) => assignment.subjectType === 'user' && assignment.subjectID === newOwnerID)
  if (!newOwnerEntry) {
    throw new Error('New owner must already have a tournament grant')
  }

  const oldOwnerID = String(tournament.ownerID || '')
  const nextStaffAssignments = { ...staffAssignments }
  delete nextStaffAssignments[newOwnerEntry[0]]

  if (oldOwnerID && oldOwnerID !== newOwnerID) {
    const oldOwnerEntry = Object.entries(nextStaffAssignments).find(([, assignment]) => assignment.subjectType === 'user' && assignment.subjectID === oldOwnerID)
    const oldOwnerAssignmentID = oldOwnerEntry?.[0] || `carry-over-${Date.now()}`
    nextStaffAssignments[oldOwnerAssignmentID] = {
      subjectType: 'user',
      subjectID: oldOwnerID,
      role: 'admin',
      scope: 'tournament',
      note: oldOwnerEntry?.[1]?.note || 'Previous owner retained as admin after ownership transfer',
      createdAt: oldOwnerEntry?.[1]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const nextTournament = await updateTournament(tournamentID, {
    ownerID: newOwnerID,
    staffAssignments: nextStaffAssignments,
  })

  const oldOwnerPreviewPath = oldOwnerID ? await findOwnedTournamentPreviewPath(oldOwnerID, tournamentID) : null
  if (oldOwnerPreviewPath) {
    await db.ref(oldOwnerPreviewPath).remove()
  }

  const newOwnerSharedPreviewPath = await findSharedTournamentPreviewPath(newOwnerID, tournamentID)
  if (newOwnerSharedPreviewPath) {
    await db.ref(newOwnerSharedPreviewPath).remove()
  }

  const newOwnerOwnedPreviewPath = await findOwnedTournamentPreviewPath(newOwnerID, tournamentID)
  const preview: TournamentPreview = {
    id: tournamentID,
    name: nextTournament.name,
    shortCode: String(nextTournament.shortCode || ''),
    venue: String(nextTournament.venue || ''),
    timezone: String(nextTournament.timezone || ''),
    startDate: String(nextTournament.startDate || ''),
    endDate: String(nextTournament.endDate || ''),
    status: (nextTournament.status || 'draft') as TournamentStatus,
    visibility: (nextTournament.visibility || 'private') as TournamentVisibility,
    accessRole: 'owner',
    ownerID: String(nextTournament.ownerID || ''),
    createdAt: String(nextTournament.createdAt || ''),
    updatedAt: String(nextTournament.updatedAt || ''),
  }
  if (newOwnerOwnedPreviewPath) {
    await db.ref(newOwnerOwnedPreviewPath).set(preview)
  } else {
    await db.ref(`users/${newOwnerID}/myTournaments`).push(preview)
  }

  if (oldOwnerID && oldOwnerID !== newOwnerID) {
    const oldOwnerSharedPreviewPath = await findSharedTournamentPreviewPath(oldOwnerID, tournamentID)
    if (oldOwnerSharedPreviewPath) {
      await db.ref(oldOwnerSharedPreviewPath).update({
        accessRole: 'admin',
        updatedAt: new Date().toISOString(),
      })
    } else {
      await addSharedTournamentPreview(oldOwnerID, tournamentID, 'admin')
    }
  }

  return nextTournament
}

export async function addTournamentEvent(tournamentID: string, input: {
  name: string
  shortCode?: string
  format?: string
  visibility?: TournamentVisibility
}) {
  const event: TournamentEventRecord = {
    name: input.name,
    shortCode: input.shortCode || '',
    format: input.format || 'single-elimination',
    status: 'draft',
    visibility: input.visibility || 'private',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pushedEvent = await db.ref(`tournaments/${tournamentID}/events`).push(event)
  await updateTournament(tournamentID, {})
  return pushedEvent.key
}

export async function updateTournamentEvent(
  tournamentID: string,
  eventID: string,
  patch: Partial<TournamentEventRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/events/${eventID}`).get()
  const currentEvent = snapshot.val()
  if (!currentEvent || typeof currentEvent !== 'object') {
    throw new Error('Tournament event not found')
  }
  const nextEvent: TournamentEventRecord = {
    ...(currentEvent as TournamentEventRecord),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/events/${eventID}`).set(nextEvent)
  return nextEvent
}

export async function deleteTournamentEvent(tournamentID: string, eventID: string) {
  await db.ref(`tournaments/${tournamentID}/events/${eventID}`).remove()
}

export async function addTournamentRound(tournamentID: string, input: {
  title: string
  shortLabel?: string
  eventID?: string
  order?: number
  visibility?: TournamentVisibility
}) {
  const round: TournamentRoundRecord = {
    title: input.title,
    shortLabel: input.shortLabel || '',
    eventID: input.eventID || '',
    order: input.order || 1,
    status: 'draft',
    visibility: input.visibility || 'private',
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pushedRound = await db.ref(`tournaments/${tournamentID}/rounds`).push(round)
  await updateTournament(tournamentID, {})
  return pushedRound.key
}

export async function addTournamentBracket(tournamentID: string, input: {
  name: string
  eventID?: string
  format?: TournamentBracketRecord['format']
  seedCount?: number
  visibility?: TournamentVisibility
}) {
  const bracket: TournamentBracketRecord = {
    name: input.name,
    eventID: input.eventID || '',
    format: input.format || 'single-elimination',
    seedCount: input.seedCount || 8,
    seeds: Array.from({ length: input.seedCount || 8 }, (_, index) => ({
      seedNumber: index + 1,
      label: `Seed ${index + 1}`,
    })),
    status: 'draft',
    visibility: input.visibility || 'private',
    nodes: {},
    settings: {
      includeThirdPlaceMatch: false,
      allowManualOverrides: true,
      byeStrategy: 'top-seeds',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pushedBracket = await db.ref(`tournaments/${tournamentID}/brackets`).push(bracket)
  await updateTournament(tournamentID, {})
  return pushedBracket.key
}

export async function generateTournamentBracketNodes(
  tournamentID: string,
  bracketID: string,
  seedCount?: number,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).get()
  const currentBracket = snapshot.val()
  if (!currentBracket || typeof currentBracket !== 'object') {
    throw new Error('Tournament bracket not found')
  }

  const bracket = currentBracket as TournamentBracketRecord
  if (bracket.format !== 'single-elimination') {
    throw new Error('Bracket generation currently supports only single-elimination')
  }

  const nextSeedCount = seedCount || bracket.seedCount || 8
  const normalizedSeeds = Array.from({ length: nextSeedCount }, (_, index) => {
    const existingSeed = (bracket.seeds || []).find((seed) => seed.seedNumber === index + 1)
    return existingSeed || {
      seedNumber: index + 1,
      label: `Seed ${index + 1}`,
    }
  })
  const nodes = buildSingleEliminationBracketNodes(nextSeedCount, normalizedSeeds)
  return updateTournamentBracket(tournamentID, bracketID, { nodes, seedCount: nextSeedCount, seeds: normalizedSeeds })
}

export async function updateTournamentBracket(
  tournamentID: string,
  bracketID: string,
  patch: Partial<TournamentBracketRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).get()
  const currentBracket = snapshot.val()
  if (!currentBracket || typeof currentBracket !== 'object') {
    throw new Error('Tournament bracket not found')
  }
  const nextBracket: TournamentBracketRecord = {
    ...(currentBracket as TournamentBracketRecord),
    ...patch,
    settings: {
      ...((currentBracket as TournamentBracketRecord).settings || {}),
      ...(patch.settings || {}),
    },
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).set(nextBracket)
  return nextBracket
}

export async function updateTournamentBracketNode(
  tournamentID: string,
  bracketID: string,
  nodeID: string,
  patch: Partial<TournamentBracketNode>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).get()
  const currentBracket = snapshot.val()
  if (!currentBracket || typeof currentBracket !== 'object') {
    throw new Error('Tournament bracket not found')
  }

  const bracket = currentBracket as TournamentBracketRecord
  const currentNode = bracket.nodes?.[nodeID] as TournamentBracketNode | undefined
  if (!currentNode) {
    throw new Error('Tournament bracket node not found')
  }

  const nextNodes = {
    ...(bracket.nodes || {}),
    [nodeID]: {
      ...currentNode,
      ...patch,
    },
  }

  return updateTournamentBracket(tournamentID, bracketID, { nodes: nextNodes })
}

export async function createScheduleBlockFromBracketNode(
  tournamentID: string,
  bracketID: string,
  nodeID: string,
  input: {
    assignedTableID?: string
    assignedTableLabel?: string
    scheduledStartTime?: string
    notes?: string
  } = {},
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).get()
  const currentBracket = snapshot.val()
  if (!currentBracket || typeof currentBracket !== 'object') {
    throw new Error('Tournament bracket not found')
  }

  const bracket = currentBracket as TournamentBracketRecord
  const node = bracket.nodes?.[nodeID] as TournamentBracketNode | undefined
  if (!node) {
    throw new Error('Tournament bracket node not found')
  }

  const scheduleBlockID = await addTournamentScheduleBlock(tournamentID, {
    title: `${node.topLabel} vs ${node.bottomLabel}`,
    eventID: bracket.eventID || '',
    sourceMatchID: node.sourceMatchID || '',
    eventName: '',
    roundTitle: `Bracket Round ${node.roundNumber}`,
    assignedTableID: input.assignedTableID || '',
    assignedTableLabel: input.assignedTableLabel || '',
    scheduledStartTime: input.scheduledStartTime || '',
    notes: input.notes || '',
  })

  await updateTournamentBracketNode(tournamentID, bracketID, nodeID, {
    scheduleBlockID: scheduleBlockID || '',
    status: input.assignedTableID ? 'queued' : node.status,
  })

  return scheduleBlockID
}

export async function deleteTournamentBracket(tournamentID: string, bracketID: string) {
  await db.ref(`tournaments/${tournamentID}/brackets/${bracketID}`).remove()
}

export async function updateTournamentRound(
  tournamentID: string,
  roundID: string,
  patch: Partial<TournamentRoundRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/rounds/${roundID}`).get()
  const currentRound = snapshot.val()
  if (!currentRound || typeof currentRound !== 'object') {
    throw new Error('Tournament round not found')
  }
  const nextRound: TournamentRoundRecord = {
    ...(currentRound as TournamentRoundRecord),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/rounds/${roundID}`).set(nextRound)
  return nextRound
}

export async function deleteTournamentRound(tournamentID: string, roundID: string) {
  await db.ref(`tournaments/${tournamentID}/rounds/${roundID}`).remove()
}

export async function transitionTournamentRoundStatus(
  tournamentID: string,
  roundID: string,
  status: TournamentRoundRecord['status'],
) {
  const nextRound = await updateTournamentRound(tournamentID, roundID, { status })

  const scheduleBlocksSnapshot = await db.ref(`tournaments/${tournamentID}/scheduleBlocks`).get()
  const scheduleBlocks = scheduleBlocksSnapshot.val() && typeof scheduleBlocksSnapshot.val() === 'object'
    ? scheduleBlocksSnapshot.val() as Record<string, TournamentScheduleBlockRecord>
    : {}

  const nextScheduleStatus: Record<TournamentRoundRecord['status'], TournamentScheduleBlockRecord['status']> = {
    draft: 'unassigned',
    ready: 'scheduled',
    active: 'called',
    paused: 'called',
    completed: 'completed',
    archived: 'cancelled',
  }

  for (const [scheduleBlockID, scheduleBlock] of Object.entries(scheduleBlocks)) {
    if (scheduleBlock.roundID !== roundID) {
      continue
    }
    await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
      status: nextScheduleStatus[status],
    })
  }

  return nextRound
}

export async function addTournamentScheduleBlock(tournamentID: string, input: {
  title: string
  eventID?: string
  roundID?: string
  sourceMatchID?: string
  eventName?: string
  roundTitle?: string
  scheduledStartTime?: string
  assignedTableID?: string
  assignedTableLabel?: string
  notes?: string
}) {
  const scheduleBlock: TournamentScheduleBlockRecord = {
    title: input.title,
    eventID: input.eventID || '',
    roundID: input.roundID || '',
    sourceMatchID: input.sourceMatchID || '',
    eventName: input.eventName || '',
    roundTitle: input.roundTitle || '',
    scheduledStartTime: input.scheduledStartTime || '',
    assignedTableID: input.assignedTableID || '',
    assignedTableLabel: input.assignedTableLabel || '',
    assignedQueueItemID: '',
    status: input.assignedTableID ? 'scheduled' : 'unassigned',
    notes: input.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pushedScheduleBlock = await db.ref(`tournaments/${tournamentID}/scheduleBlocks`).push(scheduleBlock)
  await updateTournament(tournamentID, {})
  return pushedScheduleBlock.key
}

export async function createTournamentScheduleMatch(tournamentID: string, scheduleBlockID: string, sportName = 'tableTennis', scoringType: string | null = 'normal') {
  const snapshot = await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).get()
  const currentScheduleBlock = snapshot.val()
  if (!currentScheduleBlock || typeof currentScheduleBlock !== 'object') {
    throw new Error('Tournament schedule block not found')
  }

  const scheduleBlock = currentScheduleBlock as TournamentScheduleBlockRecord
  if (scheduleBlock.sourceMatchID) {
    return scheduleBlock.sourceMatchID
  }

  const eventRecord = scheduleBlock.eventID
    ? (await db.ref(`tournaments/${tournamentID}/events/${scheduleBlock.eventID}`).get()).val() as TournamentEventRecord | null
    : null
  const roundRecord = scheduleBlock.roundID
    ? (await db.ref(`tournaments/${tournamentID}/rounds/${scheduleBlock.roundID}`).get()).val() as TournamentRoundRecord | null
    : null

  const newMatch = new Match().createNew(sportName, {
    tournamentID,
    eventID: scheduleBlock.eventID || '',
    roundID: scheduleBlock.roundID || '',
    matchRound: scheduleBlock.roundTitle || roundRecord?.title || '',
    eventName: scheduleBlock.eventName || eventRecord?.name || '',
    scoringType,
    sportName,
  }, false, scoringType)

  const pushedMatch = await db.ref('matches').push(newMatch)
  await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
    sourceMatchID: pushedMatch.key || '',
    eventName: scheduleBlock.eventName || eventRecord?.name || '',
    roundTitle: scheduleBlock.roundTitle || roundRecord?.title || '',
  })
  return pushedMatch.key
}

export async function updateTournamentScheduleBlock(
  tournamentID: string,
  scheduleBlockID: string,
  patch: Partial<TournamentScheduleBlockRecord>,
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).get()
  const currentScheduleBlock = snapshot.val()
  if (!currentScheduleBlock || typeof currentScheduleBlock !== 'object') {
    throw new Error('Tournament schedule block not found')
  }
  const nextScheduleBlock: TournamentScheduleBlockRecord = {
    ...(currentScheduleBlock as TournamentScheduleBlockRecord),
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).set(nextScheduleBlock)
  return nextScheduleBlock
}

export async function deleteTournamentScheduleBlock(tournamentID: string, scheduleBlockID: string) {
  await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).remove()
}

export async function queueTournamentScheduleBlock(tournamentID: string, scheduleBlockID: string) {
  const tournament = await getTournament(tournamentID)
  const snapshot = await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).get()
  const currentScheduleBlock = snapshot.val()
  if (!tournament || !currentScheduleBlock || typeof currentScheduleBlock !== 'object') {
    throw new Error('Tournament schedule block not found')
  }

  const scheduleBlock = currentScheduleBlock as TournamentScheduleBlockRecord
  if (!scheduleBlock.assignedTableID || !scheduleBlock.sourceMatchID) {
    throw new Error('Schedule block needs both a source match and assigned table')
  }

  const eventRecord = scheduleBlock.eventID
    ? (await db.ref(`tournaments/${tournamentID}/events/${scheduleBlock.eventID}`).get()).val() as TournamentEventRecord | null
    : null
  const roundRecord = scheduleBlock.roundID
    ? (await db.ref(`tournaments/${tournamentID}/rounds/${scheduleBlock.roundID}`).get()).val() as TournamentRoundRecord | null
    : null

  const eventName = scheduleBlock.eventName || eventRecord?.name || ''
  const roundTitle = scheduleBlock.roundTitle || roundRecord?.title || ''

  await db.ref(`matches/${scheduleBlock.sourceMatchID}`).update({
    tournamentID,
    eventID: scheduleBlock.eventID || '',
    roundID: scheduleBlock.roundID || '',
    eventName,
    matchRound: roundTitle,
  })
  await db.ref(`matches/${scheduleBlock.sourceMatchID}/scheduling`).update({
    tableID: scheduleBlock.assignedTableID,
    scheduledStartTime: scheduleBlock.scheduledStartTime || '',
    sourceType: 'tournament-schedule',
    sourceID: scheduleBlockID,
  })

  const queueItemID = await addScheduledMatch(scheduleBlock.assignedTableID, scheduleBlock.sourceMatchID, scheduleBlock.scheduledStartTime || '', {
    tournamentID,
    eventID: scheduleBlock.eventID || '',
    roundID: scheduleBlock.roundID || '',
    eventName,
    matchRound: roundTitle,
    sourceType: 'tournament-schedule',
    sourceID: scheduleBlockID,
    operatorNotes: scheduleBlock.notes || '',
  })

  await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
    eventName,
    roundTitle,
    assignedQueueItemID: queueItemID || '',
    status: queueItemID ? 'scheduled' : scheduleBlock.status,
  })

  return queueItemID
}

export async function syncTournamentScheduleBlockToQueue(tournamentID: string, scheduleBlockID: string) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/scheduleBlocks/${scheduleBlockID}`).get()
  const currentScheduleBlock = snapshot.val()
  if (!currentScheduleBlock || typeof currentScheduleBlock !== 'object') {
    throw new Error('Tournament schedule block not found')
  }

  const scheduleBlock = currentScheduleBlock as TournamentScheduleBlockRecord
  if (!scheduleBlock.assignedTableID || !scheduleBlock.sourceMatchID) {
    throw new Error('Schedule block needs both a source match and assigned table')
  }

  const eventRecord = scheduleBlock.eventID
    ? (await db.ref(`tournaments/${tournamentID}/events/${scheduleBlock.eventID}`).get()).val() as TournamentEventRecord | null
    : null
  const roundRecord = scheduleBlock.roundID
    ? (await db.ref(`tournaments/${tournamentID}/rounds/${scheduleBlock.roundID}`).get()).val() as TournamentRoundRecord | null
    : null

  const eventName = scheduleBlock.eventName || eventRecord?.name || ''
  const roundTitle = scheduleBlock.roundTitle || roundRecord?.title || ''
  const queuePatch = {
    tournamentID,
    eventID: scheduleBlock.eventID || '',
    roundID: scheduleBlock.roundID || '',
    eventName,
    matchRound: roundTitle,
    sourceType: 'tournament-schedule',
    sourceID: scheduleBlockID,
    operatorNotes: scheduleBlock.notes || '',
  }

  if (!scheduleBlock.assignedQueueItemID) {
    return queueTournamentScheduleBlock(tournamentID, scheduleBlockID)
  }

  const sourceTableID = scheduleBlock.assignedTableID
  const queueItemSnapshot = await db.ref(`tables/${sourceTableID}/scheduledMatches/${scheduleBlock.assignedQueueItemID}`).get()
  if (queueItemSnapshot.val()) {
    await updateScheduledMatch(sourceTableID, scheduleBlock.assignedQueueItemID, scheduleBlock.sourceMatchID, scheduleBlock.scheduledStartTime || '', queuePatch)
    await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
      eventName,
      roundTitle,
      status: 'scheduled',
    })
    return scheduleBlock.assignedQueueItemID
  }

  const allTables = await db.ref('tables').get()
  const allTableRecords = allTables.val() && typeof allTables.val() === 'object'
    ? allTables.val() as Record<string, Record<string, unknown>>
    : {}
  const currentTableEntry = Object.entries(allTableRecords).find(([, tableRecord]) => {
    const scheduledMatches = tableRecord?.scheduledMatches && typeof tableRecord.scheduledMatches === 'object'
      ? tableRecord.scheduledMatches as Record<string, Record<string, unknown>>
      : {}
    return Boolean(scheduledMatches[scheduleBlock.assignedQueueItemID])
  })

  if (currentTableEntry) {
    const [currentTableID] = currentTableEntry
    if (currentTableID !== sourceTableID) {
      const movedQueueItemID = await moveScheduledTableMatchToTable(currentTableID, sourceTableID, scheduleBlock.assignedQueueItemID)
      await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
        assignedQueueItemID: movedQueueItemID || '',
      })
      if (movedQueueItemID) {
        await updateScheduledMatch(sourceTableID, movedQueueItemID, scheduleBlock.sourceMatchID, scheduleBlock.scheduledStartTime || '', queuePatch)
      }
      return movedQueueItemID
    }
  }

  const queueItemID = await addScheduledMatch(sourceTableID, scheduleBlock.sourceMatchID, scheduleBlock.scheduledStartTime || '', queuePatch)
  await updateTournamentScheduleBlock(tournamentID, scheduleBlockID, {
    eventName,
    roundTitle,
    assignedQueueItemID: queueItemID || '',
    status: queueItemID ? 'scheduled' : scheduleBlock.status,
  })
  return queueItemID
}

export async function reorderTournamentRound(
  tournamentID: string,
  roundID: string,
  direction: 'up' | 'down',
) {
  const snapshot = await db.ref(`tournaments/${tournamentID}/rounds`).get()
  const roundsValue = snapshot.val()
  if (!roundsValue || typeof roundsValue !== 'object') {
    return []
  }

  const orderedRounds = Object.entries(roundsValue as Record<string, TournamentRoundRecord>)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
  const currentIndex = orderedRounds.findIndex(([currentRoundID]) => currentRoundID === roundID)
  if (currentIndex < 0) {
    return orderedRounds
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= orderedRounds.length) {
    return orderedRounds
  }

  const reorderedRounds = [...orderedRounds]
  const [movedRound] = reorderedRounds.splice(currentIndex, 1)
  reorderedRounds.splice(targetIndex, 0, movedRound)

  await db.ref(`tournaments/${tournamentID}/rounds`).set(
    Object.fromEntries(reorderedRounds.map(([currentRoundID, round], index) => [
      currentRoundID,
      {
        ...round,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      },
    ])),
  )

  return reorderedRounds
}
