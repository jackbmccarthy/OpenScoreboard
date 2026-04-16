function getCurrentGameNumber(match) {
  if (!match || typeof match !== 'object') {
    return 1
  }

  for (let gameNumber = 1; gameNumber <= 9; gameNumber += 1) {
    if (!match[`isGame${gameNumber}Finished`]) {
      return gameNumber
    }
  }

  return 1
}

export function resolveActiveTableNumber({ availableTableNumbers, preferredTableNumber, currentTableNumber }) {
  const normalizedTableNumbers = Array.from(new Set((availableTableNumbers || []).filter(Boolean)))

  if (preferredTableNumber && normalizedTableNumbers.includes(preferredTableNumber)) {
    return preferredTableNumber
  }

  if (currentTableNumber && normalizedTableNumbers.includes(currentTableNumber)) {
    return currentTableNumber
  }

  return normalizedTableNumbers[0] || preferredTableNumber || currentTableNumber || '1'
}

export function createOptimisticPointUpdate(match, matchID, side, increment) {
  if (!match || !matchID) {
    return null
  }

  const gameNumber = getCurrentGameNumber(match)
  const scoreKey = `game${gameNumber}${side}Score`
  const baselineScore = Number(match[scoreKey] || 0)
  const expectedScore = Math.max(0, baselineScore + (increment ? 1 : -1))

  return {
    matchID,
    side,
    increment,
    gameNumber,
    scoreKey,
    baselineScore,
    expectedScore,
    optimisticMatch: {
      ...match,
      isMatchStarted: true,
      [`isGame${gameNumber}Started`]: true,
      [scoreKey]: expectedScore,
    },
  }
}

export function reconcileOptimisticPointUpdate({ pendingPointUpdate, canonicalMatch, currentMatchID }) {
  if (!pendingPointUpdate) {
    return {
      status: 'idle',
      optimisticMatch: null,
      pendingPointUpdate: null,
      message: '',
    }
  }

  if (!currentMatchID || currentMatchID !== pendingPointUpdate.matchID) {
    return {
      status: 'resolved',
      optimisticMatch: null,
      pendingPointUpdate: null,
      message: '',
    }
  }

  if (!canonicalMatch) {
    return {
      status: 'pending',
      optimisticMatch: pendingPointUpdate.optimisticMatch,
      pendingPointUpdate,
      message: '',
    }
  }

  const canonicalScore = Number(canonicalMatch[pendingPointUpdate.scoreKey] || 0)
  if (canonicalScore === pendingPointUpdate.expectedScore) {
    return {
      status: 'resolved',
      optimisticMatch: null,
      pendingPointUpdate: null,
      message: '',
    }
  }

  if (canonicalScore !== pendingPointUpdate.baselineScore) {
    return {
      status: 'conflict',
      optimisticMatch: null,
      pendingPointUpdate: null,
      message: 'Another scorer updated the match before your point was confirmed.',
    }
  }

  return {
    status: 'pending',
    optimisticMatch: pendingPointUpdate.optimisticMatch,
    pendingPointUpdate,
    message: '',
  }
}
