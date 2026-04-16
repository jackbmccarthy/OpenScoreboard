import db from '@/lib/database'
import {
  MATCH_SCHEMA_VERSION,
  buildMatchSchemaPatch,
  buildMatchTournamentCompatibilityPatch,
  buildScheduledMatchTournamentCompatibilityPatch,
  buildTeamMatchSchemaPatch,
  buildTeamMatchTournamentCompatibilityPatch,
  createNormalizedGames,
  normalizeMatchSchema,
  normalizeTeamMatchSchema,
  resolveTournamentCompatibilityFields,
  summarizeMatchSchemaBackfill,
  summarizeTeamMatchSchemaBackfill,
} from '@/schema/matchSchemaBridge.js'

export {
  MATCH_SCHEMA_VERSION,
  buildMatchSchemaPatch,
  buildMatchTournamentCompatibilityPatch,
  buildScheduledMatchTournamentCompatibilityPatch,
  buildTeamMatchSchemaPatch,
  buildTeamMatchTournamentCompatibilityPatch,
  createNormalizedGames,
  normalizeMatchSchema,
  normalizeTeamMatchSchema,
  resolveTournamentCompatibilityFields,
}

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
type TournamentCompatibilityPatch = Partial<ReturnType<typeof resolveTournamentCompatibilityFields>>

const TOURNAMENT_COMPATIBILITY_KEYS = [
  'tournamentID',
  'eventID',
  'roundID',
  'bracketNodeID',
  'teamMatchID',
  'scheduleBlockID',
  'matchRound',
  'eventName',
] as const

function buildRoundLookup(
  tournaments: Record<string, unknown>,
) {
  const roundLookup = new Map<string, { tournamentID: string; eventID: string; title: string }>()
  const eventLookup = new Map<string, { tournamentID: string; name: string }>()

  Object.entries(tournaments).forEach(([tournamentID, tournamentValue]) => {
    if (!tournamentValue || typeof tournamentValue !== 'object') {
      return
    }

    const tournament = tournamentValue as Record<string, unknown>
    const rounds = tournament.rounds && typeof tournament.rounds === 'object'
      ? tournament.rounds as Record<string, Record<string, unknown>>
      : {}
    const events = tournament.events && typeof tournament.events === 'object'
      ? tournament.events as Record<string, Record<string, unknown>>
      : {}

    Object.entries(rounds).forEach(([roundID, roundValue]) => {
      roundLookup.set(roundID, {
        tournamentID,
        eventID: typeof roundValue?.eventID === 'string' ? roundValue.eventID : '',
        title: typeof roundValue?.title === 'string' ? roundValue.title : '',
      })
    })

    Object.entries(events).forEach(([eventID, eventValue]) => {
      eventLookup.set(eventID, {
        tournamentID,
        name: typeof eventValue?.name === 'string' ? eventValue.name : '',
      })
    })
  })

  return { roundLookup, eventLookup }
}

function fillMissingTournamentCompatibility(
  current: ReturnType<typeof resolveTournamentCompatibilityFields>,
  candidate: TournamentCompatibilityPatch | null | undefined,
) {
  if (!candidate) {
    return current
  }

  const next = { ...current }
  for (const key of TOURNAMENT_COMPATIBILITY_KEYS) {
    const candidateValue = typeof candidate[key] === 'string' ? candidate[key] : ''
    if (!next[key] && candidateValue) {
      next[key] = candidateValue
    }
  }
  return next
}

function hasTournamentCompatibilityChanges(
  current: ReturnType<typeof resolveTournamentCompatibilityFields>,
  next: ReturnType<typeof resolveTournamentCompatibilityFields>,
) {
  return TOURNAMENT_COMPATIBILITY_KEYS.some((key) => current[key] !== next[key])
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

export async function syncMatchTournamentCompatibility(
  matchID: string,
  overrides: TournamentCompatibilityPatch = {},
  match?: MatchLike | null,
  refFactory?: RefFactory,
) {
  const currentMatch = match || (await db.ref(`matches/${matchID}`).get()).val()
  if (!currentMatch || typeof currentMatch !== 'object') {
    return null
  }

  const patch = buildMatchTournamentCompatibilityPatch(currentMatch, overrides)
  const ref = refFactory ? refFactory(`matches/${matchID}`) : db.ref(`matches/${matchID}`)
  await ref.update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentID: patch.tournamentID,
    eventID: patch.eventID,
    roundID: patch.roundID,
    bracketNodeID: patch.bracketNodeID,
    teamMatchID: patch.teamMatchID,
    matchRound: patch.matchRound,
    eventName: patch.eventName,
    tournamentContext: patch.tournamentContext,
    context: patch.context,
  })
  await syncMatchSchemaFromFlat(matchID, {
    ...currentMatch,
    ...patch,
  })
  return patch
}

export async function syncTeamMatchTournamentCompatibility(
  teamMatchID: string,
  overrides: TournamentCompatibilityPatch = {},
  teamMatch?: TeamMatchLike | null,
) {
  const currentTeamMatch = teamMatch || (await db.ref(`teamMatches/${teamMatchID}`).get()).val()
  if (!currentTeamMatch || typeof currentTeamMatch !== 'object') {
    return null
  }

  const patch = buildTeamMatchTournamentCompatibilityPatch(currentTeamMatch, overrides)
  await db.ref(`teamMatches/${teamMatchID}`).update({
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentID: patch.tournamentID,
    eventID: patch.eventID,
    roundID: patch.roundID,
    teamMatchID: patch.teamMatchID,
    matchRound: patch.matchRound,
    eventName: patch.eventName,
    tournamentContext: patch.tournamentContext,
    context: patch.context,
  })
  await syncTeamMatchSchema(teamMatchID, {
    ...currentTeamMatch,
    ...patch,
  })
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
  const [matchSnapshot, teamMatchSnapshot, tableSnapshot, tournamentSnapshot] = await Promise.all([
    db.ref('matches').get(),
    db.ref('teamMatches').get(),
    db.ref('tables').get(),
    db.ref('tournaments').get(),
  ])
  const matches = matchSnapshot.val()
  if (!matches || typeof matches !== 'object') {
    return { updated: 0 }
  }

  const teamMatches = teamMatchSnapshot.val() && typeof teamMatchSnapshot.val() === 'object'
    ? teamMatchSnapshot.val() as Record<string, Record<string, unknown>>
    : {}
  const tables = tableSnapshot.val() && typeof tableSnapshot.val() === 'object'
    ? tableSnapshot.val() as Record<string, Record<string, unknown>>
    : {}
  const tournaments = tournamentSnapshot.val() && typeof tournamentSnapshot.val() === 'object'
    ? tournamentSnapshot.val() as Record<string, unknown>
    : {}
  const { roundLookup, eventLookup } = buildRoundLookup(tournaments)

  const teamMatchContextByMatchID = new Map<string, TournamentCompatibilityPatch>()
  Object.entries(teamMatches).forEach(([teamMatchID, teamMatch]) => {
    const resolved = resolveTournamentCompatibilityFields({
      ...(teamMatch || {}),
      teamMatchID,
    })
    const currentMatches = teamMatch?.currentMatches && typeof teamMatch.currentMatches === 'object'
      ? teamMatch.currentMatches as Record<string, string>
      : {}
    Object.values(currentMatches).forEach((matchID) => {
      if (typeof matchID === 'string' && matchID) {
        teamMatchContextByMatchID.set(matchID, resolved)
      }
    })
  })

  const scheduledContextByMatchID = new Map<string, TournamentCompatibilityPatch>()
  Object.values(tables).forEach((table) => {
    const scheduledMatches = table?.scheduledMatches && typeof table.scheduledMatches === 'object'
      ? table.scheduledMatches as Record<string, Record<string, unknown>>
      : {}
    Object.values(scheduledMatches).forEach((scheduledMatch) => {
      const matchID = typeof scheduledMatch?.matchID === 'string' ? scheduledMatch.matchID : ''
      if (matchID) {
        scheduledContextByMatchID.set(matchID, resolveTournamentCompatibilityFields(scheduledMatch))
      }
    })
  })

  const tournamentBlockContextByMatchID = new Map<string, TournamentCompatibilityPatch>()
  Object.entries(tournaments).forEach(([tournamentID, tournamentValue]) => {
    if (!tournamentValue || typeof tournamentValue !== 'object') {
      return
    }
    const tournamentRecord = tournamentValue as Record<string, unknown>
    const scheduleBlocks = tournamentRecord.scheduleBlocks && typeof tournamentRecord.scheduleBlocks === 'object'
      ? tournamentRecord.scheduleBlocks as Record<string, Record<string, unknown>>
      : {}
    Object.entries(scheduleBlocks).forEach(([scheduleBlockID, scheduleBlock]) => {
      const matchID = typeof scheduleBlock?.sourceMatchID === 'string' ? scheduleBlock.sourceMatchID : ''
      if (matchID) {
        tournamentBlockContextByMatchID.set(matchID, resolveTournamentCompatibilityFields({
          tournamentID,
          scheduleBlockID,
          ...scheduleBlock,
        }))
      }
    })
  })

  let updated = 0
  for (const [matchID, match] of Object.entries(matches)) {
    if (!match || typeof match !== 'object') {
      continue
    }

    const current = resolveTournamentCompatibilityFields(match)
    let next = { ...current }
    next = fillMissingTournamentCompatibility(next, teamMatchContextByMatchID.get(matchID))
    next = fillMissingTournamentCompatibility(next, scheduledContextByMatchID.get(matchID))
    next = fillMissingTournamentCompatibility(next, tournamentBlockContextByMatchID.get(matchID))

    const linkedTeamMatchID = next.teamMatchID || current.teamMatchID
    if (linkedTeamMatchID && teamMatches[linkedTeamMatchID]) {
      next = fillMissingTournamentCompatibility(next, resolveTournamentCompatibilityFields({
        ...(teamMatches[linkedTeamMatchID] || {}),
        teamMatchID: linkedTeamMatchID,
      }))
    }

    const linkedRound = next.roundID ? roundLookup.get(next.roundID) : undefined
    if (linkedRound) {
      next = fillMissingTournamentCompatibility(next, {
        tournamentID: linkedRound.tournamentID,
        eventID: linkedRound.eventID,
        matchRound: linkedRound.title,
      })
    }

    const linkedEvent = next.eventID ? eventLookup.get(next.eventID) : undefined
    if (linkedEvent) {
      next = fillMissingTournamentCompatibility(next, {
        tournamentID: linkedEvent.tournamentID,
        eventName: linkedEvent.name,
      })
    }

    if (hasTournamentCompatibilityChanges(current, next)) {
      await syncMatchTournamentCompatibility(matchID, next, match as MatchLike)
    } else {
      await syncMatchSchemaFromFlat(matchID, match as MatchLike)
    }
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
