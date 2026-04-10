import db from '@/lib/database'

export const MATCH_SCHEMA_VERSION = 2

export type MatchLike = Record<string, any>
export type TeamMatchLike = Record<string, any>

type MatchAuditEvent = {
  action: string
  createdAt: string
  payload: Record<string, unknown>
}

type MatchPointEvent = {
  action: string
  createdAt: string
  gameNumber: number
  side?: 'A' | 'B'
  scoreA?: number
  scoreB?: number
  payload?: Record<string, unknown>
}

type RefFactory = typeof db.ref

function getGameStatus(match: MatchLike, gameNumber: number) {
  if (match[`isGame${gameNumber}Finished`]) {
    return 'completed'
  }
  if (match[`isGame${gameNumber}Started`]) {
    return 'in_progress'
  }
  return 'not_started'
}

function getGameWinner(match: MatchLike, gameNumber: number) {
  if (!match[`isGame${gameNumber}Finished`]) {
    return null
  }

  const scoreA = Number(match[`game${gameNumber}AScore`] || 0)
  const scoreB = Number(match[`game${gameNumber}BScore`] || 0)
  if (scoreA === scoreB) {
    return null
  }
  return scoreA > scoreB ? 'A' : 'B'
}

function buildMatchGameEntry(match: MatchLike, gameNumber: number) {
  const existingGames = match.games && typeof match.games === 'object' ? match.games : {}
  const existingGame = existingGames[gameNumber] && typeof existingGames[gameNumber] === 'object'
    ? existingGames[gameNumber]
    : existingGames[String(gameNumber)] && typeof existingGames[String(gameNumber)] === 'object'
      ? existingGames[String(gameNumber)]
      : {}
  const existingRules = existingGame.rules && typeof existingGame.rules === 'object' ? existingGame.rules : {}
  const existingMetadata = existingGame.metadata && typeof existingGame.metadata === 'object' ? existingGame.metadata : {}

  return {
    ...existingGame,
    gameNumber,
    status: getGameStatus(match, gameNumber),
    winner: getGameWinner(match, gameNumber),
    scoreA: Number(match[`game${gameNumber}AScore`] || 0),
    scoreB: Number(match[`game${gameNumber}BScore`] || 0),
    startedAt: match[`game${gameNumber}StartTime`] || '',
    endedAt: match[`game${gameNumber}EndTime`] || '',
    rules: {
      ...existingRules,
      sportName: match.sportName || '',
      scoringType: match.scoringType || '',
      pointsToWinGame: Number(match.pointsToWinGame || 0),
      changeServeEveryXPoints: Number(match.changeServeEveryXPoints || 0),
      enforceGameScore: Boolean(match.enforceGameScore),
      isManualServiceMode: Boolean(match.isManualServiceMode),
      isDoubles: Boolean(match.isDoubles),
    },
    metadata: {
      ...existingMetadata,
      significantPoints: match.significantPoints || {},
    },
  }
}

export function createNormalizedGames(match: MatchLike) {
  return Object.fromEntries(
    Array.from({ length: 9 }, (_, index) => {
      const gameNumber = index + 1
      return [gameNumber, buildMatchGameEntry(match, gameNumber)]
    }),
  )
}

function buildTournamentContext(match: MatchLike) {
  const existing = match.tournamentContext && typeof match.tournamentContext === 'object'
    ? match.tournamentContext
    : match.context && typeof match.context === 'object'
      ? match.context
    : {}

  return {
    ...existing,
    tournamentID: existing.tournamentID || match.tournamentID || '',
    eventID: existing.eventID || match.eventID || '',
    roundID: existing.roundID || match.roundID || '',
    bracketNodeID: existing.bracketNodeID || match.bracketNodeID || '',
    teamMatchID: existing.teamMatchID || match.teamMatchID || '',
    matchRound: existing.matchRound || match.matchRound || '',
    eventName: existing.eventName || match.eventName || '',
    metadata: existing.metadata || {},
  }
}

function buildSchedulingMetadata(match: MatchLike) {
  const existing = match.scheduling && typeof match.scheduling === 'object'
    ? match.scheduling
    : {}

  return {
    ...existing,
    scheduledStartTime: existing.scheduledStartTime || match.startTime || '',
    scheduledMatchID: existing.scheduledMatchID || match.scheduledMatchID || '',
    matchStartTime: existing.matchStartTime || match.matchStartTime || '',
    tableID: existing.tableID || match.tableID || '',
    teamMatchID: existing.teamMatchID || match.teamMatchID || '',
    tableNumber: existing.tableNumber || match.tableNumber || '',
    queueItemID: existing.queueItemID || match.queueItemID || '',
    sourceType: existing.sourceType || '',
    sourceID: existing.sourceID || '',
    metadata: existing.metadata || {},
  }
}

export function buildMatchSchemaPatch(match: MatchLike) {
  const tournamentContext = buildTournamentContext(match)
  const scheduling = buildSchedulingMetadata(match)
  const existingGames = match.games && typeof match.games === 'object'
    ? match.games
    : {}
  const existingScoringRules = match.scoringRules && typeof match.scoringRules === 'object'
    ? match.scoringRules
    : {}
  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    games: {
      ...existingGames,
      ...createNormalizedGames(match),
    },
    pointHistory: match.pointHistory || {},
    auditTrail: match.auditTrail || {},
    tournamentContext,
    context: tournamentContext,
    scheduling,
    scoringRules: {
      ...existingScoringRules,
      sportName: match.sportName || '',
      scoringType: match.scoringType || '',
      bestOf: Number(match.bestOf || 0),
      pointsToWinGame: Number(match.pointsToWinGame || 0),
      changeServeEveryXPoints: Number(match.changeServeEveryXPoints || 0),
      enforceGameScore: Boolean(match.enforceGameScore),
      isManualServiceMode: Boolean(match.isManualServiceMode),
      isDoubles: Boolean(match.isDoubles),
    },
  }
}

export function normalizeMatchSchema(match: MatchLike | null): MatchLike | null {
  if (!match || typeof match !== 'object') {
    return null
  }

  return {
    ...match,
    ...buildMatchSchemaPatch(match),
  } as MatchLike
}

export function buildTeamMatchSchemaPatch(teamMatch: TeamMatchLike) {
  const existingTournamentContext = teamMatch.tournamentContext && typeof teamMatch.tournamentContext === 'object'
    ? teamMatch.tournamentContext
    : teamMatch.context && typeof teamMatch.context === 'object'
      ? teamMatch.context
    : {}
  const existingScheduling = teamMatch.scheduling && typeof teamMatch.scheduling === 'object'
    ? teamMatch.scheduling
    : {}

  const tournamentContext = {
      ...existingTournamentContext,
      tournamentID: existingTournamentContext.tournamentID || teamMatch.tournamentID || '',
      eventID: existingTournamentContext.eventID || teamMatch.eventID || '',
      roundID: existingTournamentContext.roundID || teamMatch.roundID || '',
      matchRound: existingTournamentContext.matchRound || teamMatch.matchRound || '',
      eventName: existingTournamentContext.eventName || teamMatch.eventName || '',
      metadata: existingTournamentContext.metadata || {},
    }

  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentContext,
    context: tournamentContext,
    scheduling: {
      ...existingScheduling,
      scheduledMatches: existingScheduling.scheduledMatches || teamMatch.scheduledMatches || {},
      currentMatches: existingScheduling.currentMatches || teamMatch.currentMatches || {},
      startTime: existingScheduling.startTime || teamMatch.startTime || '',
      teamMatchID: existingScheduling.teamMatchID || teamMatch.teamMatchID || '',
      metadata: existingScheduling.metadata || {},
    },
    auditTrail: teamMatch.auditTrail || {},
  }
}

export function normalizeTeamMatchSchema(teamMatch: TeamMatchLike | null): TeamMatchLike | null {
  if (!teamMatch || typeof teamMatch !== 'object') {
    return null
  }

  return {
    ...teamMatch,
    ...buildTeamMatchSchemaPatch(teamMatch),
  } as TeamMatchLike
}

export async function syncMatchSchemaFromFlat(matchID: string, match?: MatchLike | null) {
  const currentMatch = match || (await db.ref(`matches/${matchID}`).get()).val()
  if (!currentMatch || typeof currentMatch !== 'object') {
    return null
  }

  const patch = buildMatchSchemaPatch(currentMatch)
  await db.ref(`matches/${matchID}`).update(patch)
  return patch
}

export async function ensureMatchSchema(matchID: string, match?: MatchLike | null, refFactory?: RefFactory) {
  const currentMatch = match || (await db.ref(`matches/${matchID}`).get()).val()
  if (!currentMatch || typeof currentMatch !== 'object') {
    return null
  }

  const patch = buildMatchSchemaPatch(currentMatch)
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update(patch)
  return patch
}

export async function syncTeamMatchSchema(teamMatchID: string, teamMatch?: TeamMatchLike | null) {
  const currentTeamMatch = teamMatch || (await db.ref(`teamMatches/${teamMatchID}`).get()).val()
  if (!currentTeamMatch || typeof currentTeamMatch !== 'object') {
    return null
  }

  const patch = buildTeamMatchSchemaPatch(currentTeamMatch)
  await db.ref(`teamMatches/${teamMatchID}`).update(patch)
  return patch
}

export async function syncMatchSchemaGame(matchID: string, match: MatchLike, gameNumber: number, refFactory?: RefFactory) {
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  const games = {
    ...(match.games || {}),
    [gameNumber]: buildMatchGameEntry(match, gameNumber),
  }
  const scoringRules = buildMatchSchemaPatch(match).scoringRules
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    games,
    scoringRules,
  })
  return games[gameNumber]
}

export async function syncMatchContext(matchID: string, match: MatchLike, refFactory?: RefFactory) {
  const tournamentContext = buildTournamentContext(match)
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentContext,
    context: tournamentContext,
  })
  return tournamentContext
}

export async function syncMatchScheduling(
  matchID: string,
  patch: Record<string, unknown>,
  refFactory?: RefFactory,
) {
  const existing = (await db.ref(`matches/${matchID}/scheduling`).get()).val()
  const nextScheduling = {
    ...(existing && typeof existing === 'object' ? existing : {}),
    ...patch,
  }
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    scheduling: nextScheduling,
  })
  return nextScheduling
}

export async function appendMatchAuditEvent(matchID: string, action: string, payload: Record<string, unknown> = {}) {
  const event: MatchAuditEvent = {
    action,
    createdAt: new Date().toISOString(),
    payload,
  }
  await db.ref(`matches/${matchID}/auditTrail`).push(event)
  return event
}

export async function appendTeamMatchAuditEvent(teamMatchID: string, action: string, payload: Record<string, unknown> = {}) {
  const event: MatchAuditEvent = {
    action,
    createdAt: new Date().toISOString(),
    payload,
  }
  await db.ref(`teamMatches/${teamMatchID}/auditTrail`).push(event)
  return event
}

export async function appendMatchPointHistory(matchID: string, event: MatchPointEvent) {
  await db.ref(`matches/${matchID}/pointHistory`).push(event)
  return event
}

export async function appendPointHistoryEvent(
  matchID: string,
  event: Record<string, unknown>,
  refFactory?: RefFactory,
) {
  const ref = refFactory ? refFactory(`matches/${matchID}/pointHistory`) : db.ref(`matches/${matchID}/pointHistory`)
  await ref.push({
    createdAt: new Date().toISOString(),
    ...event,
  })
  return event
}

export async function backfillAllMatchSchemas() {
  const snapshot = await db.ref('matches').get()
  const matches = snapshot.val()
  if (!matches || typeof matches !== 'object') {
    return { updated: 0 }
  }

  let updated = 0
  for (const [matchID, match] of Object.entries(matches)) {
    if (!match || typeof match !== 'object') {
      continue
    }
    await syncMatchSchemaFromFlat(matchID, match as MatchLike)
    updated += 1
  }

  return { updated }
}

export async function reportMatchSchemaBackfill() {
  const snapshot = await db.ref('matches').get()
  const matches = snapshot.val()
  if (!matches || typeof matches !== 'object') {
    return { total: 0, needsBackfill: 0, missingSchemaVersion: 0, missingGames: 0, missingHistory: 0 }
  }

  let total = 0
  let needsBackfill = 0
  let missingSchemaVersion = 0
  let missingGames = 0
  let missingHistory = 0

  for (const match of Object.values(matches)) {
    if (!match || typeof match !== 'object') {
      continue
    }
    total += 1
    const hasSchemaVersion = typeof (match as MatchLike).schemaVersion === 'number'
    const hasGames = Boolean((match as MatchLike).games && typeof (match as MatchLike).games === 'object')
    const hasHistory = Boolean((match as MatchLike).pointHistory && typeof (match as MatchLike).pointHistory === 'object')
    if (!hasSchemaVersion || !hasGames || !hasHistory) {
      needsBackfill += 1
    }
    if (!hasSchemaVersion) {
      missingSchemaVersion += 1
    }
    if (!hasGames) {
      missingGames += 1
    }
    if (!hasHistory) {
      missingHistory += 1
    }
  }

  return { total, needsBackfill, missingSchemaVersion, missingGames, missingHistory }
}

export async function backfillAllTeamMatchSchemas() {
  const snapshot = await db.ref('teamMatches').get()
  const teamMatches = snapshot.val()
  if (!teamMatches || typeof teamMatches !== 'object') {
    return { updated: 0 }
  }

  let updated = 0
  for (const [teamMatchID, teamMatch] of Object.entries(teamMatches)) {
    if (!teamMatch || typeof teamMatch !== 'object') {
      continue
    }
    await syncTeamMatchSchema(teamMatchID, teamMatch as TeamMatchLike)
    updated += 1
  }

  return { updated }
}

export async function reportTeamMatchSchemaBackfill() {
  const snapshot = await db.ref('teamMatches').get()
  const teamMatches = snapshot.val()
  if (!teamMatches || typeof teamMatches !== 'object') {
    return { total: 0, needsBackfill: 0, missingSchemaVersion: 0, missingAuditTrail: 0 }
  }

  let total = 0
  let needsBackfill = 0
  let missingSchemaVersion = 0
  let missingAuditTrail = 0

  for (const teamMatch of Object.values(teamMatches)) {
    if (!teamMatch || typeof teamMatch !== 'object') {
      continue
    }
    total += 1
    const hasSchemaVersion = typeof (teamMatch as TeamMatchLike).schemaVersion === 'number'
    const hasAuditTrail = Boolean((teamMatch as TeamMatchLike).auditTrail && typeof (teamMatch as TeamMatchLike).auditTrail === 'object')
    if (!hasSchemaVersion || !hasAuditTrail) {
      needsBackfill += 1
    }
    if (!hasSchemaVersion) {
      missingSchemaVersion += 1
    }
    if (!hasAuditTrail) {
      missingAuditTrail += 1
    }
  }

  return { total, needsBackfill, missingSchemaVersion, missingAuditTrail }
}
