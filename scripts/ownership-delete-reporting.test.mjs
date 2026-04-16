import test from 'node:test'
import assert from 'node:assert/strict'

import {
  collectTableDependentMatchIDs,
  collectTeamMatchDependentMatchIDs,
} from '../src/ownership/dependents.js'
import {
  getDeleteImpactItems,
  getDeleteRetentionText,
} from '../src/ownership/deleteReporting.js'

test('collectTableDependentMatchIDs includes archived and previous match references', () => {
  const matchIDs = collectTableDependentMatchIDs({
    currentMatch: 'match-current',
    scheduledMatches: {
      queueA: { matchID: 'match-scheduled' },
      queueB: 'match-inline',
    },
    archivedMatches: {
      archiveA: { matchID: 'match-archived' },
    },
    previousMatches: {
      prevA: { matchID: 'match-previous' },
      prevB: 'match-inline',
    },
  })

  assert.deepEqual(matchIDs, [
    'match-current',
    'match-scheduled',
    'match-inline',
    'match-archived',
    'match-previous',
  ])
})

test('collectTeamMatchDependentMatchIDs includes archived matches', () => {
  const matchIDs = collectTeamMatchDependentMatchIDs({
    currentMatches: {
      1: 'match-current',
    },
    scheduledMatches: {
      queueA: { matchID: 'match-scheduled' },
    },
    archivedMatches: {
      archiveA: { matchID: 'match-archived' },
    },
  })

  assert.deepEqual(matchIDs, [
    'match-current',
    'match-scheduled',
    'match-archived',
  ])
})

test('getDeleteImpactItems builds dry-run impact copy from dependent ids', () => {
  const items = getDeleteImpactItems({
    entityType: 'table',
    dependentIDs: {
      matches: ['match-1', 'match-2'],
      dynamicURLs: ['dyn-1'],
      revokedCapabilityTokenIDs: ['cap-1', 'cap-2', 'cap-3'],
    },
  })

  assert.deepEqual(items, [
    'Archive 2 canonical matches.',
    'Archive 1 dynamic URL.',
    'Revoke 3 capability links.',
  ])
})

test('getDeleteRetentionText reflects ownership policy retention', () => {
  assert.equal(
    getDeleteRetentionText('scoreboardTemplate'),
    'Recovery window: 60 days. Permanent purge tooling should only run after a fresh dry-run.',
  )
})
