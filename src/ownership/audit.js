import {
  buildPreviewValue,
  getOwnershipPolicies,
  getPreviewCanonicalID,
  getPreviewPolicies,
  isRecordActive,
} from './policies.js'

function asCollection(value) {
  return value && typeof value === 'object' ? value : {}
}

function toStringValue(value) {
  return typeof value === 'string' ? value : ''
}

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
      if (typeof candidate.matchID === 'string' && candidate.matchID.length > 0) {
        matchIDs.push(candidate.matchID)
      }
    }
  }

  return matchIDs
}

function setValueAction(path, value, reason) {
  return {
    type: 'set_value',
    path,
    value,
    reason,
  }
}

function removePreviewAction(path, reason) {
  return {
    type: 'remove_preview',
    path,
    reason,
  }
}

function rebuildPreviewAction(userID, previewRoot, entityType, canonicalID, value, reason) {
  return {
    type: 'rebuild_preview',
    userID,
    previewRoot,
    entityType,
    canonicalID,
    pathHint: `users/${userID}/${previewRoot}/*`,
    value,
    reason,
  }
}

function softDeleteAction(path, entityType, canonicalID, ownerID, reason, extra = {}) {
  return {
    type: 'soft_delete_canonical',
    path,
    entityType,
    canonicalID,
    ownerID,
    reason,
    extra,
  }
}

function archiveQueueEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  return {
    ...entry,
    status: 'archived',
    orphanReason: 'missing_match',
    orphanedAt: '__NOW__',
    matchID: '',
    updatedAt: '__NOW__',
  }
}

function addIssue(issues, summary, issue) {
  issues.push(issue)

  if (issue.severity === 'error') {
    summary.errors += 1
  }
  if (issue.severity === 'warning') {
    summary.warnings += 1
  }

  switch (issue.code) {
    case 'preview_missing_id':
    case 'preview_missing_canonical':
      summary.previewOrphans += 1
      break
    case 'preview_points_to_soft_deleted':
      summary.softDeletedPreviews += 1
      break
    case 'canonical_missing_preview':
      summary.canonicalOrphans += 1
      break
    default:
      summary.invalidReferences += 1
      break
  }
}

function pushAction(fixPlan, action) {
  if (!action) {
    return
  }

  const duplicate = fixPlan.actions.some((candidate) => {
    if (candidate.type !== action.type) {
      return false
    }

    if ('path' in candidate && 'path' in action) {
      return candidate.path === action.path
    }

    if (candidate.type === 'rebuild_preview' && action.type === 'rebuild_preview') {
      return (
        candidate.userID === action.userID
        && candidate.previewRoot === action.previewRoot
        && candidate.canonicalID === action.canonicalID
      )
    }

    return false
  })

  if (duplicate) {
    return
  }

  fixPlan.actions.push(action)
  switch (action.type) {
    case 'remove_preview':
      fixPlan.summary.removePreview += 1
      break
    case 'rebuild_preview':
      fixPlan.summary.rebuildPreview += 1
      break
    case 'soft_delete_canonical':
      fixPlan.summary.softDeleteCanonical += 1
      break
    case 'set_value':
      fixPlan.summary.setValue += 1
      break
  }
}

function buildMatchReferenceMaps(snapshot) {
  const collections = {
    tables: asCollection(snapshot.tables),
    teamMatches: asCollection(snapshot.teamMatches),
  }

  const currentTableRefs = new Map()
  const scheduledTableRefs = new Map()
  const currentTeamMatchRefs = new Map()

  for (const [tableID, table] of Object.entries(collections.tables)) {
    if (!isRecordActive(table)) {
      continue
    }

    const currentMatchID = toStringValue(table?.currentMatch)
    if (currentMatchID) {
      currentTableRefs.set(currentMatchID, { tableID })
    }

    const scheduledMatches = asCollection(table?.scheduledMatches)
    for (const [scheduledMatchID, scheduledMatch] of Object.entries(scheduledMatches)) {
      const matchID = typeof scheduledMatch === 'string'
        ? scheduledMatch
        : toStringValue(scheduledMatch?.matchID)
      if (!matchID) {
        continue
      }
      scheduledTableRefs.set(matchID, { tableID, scheduledMatchID })
    }
  }

  for (const [teamMatchID, teamMatch] of Object.entries(collections.teamMatches)) {
    if (!isRecordActive(teamMatch)) {
      continue
    }

    const currentMatches = asCollection(teamMatch?.currentMatches)
    for (const [tableNumber, matchID] of Object.entries(currentMatches)) {
      if (typeof matchID !== 'string' || !matchID) {
        continue
      }
      currentTeamMatchRefs.set(matchID, { teamMatchID, tableNumber })
    }
  }

  return {
    currentTableRefs,
    scheduledTableRefs,
    currentTeamMatchRefs,
  }
}

function inferMatchScheduling(matchID, references, match) {
  const currentTableRef = references.currentTableRefs.get(matchID)
  if (currentTableRef) {
    return {
      ...(match?.scheduling && typeof match.scheduling === 'object' ? match.scheduling : {}),
      tableID: currentTableRef.tableID,
      teamMatchID: '',
      tableNumber: '',
      sourceType: 'table',
    }
  }

  const scheduledTableRef = references.scheduledTableRefs.get(matchID)
  if (scheduledTableRef) {
    return {
      ...(match?.scheduling && typeof match.scheduling === 'object' ? match.scheduling : {}),
      tableID: scheduledTableRef.tableID,
      queueItemID: scheduledTableRef.scheduledMatchID,
      scheduledMatchID: scheduledTableRef.scheduledMatchID,
      teamMatchID: '',
      tableNumber: '',
      sourceType: 'scheduled-table-queue',
    }
  }

  const currentTeamMatchRef = references.currentTeamMatchRefs.get(matchID)
  if (currentTeamMatchRef) {
    return {
      ...(match?.scheduling && typeof match.scheduling === 'object' ? match.scheduling : {}),
      tableID: '',
      teamMatchID: currentTeamMatchRef.teamMatchID,
      tableNumber: currentTeamMatchRef.tableNumber,
      sourceType: 'team-match',
    }
  }

  return null
}

export function auditOwnershipSnapshot(snapshot) {
  const issues = []
  const fixPlan = {
    summary: {
      removePreview: 0,
      rebuildPreview: 0,
      softDeleteCanonical: 0,
      setValue: 0,
    },
    actions: [],
  }
  const summary = {
    canonicalOrphans: 0,
    previewOrphans: 0,
    invalidReferences: 0,
    softDeletedPreviews: 0,
    warnings: 0,
    errors: 0,
  }

  const users = asCollection(snapshot.users)
  const policies = getOwnershipPolicies()
  const canonicalCollections = Object.fromEntries(
    Object.values(policies).map((policy) => [policy.canonicalRoot, asCollection(snapshot[policy.canonicalRoot])]),
  )

  for (const policy of getPreviewPolicies()) {
    const canonicalCollection = canonicalCollections[policy.canonicalRoot] || {}
    const referencedCanonicalIDs = new Set()

    for (const [userID, userValue] of Object.entries(users)) {
      const previews = asCollection(userValue?.[policy.previewRoot])
      for (const [previewID, previewValue] of Object.entries(previews)) {
        const canonicalID = getPreviewCanonicalID(policy, previewValue)
        const previewPath = `users/${userID}/${policy.previewRoot}/${previewID}`

        if (!canonicalID) {
          addIssue(issues, summary, {
            severity: 'error',
            code: 'preview_missing_id',
            path: previewPath,
            message: `${policy.entityType} preview does not contain a canonical id`,
          })
          pushAction(fixPlan, removePreviewAction(previewPath, 'preview_missing_id'))
          continue
        }

        referencedCanonicalIDs.add(canonicalID)
        const canonicalRecord = canonicalCollection[canonicalID]

        if (!canonicalRecord) {
          addIssue(issues, summary, {
            severity: 'error',
            code: 'preview_missing_canonical',
            path: previewPath,
            message: `${policy.entityType} preview points at a missing canonical record`,
            details: { canonicalID },
          })
          pushAction(fixPlan, removePreviewAction(previewPath, 'preview_missing_canonical'))
          continue
        }

        if (!isRecordActive(canonicalRecord)) {
          addIssue(issues, summary, {
            severity: 'warning',
            code: 'preview_points_to_soft_deleted',
            path: previewPath,
            message: `${policy.entityType} preview still points at a soft-deleted canonical record`,
            details: { canonicalID },
          })
          pushAction(fixPlan, removePreviewAction(previewPath, 'preview_points_to_soft_deleted'))
          continue
        }

        if (policy.ownerField && !toStringValue(canonicalRecord?.[policy.ownerField])) {
          pushAction(
            fixPlan,
            setValueAction(
              `${policy.canonicalRoot}/${canonicalID}/${policy.ownerField}`,
              userID,
              'backfill_owner_from_preview',
            ),
          )
        }
      }
    }

    for (const [canonicalID, canonicalRecord] of Object.entries(canonicalCollection)) {
      if (!isRecordActive(canonicalRecord)) {
        continue
      }

      if (referencedCanonicalIDs.has(canonicalID)) {
        continue
      }

      const ownerID = toStringValue(canonicalRecord?.[policy.ownerField])
      addIssue(issues, summary, {
        severity: 'warning',
        code: 'canonical_missing_preview',
        path: `${policy.canonicalRoot}/${canonicalID}`,
        message: `${policy.entityType} canonical record has no owner preview entry`,
        details: { ownerID },
      })

      if (ownerID && users[ownerID]) {
        pushAction(
          fixPlan,
          rebuildPreviewAction(
            ownerID,
            policy.previewRoot,
            policy.entityType,
            canonicalID,
            buildPreviewValue(policy.entityType, canonicalID, canonicalRecord),
            'repair_missing_owner_preview',
          ),
        )
      } else {
        pushAction(
          fixPlan,
          softDeleteAction(
            `${policy.canonicalRoot}/${canonicalID}`,
            policy.entityType,
            canonicalID,
            ownerID,
            'ownership_orphan_missing_preview',
          ),
        )
      }
    }
  }

  for (const [tableID, table] of Object.entries(canonicalCollections.tables || {})) {
    if (!isRecordActive(table)) {
      continue
    }

    const playerListID = toStringValue(table?.playerListID)
    if (playerListID && !isRecordActive(canonicalCollections.playerLists?.[playerListID])) {
      addIssue(issues, summary, {
        severity: 'warning',
        code: 'table_missing_player_list',
        path: `tables/${tableID}/playerListID`,
        message: 'Table references a missing or deleted player list',
        details: { playerListID },
      })
      pushAction(fixPlan, setValueAction(`tables/${tableID}/playerListID`, null, 'clear_missing_player_list'))
    }

    const scoreboardID = toStringValue(table?.scoreboardID)
    if (scoreboardID && !isRecordActive(canonicalCollections.scoreboards?.[scoreboardID])) {
      addIssue(issues, summary, {
        severity: 'warning',
        code: 'table_missing_scoreboard',
        path: `tables/${tableID}/scoreboardID`,
        message: 'Table references a missing or deleted scoreboard',
        details: { scoreboardID },
      })
      pushAction(fixPlan, setValueAction(`tables/${tableID}/scoreboardID`, null, 'clear_missing_scoreboard'))
    }

    const currentMatchID = toStringValue(table?.currentMatch)
    if (currentMatchID && !isRecordActive(canonicalCollections.matches?.[currentMatchID])) {
      addIssue(issues, summary, {
        severity: 'warning',
        code: 'table_missing_current_match',
        path: `tables/${tableID}/currentMatch`,
        message: 'Table currentMatch points at a missing or deleted match',
        details: { matchID: currentMatchID },
      })
      pushAction(fixPlan, setValueAction(`tables/${tableID}/currentMatch`, '', 'clear_missing_current_match'))
    }

    const scheduledMatches = asCollection(table?.scheduledMatches)
    for (const [scheduledMatchID, scheduledMatch] of Object.entries(scheduledMatches)) {
      const matchID = typeof scheduledMatch === 'string'
        ? scheduledMatch
        : toStringValue(scheduledMatch?.matchID)
      if (!matchID || isRecordActive(canonicalCollections.matches?.[matchID])) {
        continue
      }

      addIssue(issues, summary, {
        severity: 'warning',
        code: 'table_missing_scheduled_match',
        path: `tables/${tableID}/scheduledMatches/${scheduledMatchID}`,
        message: 'Table scheduled match points at a missing or deleted match',
        details: { matchID },
      })

      const archivedQueueEntry = archiveQueueEntry(scheduledMatch)
      pushAction(
        fixPlan,
        archivedQueueEntry
          ? setValueAction(
              `tables/${tableID}/scheduledMatches/${scheduledMatchID}`,
              archivedQueueEntry,
              'archive_scheduled_match_missing_canonical',
            )
          : setValueAction(`tables/${tableID}/scheduledMatches/${scheduledMatchID}`, null, 'remove_invalid_scheduled_match'),
      )
    }
  }

  for (const [teamMatchID, teamMatch] of Object.entries(canonicalCollections.teamMatches || {})) {
    if (!isRecordActive(teamMatch)) {
      continue
    }

    for (const fieldName of ['teamAID', 'teamBID']) {
      const teamID = toStringValue(teamMatch?.[fieldName])
      if (!teamID || canonicalCollections.teams?.[teamID]) {
        continue
      }

      addIssue(issues, summary, {
        severity: 'warning',
        code: 'team_match_missing_team',
        path: `teamMatches/${teamMatchID}/${fieldName}`,
        message: 'Team match references a missing team record',
        details: { teamID },
      })
    }

    const currentMatches = asCollection(teamMatch?.currentMatches)
    for (const [tableNumber, matchID] of Object.entries(currentMatches)) {
      if (typeof matchID !== 'string' || !matchID || isRecordActive(canonicalCollections.matches?.[matchID])) {
        continue
      }

      addIssue(issues, summary, {
        severity: 'warning',
        code: 'team_match_missing_current_match',
        path: `teamMatches/${teamMatchID}/currentMatches/${tableNumber}`,
        message: 'Team match currentMatches contains a missing or deleted match',
        details: { matchID, tableNumber },
      })
      pushAction(
        fixPlan,
        setValueAction(`teamMatches/${teamMatchID}/currentMatches/${tableNumber}`, '', 'clear_missing_team_match_current_match'),
      )
    }
  }

  for (const [dynamicURLID, dynamicURL] of Object.entries(canonicalCollections.dynamicurls || {})) {
    if (!isRecordActive(dynamicURL)) {
      continue
    }

    const targetChecks = [
      { field: 'tableID', collection: canonicalCollections.tables },
      { field: 'scoreboardID', collection: canonicalCollections.scoreboards },
      { field: 'teamMatchID', collection: canonicalCollections.teamMatches },
      { field: 'teammatchID', collection: canonicalCollections.teamMatches },
    ]

    const invalidTarget = targetChecks.find((targetCheck) => {
      const targetID = toStringValue(dynamicURL?.[targetCheck.field])
      return targetID && !isRecordActive(targetCheck.collection?.[targetID])
    })

    if (!invalidTarget) {
      continue
    }

    addIssue(issues, summary, {
      severity: 'warning',
      code: 'dynamic_url_missing_target',
      path: `dynamicurls/${dynamicURLID}/${invalidTarget.field}`,
      message: 'Dynamic URL references a missing or deleted target record',
      details: { targetField: invalidTarget.field, targetID: dynamicURL?.[invalidTarget.field] },
    })

    pushAction(
      fixPlan,
      softDeleteAction(
        `dynamicurls/${dynamicURLID}`,
        'dynamicURL',
        dynamicURLID,
        toStringValue(dynamicURL?.ownerID),
        'orphaned_dynamic_url_target',
      ),
    )
  }

  for (const [scoreboardID, scoreboard] of Object.entries(canonicalCollections.scoreboards || {})) {
    if (!isRecordActive(scoreboard)) {
      continue
    }

    for (const templateField of ['templateID', 'scoreboardTemplateID']) {
      const templateID = toStringValue(scoreboard?.[templateField])
      if (!templateID || isRecordActive(canonicalCollections.scoreboardTemplates?.[templateID])) {
        continue
      }

      addIssue(issues, summary, {
        severity: 'warning',
        code: 'scoreboard_missing_template',
        path: `scoreboards/${scoreboardID}/${templateField}`,
        message: 'Scoreboard references a missing or deleted template',
        details: { templateID },
      })
      pushAction(fixPlan, setValueAction(`scoreboards/${scoreboardID}/${templateField}`, '', 'clear_missing_template'))
    }
  }

  const matchReferences = buildMatchReferenceMaps(snapshot)

  for (const [matchID, match] of Object.entries(canonicalCollections.matches || {})) {
    if (!isRecordActive(match)) {
      continue
    }

    const scheduling = match?.scheduling && typeof match.scheduling === 'object'
      ? match.scheduling
      : {}
    const hasParentReference =
      matchReferences.currentTableRefs.has(matchID)
      || matchReferences.scheduledTableRefs.has(matchID)
      || matchReferences.currentTeamMatchRefs.has(matchID)

    if (!hasParentReference) {
      const tableID = toStringValue(scheduling.tableID) || toStringValue(match?.tableID)
      const teamMatchID = toStringValue(scheduling.teamMatchID) || toStringValue(match?.teamMatchID)
      const ownerIsMissing =
        (!tableID && !teamMatchID)
        || (tableID && !isRecordActive(canonicalCollections.tables?.[tableID]))
        || (teamMatchID && !isRecordActive(canonicalCollections.teamMatches?.[teamMatchID]))

      if (ownerIsMissing) {
        addIssue(issues, summary, {
          severity: 'warning',
          code: 'match_missing_owner',
          path: `matches/${matchID}`,
          message: 'Match has no active owning table or team match reference',
          details: { tableID, teamMatchID },
        })
        pushAction(
          fixPlan,
          softDeleteAction(
            `matches/${matchID}`,
            'match',
            matchID,
            '',
            'ownership_orphan_missing_parent',
          ),
        )
      }
      continue
    }

    const inferredScheduling = inferMatchScheduling(matchID, matchReferences, match)
    if (!inferredScheduling) {
      continue
    }

    const currentScheduling = match?.scheduling && typeof match.scheduling === 'object'
      ? match.scheduling
      : {}
    const needsSchedulingBackfill = Object.entries(inferredScheduling).some(([key, value]) => {
      if (!value) {
        return false
      }
      return currentScheduling?.[key] !== value
    })

    if (needsSchedulingBackfill) {
      addIssue(issues, summary, {
        severity: 'warning',
        code: 'match_missing_scheduling_backref',
        path: `matches/${matchID}/scheduling`,
        message: 'Match ownership can be repaired from active parent references',
        details: inferredScheduling,
      })
      pushAction(
        fixPlan,
        setValueAction(`matches/${matchID}/scheduling`, inferredScheduling, 'repair_match_scheduling_from_parent_reference'),
      )
    }
  }

  return {
    summary,
    issues,
    fixPlan,
  }
}
