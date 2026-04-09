function isRecordActive(record) {
  if (!record || typeof record !== 'object') {
    return false
  }

  return !record.deleteMode || record.deleteMode === 'active'
}

const PREVIEW_CONFIGS = [
  { entityName: 'table', canonicalRoot: 'tables', previewRoot: 'myTables' },
  { entityName: 'team', canonicalRoot: 'teams', previewRoot: 'myTeams', idField: 'id' },
  { entityName: 'teamMatch', canonicalRoot: 'teamMatches', previewRoot: 'myTeamMatches', idField: 'id' },
  { entityName: 'playerList', canonicalRoot: 'playerLists', previewRoot: 'myPlayerLists', idField: 'id' },
  { entityName: 'scoreboard', canonicalRoot: 'scoreboards', previewRoot: 'myScoreboards', idField: 'id' },
  { entityName: 'dynamicURL', canonicalRoot: 'dynamicurls', previewRoot: 'myDynamicURLs', idField: 'id' },
]

function asCollection(value) {
  return value && typeof value === 'object' ? value : {}
}

function getPreviewCanonicalID(config, previewValue) {
  if (config.idField) {
    return typeof previewValue?.[config.idField] === 'string' ? previewValue[config.idField] : ''
  }

  return typeof previewValue === 'string' ? previewValue : ''
}

function getReferencedIDs(collection, ...fieldNames) {
  const ids = new Set()

  for (const value of Object.values(collection)) {
    for (const fieldName of fieldNames) {
      const candidate = value?.[fieldName]
      if (typeof candidate === 'string' && candidate.length > 0) {
        ids.add(candidate)
      }
    }
  }

  return ids
}

function getNestedStringValues(value) {
  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.values(value).filter((candidate) => typeof candidate === 'string' && candidate.length > 0)
}

function addIssue(issues, summaryKey, summary, issue) {
  issues.push(issue)
  summary[summaryKey] += 1
}

export function auditOwnershipSnapshot(snapshot) {
  const issues = []
  const summary = {
    canonicalOrphans: 0,
    previewOrphans: 0,
    invalidReferences: 0,
    softDeletedPreviews: 0,
  }

  const users = asCollection(snapshot.users)
  const canonicalCollections = {
    tables: asCollection(snapshot.tables),
    matches: asCollection(snapshot.matches),
    teamMatches: asCollection(snapshot.teamMatches),
    teams: asCollection(snapshot.teams),
    playerLists: asCollection(snapshot.playerLists),
    scoreboards: asCollection(snapshot.scoreboards),
    scoreboardTemplates: asCollection(snapshot.scoreboardTemplates),
    dynamicurls: asCollection(snapshot.dynamicurls),
  }

  for (const config of PREVIEW_CONFIGS) {
    const referencedIDs = new Set()
    const canonicalCollection = canonicalCollections[config.canonicalRoot] || {}

    for (const [userID, userValue] of Object.entries(users)) {
      const previews = asCollection(userValue?.[config.previewRoot])
      for (const [previewID, previewValue] of Object.entries(previews)) {
        const canonicalID = getPreviewCanonicalID(config, previewValue)
        const previewPath = `users/${userID}/${config.previewRoot}/${previewID}`

        if (!canonicalID) {
          addIssue(issues, 'previewOrphans', summary, {
            severity: 'error',
            code: 'preview_missing_id',
            path: previewPath,
            message: `${config.entityName} preview does not contain a canonical id`,
          })
          continue
        }

        referencedIDs.add(canonicalID)
        const canonicalRecord = canonicalCollection[canonicalID]

        if (!canonicalRecord) {
          addIssue(issues, 'previewOrphans', summary, {
            severity: 'error',
            code: 'preview_missing_canonical',
            path: previewPath,
            message: `${config.entityName} preview points at a missing canonical record`,
            details: { canonicalID },
          })
          continue
        }

        if (!isRecordActive(canonicalRecord)) {
          addIssue(issues, 'softDeletedPreviews', summary, {
            severity: 'warning',
            code: 'preview_points_to_soft_deleted',
            path: previewPath,
            message: `${config.entityName} preview still points at a soft-deleted canonical record`,
            details: { canonicalID },
          })
        }
      }
    }

    for (const [canonicalID, canonicalRecord] of Object.entries(canonicalCollection)) {
      if (!isRecordActive(canonicalRecord)) {
        continue
      }

      if (!referencedIDs.has(canonicalID)) {
        addIssue(issues, 'canonicalOrphans', summary, {
          severity: 'warning',
          code: 'canonical_missing_preview',
          path: `${String(config.canonicalRoot)}/${canonicalID}`,
          message: `${config.entityName} canonical record has no owner preview entry`,
        })
      }
    }
  }

  for (const [tableID, table] of Object.entries(canonicalCollections.tables)) {
    if (!isRecordActive(table)) {
      continue
    }

    const playerListID = table.playerListID
    if (typeof playerListID === 'string' && playerListID.length > 0 && !isRecordActive(canonicalCollections.playerLists[playerListID])) {
      addIssue(issues, 'invalidReferences', summary, {
        severity: 'warning',
        code: 'table_missing_player_list',
        path: `tables/${tableID}/playerListID`,
        message: 'Table references a missing or deleted player list',
        details: { playerListID },
      })
    }

    const currentMatch = table.currentMatch
    if (typeof currentMatch === 'string' && currentMatch.length > 0 && !isRecordActive(canonicalCollections.matches[currentMatch])) {
      addIssue(issues, 'invalidReferences', summary, {
        severity: 'warning',
        code: 'table_missing_current_match',
        path: `tables/${tableID}/currentMatch`,
        message: 'Table currentMatch points at a missing or deleted match',
        details: { matchID: currentMatch },
      })
    }

    for (const matchID of getNestedStringValues(table.scheduledMatches)) {
      if (!isRecordActive(canonicalCollections.matches[matchID])) {
        addIssue(issues, 'invalidReferences', summary, {
          severity: 'warning',
          code: 'table_missing_scheduled_match',
          path: `tables/${tableID}/scheduledMatches`,
          message: 'Table scheduledMatches contains a missing or deleted match',
          details: { matchID },
        })
      }
    }
  }

  for (const [teamMatchID, teamMatch] of Object.entries(canonicalCollections.teamMatches)) {
    if (!isRecordActive(teamMatch)) {
      continue
    }

    for (const teamID of [teamMatch.teamAID, teamMatch.teamBID]) {
      if (typeof teamID === 'string' && teamID.length > 0 && !isRecordActive(canonicalCollections.teams[teamID])) {
        addIssue(issues, 'invalidReferences', summary, {
          severity: 'warning',
          code: 'team_match_missing_team',
          path: `teamMatches/${teamMatchID}`,
          message: 'Team match references a missing or deleted team',
          details: { teamID },
        })
      }
    }

    for (const matchID of getNestedStringValues(teamMatch.currentMatches)) {
      if (!isRecordActive(canonicalCollections.matches[matchID])) {
        addIssue(issues, 'invalidReferences', summary, {
          severity: 'warning',
          code: 'team_match_missing_current_match',
          path: `teamMatches/${teamMatchID}/currentMatches`,
          message: 'Team match currentMatches contains a missing or deleted match',
          details: { matchID },
        })
      }
    }
  }

  for (const [dynamicURLID, dynamicURL] of Object.entries(canonicalCollections.dynamicurls)) {
    if (!isRecordActive(dynamicURL)) {
      continue
    }

    const targetRefs = [
      { field: 'tableID', collection: canonicalCollections.tables, path: `dynamicurls/${dynamicURLID}/tableID` },
      { field: 'scoreboardID', collection: canonicalCollections.scoreboards, path: `dynamicurls/${dynamicURLID}/scoreboardID` },
      { field: 'teamMatchID', collection: canonicalCollections.teamMatches, path: `dynamicurls/${dynamicURLID}/teamMatchID` },
      { field: 'teammatchID', collection: canonicalCollections.teamMatches, path: `dynamicurls/${dynamicURLID}/teammatchID` },
    ]

    for (const ref of targetRefs) {
      const targetID = dynamicURL?.[ref.field]
      if (typeof targetID === 'string' && targetID.length > 0 && !isRecordActive(ref.collection[targetID])) {
        addIssue(issues, 'invalidReferences', summary, {
          severity: 'warning',
          code: 'dynamic_url_missing_target',
          path: ref.path,
          message: `Dynamic URL references a missing or deleted ${ref.field}`,
          details: { targetID },
        })
      }
    }
  }

  const referencedTemplateIDs = getReferencedIDs(canonicalCollections.scoreboards, 'templateID', 'scoreboardTemplateID')
  for (const templateID of referencedTemplateIDs) {
    if (!isRecordActive(canonicalCollections.scoreboardTemplates[templateID])) {
      addIssue(issues, 'invalidReferences', summary, {
        severity: 'warning',
        code: 'scoreboard_missing_template',
        path: `scoreboardTemplates/${templateID}`,
        message: 'A scoreboard references a missing or deleted template',
        details: { templateID },
      })
    }
  }

  return { summary, issues }
}
