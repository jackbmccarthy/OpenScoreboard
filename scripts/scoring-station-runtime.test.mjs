import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createOptimisticPointUpdate,
  reconcileOptimisticPointUpdate,
  resolveActiveTableNumber,
} from '../src/components/scoring/scoringStationRuntimeModel.js'

function createMatch(overrides = {}) {
  return {
    isMatchStarted: false,
    isGame1Started: false,
    isGame1Finished: false,
    game1AScore: 0,
    game1BScore: 0,
    ...overrides,
  }
}

test('resolveActiveTableNumber keeps the requested table when it still exists', () => {
  const resolved = resolveActiveTableNumber({
    availableTableNumbers: ['1', '2', '3'],
    preferredTableNumber: '2',
    currentTableNumber: '1',
  })

  assert.equal(resolved, '2')
})

test('resolveActiveTableNumber falls forward when the current team-match table number disappears', () => {
  const resolved = resolveActiveTableNumber({
    availableTableNumbers: ['4', '5'],
    preferredTableNumber: '2',
    currentTableNumber: '2',
  })

  assert.equal(resolved, '4')
})

test('reconcileOptimisticPointUpdate clears the optimistic overlay when the canonical score matches', () => {
  const pendingPointUpdate = createOptimisticPointUpdate(createMatch(), 'match-1', 'A', true)
  const result = reconcileOptimisticPointUpdate({
    pendingPointUpdate,
    canonicalMatch: createMatch({ game1AScore: 1, isMatchStarted: true, isGame1Started: true }),
    currentMatchID: 'match-1',
  })

  assert.equal(result.status, 'resolved')
  assert.equal(result.optimisticMatch, null)
  assert.equal(result.pendingPointUpdate, null)
})

test('reconcileOptimisticPointUpdate reports conflict when another scorer changes the same match first', () => {
  const pendingPointUpdate = createOptimisticPointUpdate(createMatch(), 'match-1', 'A', true)
  const result = reconcileOptimisticPointUpdate({
    pendingPointUpdate,
    canonicalMatch: createMatch({ game1AScore: 2, isMatchStarted: true, isGame1Started: true }),
    currentMatchID: 'match-1',
  })

  assert.equal(result.status, 'conflict')
  assert.match(result.message, /Another scorer updated the match/i)
})

test('reconcileOptimisticPointUpdate drops the optimistic overlay when the active match switches live', () => {
  const pendingPointUpdate = createOptimisticPointUpdate(createMatch(), 'match-1', 'A', true)
  const result = reconcileOptimisticPointUpdate({
    pendingPointUpdate,
    canonicalMatch: createMatch({ game1AScore: 0 }),
    currentMatchID: 'match-2',
  })

  assert.equal(result.status, 'resolved')
  assert.equal(result.optimisticMatch, null)
  assert.equal(result.pendingPointUpdate, null)
})
