function getNestedMatchIDs(value) {
  if (!value || typeof value !== 'object') {
    return []
  }

  const matchIDs = []
  for (const candidate of Object.values(value)) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      matchIDs.push(candidate)
      continue
    }

    if (candidate && typeof candidate === 'object') {
      const record = candidate
      if (typeof record.matchID === 'string' && record.matchID.length > 0) {
        matchIDs.push(record.matchID)
      }
    }
  }

  return matchIDs
}

export function collectTableDependentMatchIDs(tableRecord) {
  const currentMatchID = typeof tableRecord?.currentMatch === 'string' ? tableRecord.currentMatch : ''

  return Array.from(new Set([
    currentMatchID,
    ...getNestedMatchIDs(tableRecord?.scheduledMatches),
    ...getNestedMatchIDs(tableRecord?.archivedMatches),
    ...getNestedMatchIDs(tableRecord?.previousMatches),
  ].filter(Boolean)))
}

export function collectTeamMatchDependentMatchIDs(teamMatchRecord) {
  return Array.from(new Set([
    ...getNestedMatchIDs(teamMatchRecord?.currentMatches),
    ...getNestedMatchIDs(teamMatchRecord?.scheduledMatches),
    ...getNestedMatchIDs(teamMatchRecord?.archivedMatches),
  ].filter(Boolean)))
}
