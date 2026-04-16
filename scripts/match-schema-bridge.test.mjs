import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MATCH_SCHEMA_VERSION,
  buildMatchSchemaPatch,
  buildTeamMatchSchemaPatch,
  normalizeMatchSchema,
  summarizeMatchSchemaBackfill,
  summarizeTeamMatchSchemaBackfill,
} from '../src/schema/matchSchemaBridge.js'

test('normalizes flat match fields into extensible schema structures', () => {
  const normalizedMatch = normalizeMatchSchema({
    sportName: 'tableTennis',
    scoringType: 'normal',
    bestOf: 5,
    pointsToWinGame: 11,
    changeServeEveryXPoints: 2,
    enforceGameScore: true,
    isManualServiceMode: false,
    isDoubles: false,
    significantPoints: {
      sig1: 10,
    },
    teamMatchID: 'team-match-1',
    tournamentID: 'tournament-1',
    eventID: 'event-1',
    roundID: 'round-1',
    bracketNodeID: 'node-1',
    matchRound: 'Quarter Final',
    eventName: 'Open Singles',
    startTime: '2026-04-16T17:00:00.000Z',
    tableID: 'table-1',
    game1AScore: 11,
    game1BScore: 8,
    isGame1Started: true,
    isGame1Finished: true,
    game1StartTime: '2026-04-16T17:00:00.000Z',
    game1EndTime: '2026-04-16T17:09:00.000Z',
    pointHistory: {
      evt1: {
        action: 'point_added',
        createdAt: '2026-04-16T17:01:00.000Z',
        gameNumber: 1,
        side: 'A',
        scoreA: 1,
        scoreB: 0,
      },
    },
    auditTrail: {
      audit1: {
        action: 'game_started',
        createdAt: '2026-04-16T17:00:00.000Z',
        payload: {
          gameNumber: 1,
        },
      },
    },
  })

  assert.equal(normalizedMatch.schemaVersion, MATCH_SCHEMA_VERSION)
  assert.equal(normalizedMatch.games['1'].legacy.scoreA, 'game1AScore')
  assert.deepEqual(normalizedMatch.games['1'].references.pointHistoryIDs, ['evt1'])
  assert.deepEqual(normalizedMatch.games['1'].references.auditEventIDs, ['audit1'])
  assert.equal(normalizedMatch.pointHistory.evt1.eventType, 'point_added')
  assert.equal(normalizedMatch.pointHistory.evt1.delta.a, 1)
  assert.equal(normalizedMatch.auditTrail.audit1.scope, 'game')
  assert.equal(normalizedMatch.tournamentContext.refs.teamMatchID, 'team-match-1')
  assert.equal(normalizedMatch.scheduling.assignment.tableID, 'table-1')
  assert.equal(normalizedMatch.scoringRules.bestOf, 5)
})

test('builds normalized team-match table state from legacy current/scheduled/archive fields', () => {
  const patch = buildTeamMatchSchemaPatch({
    teamMatchID: 'team-match-1',
    matchRound: 'Semi Final',
    eventName: 'Mixed Doubles',
    currentMatches: {
      1: 'match-1',
      2: '',
    },
    scheduledMatches: {
      queue1: {
        tableNumber: '2',
        matchID: 'match-2',
      },
    },
    archivedMatches: {
      archived1: {
        tableNumber: '3',
        matchID: 'match-3',
      },
    },
    auditTrail: {
      audit1: {
        action: 'team_match_created',
        createdAt: '2026-04-16T17:00:00.000Z',
        payload: {},
      },
    },
  })

  assert.equal(patch.schemaVersion, MATCH_SCHEMA_VERSION)
  assert.equal(patch.tournamentContext.matchRound, 'Semi Final')
  assert.equal(patch.scheduling.teamMatchID, 'team-match-1')
  assert.equal(patch.tables['1'].currentMatchID, 'match-1')
  assert.equal(patch.tables['2'].status, 'queued')
  assert.equal(patch.tables['3'].status, 'completed')
  assert.equal(patch.auditTrail.audit1.eventType, 'team_match_created')
})

test('reports backfill gaps for legacy flat-only match and team-match records', () => {
  const matchSummary = summarizeMatchSchemaBackfill({
    legacyMatch: {
      game1AScore: 11,
      game1BScore: 9,
    },
  })

  const teamMatchSummary = summarizeTeamMatchSchemaBackfill({
    legacyTeamMatch: {
      currentMatches: { 1: 'match-1' },
    },
  })

  assert.equal(matchSummary.total, 1)
  assert.equal(matchSummary.needsBackfill, 1)
  assert.equal(matchSummary.missingGames, 1)
  assert.equal(matchSummary.missingTournamentContext, 1)
  assert.equal(teamMatchSummary.total, 1)
  assert.equal(teamMatchSummary.needsBackfill, 1)
  assert.equal(teamMatchSummary.missingTables, 1)
})

test('preserves existing normalized fields when rebuilding a patch', () => {
  const patch = buildMatchSchemaPatch({
    sportName: 'pickleball',
    scoringType: 'rally',
    pointHistory: {
      evt1: {
        action: 'point_removed',
        createdAt: '2026-04-16T17:02:00.000Z',
        gameNumber: 1,
        side: 'B',
        scoreA: 5,
        scoreB: 4,
        source: 'manual-correction',
      },
    },
    tournamentContext: {
      metadata: {
        courtZone: 'center',
      },
    },
    scheduling: {
      metadata: {
        assignedBy: 'operator-1',
      },
    },
  })

  assert.equal(patch.pointHistory.evt1.delta.b, -1)
  assert.equal(patch.pointHistory.evt1.source, 'manual-correction')
  assert.equal(patch.tournamentContext.metadata.courtZone, 'center')
  assert.equal(patch.scheduling.metadata.assignedBy, 'operator-1')
})
