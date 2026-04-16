import { getOwnershipPolicy } from './policies.js'

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function countValues(value) {
  return Array.isArray(value) ? value.length : 0
}

export function getDeleteImpactItems(report) {
  if (!report || typeof report !== 'object') {
    return []
  }

  const dependentIDs = report.dependentIDs && typeof report.dependentIDs === 'object'
    ? report.dependentIDs
    : {}

  const items = []

  const archivedMatches = countValues(dependentIDs.matches)
  if (archivedMatches > 0) {
    items.push(`Archive ${pluralize(archivedMatches, 'canonical match', 'canonical matches')}.`)
  }

  const archivedDynamicURLs = countValues(dependentIDs.dynamicURLs)
  if (archivedDynamicURLs > 0) {
    items.push(`Archive ${pluralize(archivedDynamicURLs, 'dynamic URL')}.`)
  }

  const revokedCapabilityTokens = countValues(dependentIDs.revokedCapabilityTokenIDs)
  if (revokedCapabilityTokens > 0) {
    items.push(`Revoke ${pluralize(revokedCapabilityTokens, 'capability link')}.`)
  }

  const clearedTables = countValues(dependentIDs.clearedTables)
  if (clearedTables > 0) {
    items.push(`Detach ${pluralize(clearedTables, 'table assignment')} from this record.`)
  }

  const clearedScoreboards = countValues(dependentIDs.clearedScoreboards)
  if (clearedScoreboards > 0) {
    items.push(`Clear this template from ${pluralize(clearedScoreboards, 'scoreboard')}.`)
  }

  const activeTeamMatchRefs = countValues(dependentIDs.activeTeamMatchRefs)
  if (activeTeamMatchRefs > 0) {
    items.push(`Preserve ${pluralize(activeTeamMatchRefs, 'active team match reference')} for manual review.`)
  }

  if (items.length === 0) {
    items.push('No additional active dependent records were found in the dry-run scan.')
  }

  return items
}

export function getDeleteRetentionText(entityType) {
  const policy = getOwnershipPolicy(entityType)
  const retentionDays = Number(policy?.retentionDays || 0)
  if (!retentionDays) {
    return ''
  }

  return `Recovery window: ${pluralize(retentionDays, 'day')}. Permanent purge tooling should only run after a fresh dry-run.`
}
