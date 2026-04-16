export const MATCH_SCHEMA_VERSION = 3
export const MATCH_GAME_NUMBERS = Array.from({ length: 9 }, (_, index) => index + 1)

function asRecord(value) {
  return value && typeof value === 'object' ? value : {}
}

function asString(value) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value) {
  return Boolean(value)
}

function getExistingGame(match, gameNumber) {
  const existingGames = asRecord(match.games)
  return asRecord(existingGames[gameNumber] ?? existingGames[String(gameNumber)])
}

function getExistingPointHistory(match) {
  return asRecord(match.pointHistory)
}

function getExistingAuditTrail(match) {
  return asRecord(match.auditTrail)
}

function getGameStatus(match, gameNumber) {
  const existingGame = getExistingGame(match, gameNumber)

  if (existingGame.deleted) {
    return 'deleted'
  }
  if (match[`isGame${gameNumber}Finished`]) {
    return 'completed'
  }
  if (match[`isGame${gameNumber}Started`]) {
    return 'in_progress'
  }
  return 'not_started'
}

function getGameWinner(match, gameNumber) {
  if (!match[`isGame${gameNumber}Finished`]) {
    return null
  }

  const scoreA = asNumber(match[`game${gameNumber}AScore`])
  const scoreB = asNumber(match[`game${gameNumber}BScore`])
  if (scoreA === scoreB) {
    return null
  }
  return scoreA > scoreB ? 'A' : 'B'
}

function buildLegacyGameFieldMap(gameNumber) {
  return {
    scoreA: `game${gameNumber}AScore`,
    scoreB: `game${gameNumber}BScore`,
    started: `isGame${gameNumber}Started`,
    finished: `isGame${gameNumber}Finished`,
    startedAt: `game${gameNumber}StartTime`,
    endedAt: `game${gameNumber}EndTime`,
  }
}

function normalizePointHistory(match) {
  const pointHistory = getExistingPointHistory(match)

  return Object.fromEntries(Object.entries(pointHistory).map(([eventID, event], index) => {
    const rawEvent = asRecord(event)
    const action = asString(rawEvent.action || rawEvent.eventType)
    const gameNumber = asNumber(rawEvent.gameNumber, 0)
    const side = rawEvent.side === 'B' ? 'B' : rawEvent.side === 'A' ? 'A' : undefined
    const scoreA = asNumber(rawEvent.scoreA)
    const scoreB = asNumber(rawEvent.scoreB)
    const delta = {
      a: action === 'point_added' && side === 'A' ? 1 : action === 'point_removed' && side === 'A' ? -1 : 0,
      b: action === 'point_added' && side === 'B' ? 1 : action === 'point_removed' && side === 'B' ? -1 : 0,
    }

    return [eventID, {
      ...rawEvent,
      schemaVersion: MATCH_SCHEMA_VERSION,
      eventID,
      eventType: action,
      createdAt: asString(rawEvent.createdAt),
      sequence: asNumber(rawEvent.sequence, index + 1),
      gameNumber,
      side,
      score: {
        a: scoreA,
        b: scoreB,
      },
      delta,
      undone: asBoolean(rawEvent.undone),
      source: asString(rawEvent.source || 'legacy-bridge'),
      payload: asRecord(rawEvent.payload),
      metadata: asRecord(rawEvent.metadata),
    }]
  }))
}

function normalizeAuditTrail(auditTrail) {
  const trail = asRecord(auditTrail)

  return Object.fromEntries(Object.entries(trail).map(([eventID, event], index) => {
    const rawEvent = asRecord(event)
    const payload = asRecord(rawEvent.payload)
    const action = asString(rawEvent.action || rawEvent.eventType)
    const gameNumber = asNumber(rawEvent.gameNumber || payload.gameNumber, 0)

    return [eventID, {
      ...rawEvent,
      schemaVersion: MATCH_SCHEMA_VERSION,
      eventID,
      eventType: action,
      createdAt: asString(rawEvent.createdAt),
      sequence: asNumber(rawEvent.sequence, index + 1),
      scope: asString(rawEvent.scope || (gameNumber > 0 ? 'game' : 'match')),
      gameNumber,
      source: asString(rawEvent.source || 'legacy-bridge'),
      payload,
      metadata: asRecord(rawEvent.metadata),
    }]
  }))
}

function buildGamePointHistoryRefs(pointHistory, gameNumber) {
  return Object.keys(pointHistory).filter((eventID) => asNumber(pointHistory[eventID]?.gameNumber, 0) === gameNumber)
}

function buildGameAuditRefs(auditTrail, gameNumber) {
  return Object.keys(auditTrail).filter((eventID) => asNumber(auditTrail[eventID]?.gameNumber, 0) === gameNumber)
}

function buildMatchGameEntry(match, gameNumber, pointHistory, auditTrail) {
  const existingGame = getExistingGame(match, gameNumber)
  const existingRules = asRecord(existingGame.rules)
  const existingMetadata = asRecord(existingGame.metadata)
  const existingReferences = asRecord(existingGame.references)
  const legacyFields = buildLegacyGameFieldMap(gameNumber)

  return {
    ...existingGame,
    schemaVersion: MATCH_SCHEMA_VERSION,
    gameNumber,
    status: getGameStatus(match, gameNumber),
    winner: getGameWinner(match, gameNumber),
    scoreA: asNumber(match[legacyFields.scoreA]),
    scoreB: asNumber(match[legacyFields.scoreB]),
    startedAt: asString(match[legacyFields.startedAt]),
    endedAt: asString(match[legacyFields.endedAt]),
    deleted: asBoolean(existingGame.deleted),
    deletedAt: asString(existingGame.deletedAt),
    legacy: legacyFields,
    references: {
      ...existingReferences,
      pointHistoryIDs: existingReferences.pointHistoryIDs || buildGamePointHistoryRefs(pointHistory, gameNumber),
      auditEventIDs: existingReferences.auditEventIDs || buildGameAuditRefs(auditTrail, gameNumber),
    },
    rules: {
      ...existingRules,
      sportName: asString(match.sportName),
      scoringType: asString(match.scoringType),
      pointsToWinGame: asNumber(match.pointsToWinGame),
      changeServeEveryXPoints: asNumber(match.changeServeEveryXPoints),
      enforceGameScore: asBoolean(match.enforceGameScore),
      isManualServiceMode: asBoolean(match.isManualServiceMode),
      isDoubles: asBoolean(match.isDoubles),
    },
    metadata: {
      ...existingMetadata,
      significantPoints: asRecord(match.significantPoints),
    },
  }
}

export function createNormalizedGames(match) {
  const pointHistory = normalizePointHistory(match)
  const auditTrail = normalizeAuditTrail(getExistingAuditTrail(match))

  return Object.fromEntries(MATCH_GAME_NUMBERS.map((gameNumber) => [
    gameNumber,
    buildMatchGameEntry(match, gameNumber, pointHistory, auditTrail),
  ]))
}

function buildTournamentContext(match) {
  const existing = asRecord(match.tournamentContext)
  const compatContext = Object.keys(existing).length > 0 ? existing : asRecord(match.context)
  const labels = {
    matchRound: asString(compatContext.matchRound || match.matchRound),
    eventName: asString(compatContext.eventName || match.eventName),
  }
  const refs = {
    tournamentID: asString(compatContext.tournamentID || match.tournamentID),
    eventID: asString(compatContext.eventID || match.eventID),
    roundID: asString(compatContext.roundID || match.roundID),
    bracketNodeID: asString(compatContext.bracketNodeID || match.bracketNodeID),
    teamMatchID: asString(compatContext.teamMatchID || match.teamMatchID),
    scheduleBlockID: asString(compatContext.scheduleBlockID),
  }

  return {
    ...compatContext,
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentID: refs.tournamentID,
    eventID: refs.eventID,
    roundID: refs.roundID,
    bracketNodeID: refs.bracketNodeID,
    teamMatchID: refs.teamMatchID,
    matchRound: labels.matchRound,
    eventName: labels.eventName,
    refs,
    labels,
    metadata: asRecord(compatContext.metadata),
  }
}

function buildSchedulingMetadata(match) {
  const existing = asRecord(match.scheduling)
  const assignment = {
    tableID: asString(existing.tableID || match.tableID),
    tableNumber: asString(existing.tableNumber || match.tableNumber),
    teamMatchID: asString(existing.teamMatchID || match.teamMatchID),
    queueItemID: asString(existing.queueItemID),
  }
  const queue = {
    scheduledMatchID: asString(existing.scheduledMatchID || match.scheduledMatchID),
    queueItemID: assignment.queueItemID,
    position: asNumber(existing.queuePosition, 0),
  }
  const timing = {
    scheduledStartTime: asString(existing.scheduledStartTime || match.startTime),
    scheduledEndTime: asString(existing.scheduledEndTime),
    matchStartTime: asString(existing.matchStartTime || match.matchStartTime),
  }
  const refs = {
    sourceType: asString(existing.sourceType),
    sourceID: asString(existing.sourceID),
    scheduleBlockID: asString(existing.scheduleBlockID),
  }

  return {
    ...existing,
    schemaVersion: MATCH_SCHEMA_VERSION,
    scheduledStartTime: timing.scheduledStartTime,
    scheduledEndTime: timing.scheduledEndTime,
    scheduledMatchID: queue.scheduledMatchID,
    matchStartTime: timing.matchStartTime,
    tableID: assignment.tableID,
    teamMatchID: assignment.teamMatchID,
    tableNumber: assignment.tableNumber,
    queueItemID: queue.queueItemID,
    sourceType: refs.sourceType,
    sourceID: refs.sourceID,
    assignment,
    queue,
    timing,
    refs,
    metadata: asRecord(existing.metadata),
  }
}

export function buildMatchSchemaPatch(match) {
  const pointHistory = normalizePointHistory(match)
  const auditTrail = normalizeAuditTrail(getExistingAuditTrail(match))
  const existingGames = asRecord(match.games)
  const existingScoringRules = asRecord(match.scoringRules)
  const tournamentContext = buildTournamentContext(match)
  const scheduling = buildSchedulingMetadata(match)

  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    games: {
      ...existingGames,
      ...Object.fromEntries(MATCH_GAME_NUMBERS.map((gameNumber) => [
        gameNumber,
        buildMatchGameEntry(match, gameNumber, pointHistory, auditTrail),
      ])),
    },
    pointHistory,
    auditTrail,
    tournamentContext,
    context: tournamentContext,
    scheduling,
    scoringRules: {
      ...existingScoringRules,
      schemaVersion: MATCH_SCHEMA_VERSION,
      sportName: asString(match.sportName),
      scoringType: asString(match.scoringType),
      bestOf: asNumber(match.bestOf),
      pointsToWinGame: asNumber(match.pointsToWinGame),
      changeServeEveryXPoints: asNumber(match.changeServeEveryXPoints),
      enforceGameScore: asBoolean(match.enforceGameScore),
      isManualServiceMode: asBoolean(match.isManualServiceMode),
      isDoubles: asBoolean(match.isDoubles),
      legacy: {
        bestOfField: 'bestOf',
        pointsToWinGameField: 'pointsToWinGame',
        changeServeEveryXPointsField: 'changeServeEveryXPoints',
        enforceGameScoreField: 'enforceGameScore',
        isManualServiceModeField: 'isManualServiceMode',
        sportNameField: 'sportName',
        scoringTypeField: 'scoringType',
      },
    },
  }
}

export function normalizeMatchSchema(match) {
  if (!match || typeof match !== 'object') {
    return null
  }

  return {
    ...match,
    ...buildMatchSchemaPatch(match),
  }
}

function buildTeamMatchTables(teamMatch) {
  const currentMatches = asRecord(teamMatch.currentMatches)
  const scheduledMatches = asRecord(teamMatch.scheduledMatches)
  const archivedMatches = asRecord(teamMatch.archivedMatches)
  const existingTables = asRecord(teamMatch.tables)
  const tableNumbers = new Set([
    ...Object.keys(currentMatches),
    ...Object.keys(existingTables),
    ...Object.values(archivedMatches).map((entry) => asString(entry?.tableNumber)).filter(Boolean),
  ])

  return Object.fromEntries(Array.from(tableNumbers).sort().map((tableNumber) => {
    const existingTable = asRecord(existingTables[tableNumber])
    const archivedEntries = Object.entries(archivedMatches)
      .filter(([, archivedMatch]) => asString(archivedMatch?.tableNumber) === tableNumber)
      .map(([archivedMatchID, archivedMatch]) => [archivedMatchID, archivedMatch])

    const scheduledEntries = Object.entries(scheduledMatches).filter(([, scheduledMatch]) => {
      if (typeof scheduledMatch === 'string') {
        return tableNumber === '1'
      }

      const candidate = asRecord(scheduledMatch)
      return asString(candidate.tableNumber) === tableNumber
    })

    const currentMatchID = asString(currentMatches[tableNumber])
    const status = currentMatchID
      ? 'active'
      : scheduledEntries.length > 0
        ? 'queued'
        : archivedEntries.length > 0
          ? 'completed'
          : 'not_started'

    return [tableNumber, {
      ...existingTable,
      schemaVersion: MATCH_SCHEMA_VERSION,
      tableNumber,
      currentMatchID,
      scheduledMatchIDs: scheduledEntries.map(([scheduledMatchID]) => scheduledMatchID),
      archivedMatchIDs: archivedEntries.map(([archivedMatchID]) => archivedMatchID),
      archivedMatches: Object.fromEntries(archivedEntries),
      status,
      metadata: asRecord(existingTable.metadata),
    }]
  }))
}

export function buildTeamMatchSchemaPatch(teamMatch) {
  const existingTournamentContext = asRecord(teamMatch.tournamentContext)
  const compatContext = Object.keys(existingTournamentContext).length > 0
    ? existingTournamentContext
    : asRecord(teamMatch.context)
  const existingScheduling = asRecord(teamMatch.scheduling)
  const auditTrail = normalizeAuditTrail(getExistingAuditTrail(teamMatch))
  const tournamentContext = {
    ...compatContext,
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentID: asString(compatContext.tournamentID || teamMatch.tournamentID),
    eventID: asString(compatContext.eventID || teamMatch.eventID),
    roundID: asString(compatContext.roundID || teamMatch.roundID),
    matchRound: asString(compatContext.matchRound || teamMatch.matchRound),
    eventName: asString(compatContext.eventName || teamMatch.eventName),
    refs: {
      tournamentID: asString(compatContext.tournamentID || teamMatch.tournamentID),
      eventID: asString(compatContext.eventID || teamMatch.eventID),
      roundID: asString(compatContext.roundID || teamMatch.roundID),
      teamMatchID: asString(compatContext.teamMatchID || teamMatch.teamMatchID),
    },
    labels: {
      matchRound: asString(compatContext.matchRound || teamMatch.matchRound),
      eventName: asString(compatContext.eventName || teamMatch.eventName),
    },
    metadata: asRecord(compatContext.metadata),
  }
  const scheduling = {
    ...existingScheduling,
    schemaVersion: MATCH_SCHEMA_VERSION,
    scheduledMatches: asRecord(existingScheduling.scheduledMatches || teamMatch.scheduledMatches),
    currentMatches: asRecord(existingScheduling.currentMatches || teamMatch.currentMatches),
    startTime: asString(existingScheduling.startTime || teamMatch.startTime),
    teamMatchID: asString(existingScheduling.teamMatchID || teamMatch.teamMatchID),
    assignment: {
      teamMatchID: asString(existingScheduling.teamMatchID || teamMatch.teamMatchID),
    },
    queue: {
      scheduledMatchCount: Object.keys(asRecord(existingScheduling.scheduledMatches || teamMatch.scheduledMatches)).length,
    },
    timing: {
      scheduledStartTime: asString(existingScheduling.startTime || teamMatch.startTime),
    },
    metadata: asRecord(existingScheduling.metadata),
  }

  return {
    schemaVersion: MATCH_SCHEMA_VERSION,
    tournamentContext,
    context: tournamentContext,
    scheduling,
    auditTrail,
    tables: buildTeamMatchTables(teamMatch),
  }
}

export function normalizeTeamMatchSchema(teamMatch) {
  if (!teamMatch || typeof teamMatch !== 'object') {
    return null
  }

  return {
    ...teamMatch,
    ...buildTeamMatchSchemaPatch(teamMatch),
  }
}

export function summarizeMatchSchemaBackfill(matches) {
  const records = asRecord(matches)
  const summary = {
    total: 0,
    needsBackfill: 0,
    missingSchemaVersion: 0,
    missingGames: 0,
    missingPointHistory: 0,
    missingAuditTrail: 0,
    missingTournamentContext: 0,
    missingScheduling: 0,
  }

  for (const match of Object.values(records)) {
    if (!match || typeof match !== 'object') {
      continue
    }

    summary.total += 1
    const hasSchemaVersion = typeof match.schemaVersion === 'number' && match.schemaVersion >= MATCH_SCHEMA_VERSION
    const hasGames = match.games && typeof match.games === 'object'
    const hasPointHistory = match.pointHistory && typeof match.pointHistory === 'object'
    const hasAuditTrail = match.auditTrail && typeof match.auditTrail === 'object'
    const hasTournamentContext = (match.tournamentContext && typeof match.tournamentContext === 'object')
      || (match.context && typeof match.context === 'object')
    const hasScheduling = match.scheduling && typeof match.scheduling === 'object'

    if (!hasSchemaVersion || !hasGames || !hasPointHistory || !hasAuditTrail || !hasTournamentContext || !hasScheduling) {
      summary.needsBackfill += 1
    }
    if (!hasSchemaVersion) {
      summary.missingSchemaVersion += 1
    }
    if (!hasGames) {
      summary.missingGames += 1
    }
    if (!hasPointHistory) {
      summary.missingPointHistory += 1
    }
    if (!hasAuditTrail) {
      summary.missingAuditTrail += 1
    }
    if (!hasTournamentContext) {
      summary.missingTournamentContext += 1
    }
    if (!hasScheduling) {
      summary.missingScheduling += 1
    }
  }

  return summary
}

export function summarizeTeamMatchSchemaBackfill(teamMatches) {
  const records = asRecord(teamMatches)
  const summary = {
    total: 0,
    needsBackfill: 0,
    missingSchemaVersion: 0,
    missingAuditTrail: 0,
    missingTournamentContext: 0,
    missingScheduling: 0,
    missingTables: 0,
  }

  for (const teamMatch of Object.values(records)) {
    if (!teamMatch || typeof teamMatch !== 'object') {
      continue
    }

    summary.total += 1
    const hasSchemaVersion = typeof teamMatch.schemaVersion === 'number' && teamMatch.schemaVersion >= MATCH_SCHEMA_VERSION
    const hasAuditTrail = teamMatch.auditTrail && typeof teamMatch.auditTrail === 'object'
    const hasTournamentContext = (teamMatch.tournamentContext && typeof teamMatch.tournamentContext === 'object')
      || (teamMatch.context && typeof teamMatch.context === 'object')
    const hasScheduling = teamMatch.scheduling && typeof teamMatch.scheduling === 'object'
    const hasTables = teamMatch.tables && typeof teamMatch.tables === 'object'

    if (!hasSchemaVersion || !hasAuditTrail || !hasTournamentContext || !hasScheduling || !hasTables) {
      summary.needsBackfill += 1
    }
    if (!hasSchemaVersion) {
      summary.missingSchemaVersion += 1
    }
    if (!hasAuditTrail) {
      summary.missingAuditTrail += 1
    }
    if (!hasTournamentContext) {
      summary.missingTournamentContext += 1
    }
    if (!hasScheduling) {
      summary.missingScheduling += 1
    }
    if (!hasTables) {
      summary.missingTables += 1
    }
  }

  return summary
}
