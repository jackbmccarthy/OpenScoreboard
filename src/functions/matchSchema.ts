import db from '@/lib/database'
import {
  MATCH_SCHEMA_VERSION,
  buildMatchSchemaPatch,
  buildTeamMatchSchemaPatch,
  createNormalizedGames,
  normalizeMatchSchema,
  normalizeTeamMatchSchema,
  summarizeMatchSchemaBackfill,
  summarizeTeamMatchSchemaBackfill,
} from '@/schema/matchSchemaBridge.js'

export { MATCH_SCHEMA_VERSION, buildMatchSchemaPatch, buildTeamMatchSchemaPatch, createNormalizedGames, normalizeMatchSchema, normalizeTeamMatchSchema }

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
  const patch = buildMatchSchemaPatch(match)
  const games = {
    ...(match.games || {}),
    [gameNumber]: patch.games[gameNumber],
  }
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    games,
    scoringRules: patch.scoringRules,
  })
  return games[gameNumber]
}

export async function syncMatchContext(matchID: string, match: MatchLike, refFactory?: RefFactory) {
  const patch = buildMatchSchemaPatch(match)
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentContext: patch.tournamentContext,
    context: patch.context,
  })
  return patch.tournamentContext
}

export async function syncMatchScheduling(
  matchID: string,
  patch: Record<string, unknown>,
  refFactory?: RefFactory,
) {
  const currentMatch = (await db.ref(`matches/${matchID}`).get()).val()
  const existing = (await db.ref(`matches/${matchID}/scheduling`).get()).val()
  const nextScheduling = {
    ...(existing && typeof existing === 'object' ? existing : {}),
    ...patch,
  }
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    scheduling: buildMatchSchemaPatch({
      ...(currentMatch && typeof currentMatch === 'object' ? currentMatch : {}),
      scheduling: nextScheduling,
    }).scheduling,
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
  return summarizeMatchSchemaBackfill(snapshot.val())
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
  return summarizeTeamMatchSchemaBackfill(snapshot.val())
}
