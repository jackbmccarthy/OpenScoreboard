const ownershipPolicies = Object.freeze({
  table: {
    entityType: 'table',
    canonicalRoot: 'tables',
    ownerField: 'creatorID',
    previewRoot: 'myTables',
    previewShape: 'string',
    retentionDays: 30,
    dependentChildPaths: [
      'tables/{tableID}/currentMatch',
      'tables/{tableID}/scheduledMatches/*',
      'tables/{tableID}/archivedMatches/*',
      'matches/* via scheduling.tableID or table.currentMatch/scheduledMatches',
    ],
    derivedSummaryPaths: [
      'tables/{tableID}/scheduledMatches',
      'tables/{tableID}/archivedMatches',
      'tables/{tableID}/currentMatch',
    ],
    publicAccessPaths: [
      'capabilityTokens/* where tableID={tableID}',
      'scoreboard/view?sid={scoreboardID}&tid={tableID}',
      'dynamicurls/* where tableID={tableID}',
    ],
  },
  match: {
    entityType: 'match',
    canonicalRoot: 'matches',
    ownerField: '',
    previewRoot: '',
    previewShape: 'none',
    retentionDays: 30,
    dependentChildPaths: [
      'matches/{matchID}/games/*',
      'matches/{matchID}/pointHistory/*',
      'matches/{matchID}/auditTrail/*',
    ],
    derivedSummaryPaths: [
      'tables/{tableID}/currentMatch',
      'tables/{tableID}/scheduledMatches/*',
      'tables/{tableID}/archivedMatches/*',
      'teamMatches/{teamMatchID}/currentMatches/*',
      'teamMatches/{teamMatchID}/archivedMatches/*',
    ],
    publicAccessPaths: [
      'capabilityTokens/* where matchID={matchID}',
    ],
  },
  team: {
    entityType: 'team',
    canonicalRoot: 'teams',
    ownerField: 'ownerID',
    previewRoot: 'myTeams',
    previewShape: 'object',
    retentionDays: 30,
    dependentChildPaths: [
      'teamMatches/* via teamAID/teamBID',
    ],
    derivedSummaryPaths: [
      'users/{uid}/myTeams/*',
      'users/{uid}/myTeamMatches/* teamAName/teamBName preview fields',
    ],
    publicAccessPaths: [],
  },
  teamMatch: {
    entityType: 'teamMatch',
    canonicalRoot: 'teamMatches',
    ownerField: 'ownerID',
    previewRoot: 'myTeamMatches',
    previewShape: 'object',
    retentionDays: 30,
    dependentChildPaths: [
      'teamMatches/{teamMatchID}/currentMatches/*',
      'teamMatches/{teamMatchID}/scheduledMatches/*',
      'teamMatches/{teamMatchID}/archivedMatches/*',
      'matches/* via scheduling.teamMatchID or teamMatch.currentMatches',
    ],
    derivedSummaryPaths: [
      'teamMatches/{teamMatchID}/currentMatches',
      'teamMatches/{teamMatchID}/archivedMatches',
      'users/{uid}/myTeamMatches/*',
    ],
    publicAccessPaths: [
      'capabilityTokens/* where teamMatchID={teamMatchID}',
      'scoreboard/view?sid={scoreboardID}&tmid={teamMatchID}&tableNumber={tableNumber}',
      'dynamicurls/* where teamMatchID={teamMatchID}',
    ],
  },
  playerList: {
    entityType: 'playerList',
    canonicalRoot: 'playerLists',
    ownerField: 'ownerID',
    previewRoot: 'myPlayerLists',
    previewShape: 'object',
    retentionDays: 30,
    dependentChildPaths: [
      'playerLists/{playerListID}/players/*',
      'tables/* via playerListID',
    ],
    derivedSummaryPaths: [
      'users/{uid}/myPlayerLists/*',
      'tables/{tableID}/playerListID',
    ],
    publicAccessPaths: [
      'capabilityTokens/* where playerListID={playerListID}',
      'playerregistration/{playerListID}',
    ],
  },
  scoreboard: {
    entityType: 'scoreboard',
    canonicalRoot: 'scoreboards',
    ownerField: 'ownerID',
    previewRoot: 'myScoreboards',
    previewShape: 'object',
    retentionDays: 30,
    dependentChildPaths: [
      'scoreboards/{scoreboardID}/config',
      'scoreboards/{scoreboardID}/web/*',
      'tables/* via scoreboardID',
      'dynamicurls/* via scoreboardID',
    ],
    derivedSummaryPaths: [
      'users/{uid}/myScoreboards/*',
      'tables/{tableID}/scoreboardID',
    ],
    publicAccessPaths: [
      'capabilityTokens/* where scoreboardID={scoreboardID}',
      'scoreboard/view?sid={scoreboardID}&tid={tableID}',
      'scoreboard/view?sid={scoreboardID}&tmid={teamMatchID}&tableNumber={tableNumber}',
      'dynamicurls/* where scoreboardID={scoreboardID}',
    ],
  },
  scoreboardTemplate: {
    entityType: 'scoreboardTemplate',
    canonicalRoot: 'scoreboardTemplates',
    ownerField: 'createdBy',
    previewRoot: '',
    previewShape: 'none',
    retentionDays: 60,
    dependentChildPaths: [
      'scoreboards/* via templateID/scoreboardTemplateID',
    ],
    derivedSummaryPaths: [
      'scoreboards/* rendered with template config compatibility fields',
    ],
    publicAccessPaths: [],
  },
  dynamicURL: {
    entityType: 'dynamicURL',
    canonicalRoot: 'dynamicurls',
    ownerField: 'ownerID',
    previewRoot: 'myDynamicURLs',
    previewShape: 'object',
    retentionDays: 14,
    dependentChildPaths: [],
    derivedSummaryPaths: [
      'users/{uid}/myDynamicURLs/*',
    ],
    publicAccessPaths: [
      'scoreboard/view?dynamicURLID={dynamicURLID}',
    ],
  },
})

export function getOwnershipPolicies() {
  return ownershipPolicies
}

export function getOwnershipPolicy(entityType) {
  return ownershipPolicies[entityType] || null
}

export function getPreviewPolicies() {
  return Object.values(ownershipPolicies).filter((policy) => Boolean(policy.previewRoot))
}

export function isRecordActive(record) {
  if (!record || typeof record !== 'object') {
    return false
  }

  return !record.deleteMode || record.deleteMode === 'active'
}

export function getPreviewCanonicalID(policy, previewValue) {
  if (!policy || !policy.previewRoot) {
    return ''
  }

  if (policy.previewShape === 'string') {
    if (typeof previewValue === 'string') {
      return previewValue
    }
    if (previewValue && typeof previewValue === 'object' && typeof previewValue.id === 'string') {
      return previewValue.id
    }
    return ''
  }

  if (previewValue && typeof previewValue === 'object' && typeof previewValue.id === 'string') {
    return previewValue.id
  }

  return ''
}

export function buildPreviewValue(entityType, canonicalID, canonicalRecord = {}) {
  switch (entityType) {
    case 'table':
      return canonicalID
    case 'team':
      return {
        id: canonicalID,
        name: canonicalRecord.teamName || canonicalRecord.name || '',
        createdOn: canonicalRecord.createdOn || canonicalRecord.updatedAt || canonicalRecord.deletedAt || new Date().toISOString(),
      }
    case 'teamMatch':
      return {
        id: canonicalID,
        teamAName: canonicalRecord.teamAName || '',
        teamBName: canonicalRecord.teamBName || '',
        startTime: canonicalRecord.startTime || '',
        sportName: canonicalRecord.sportName || '',
        sportDisplayName: canonicalRecord.sportDisplayName || '',
        scoringType: canonicalRecord.scoringType || '',
      }
    case 'playerList':
      return {
        id: canonicalID,
        playerListName: canonicalRecord.playerListName || '',
      }
    case 'scoreboard':
      return {
        id: canonicalID,
        createdOn: canonicalRecord.createdOn || canonicalRecord.updatedAt || canonicalRecord.deletedAt || new Date().toISOString(),
        name: canonicalRecord.name || '',
        type: canonicalRecord.type || 'liveStream',
      }
    case 'dynamicURL':
      return {
        id: canonicalID,
        dynamicURLName: canonicalRecord.dynamicURLName || '',
        scoreboardID: canonicalRecord.scoreboardID || '',
        tableID: canonicalRecord.tableID || '',
        teammatchID: canonicalRecord.teammatchID || canonicalRecord.teamMatchID || '',
        teamMatchID: canonicalRecord.teamMatchID || canonicalRecord.teammatchID || '',
        tableNumber: canonicalRecord.tableNumber || '',
      }
    default:
      return {
        id: canonicalID,
      }
  }
}
