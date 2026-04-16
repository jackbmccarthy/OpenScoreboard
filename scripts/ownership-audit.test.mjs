import test from 'node:test'
import assert from 'node:assert/strict'

import { auditOwnershipSnapshot } from './ownership-audit.mjs'

test('rebuilds missing previews and backfills owner fields', () => {
  const report = auditOwnershipSnapshot({
    users: {
      ownerA: {
        myTeams: {
          preview1: {
            id: 'team-1',
            name: 'Alpha',
          },
        },
      },
    },
    teams: {
      'team-1': {
        teamName: 'Alpha',
      },
      'team-2': {
        ownerID: 'ownerA',
        teamName: 'Beta',
      },
    },
    tables: {},
    matches: {},
    teamMatches: {},
    playerLists: {},
    scoreboards: {},
    scoreboardTemplates: {},
    dynamicurls: {},
  })

  assert.equal(report.summary.canonicalOrphans, 1)
  assert.equal(report.fixPlan.summary.rebuildPreview, 1)

  const backfillOwnerAction = report.fixPlan.actions.find((action) => action.path === 'teams/team-1/ownerID')
  assert.ok(backfillOwnerAction)
  assert.equal(backfillOwnerAction.type, 'set_value')

  const rebuildPreviewAction = report.fixPlan.actions.find((action) => action.type === 'rebuild_preview' && action.canonicalID === 'team-2')
  assert.ok(rebuildPreviewAction)
  assert.equal(rebuildPreviewAction.userID, 'ownerA')
  assert.equal(rebuildPreviewAction.previewRoot, 'myTeams')
})

test('archives orphaned refs and orphaned canonical records', () => {
  const report = auditOwnershipSnapshot({
    users: {
      ownerA: {
        myTables: {
          tablePreview: 'table-1',
        },
        myDynamicURLs: {
          urlPreview: {
            id: 'dyn-1',
          },
        },
      },
    },
    tables: {
      'table-1': {
        creatorID: 'ownerA',
        currentMatch: 'missing-match',
        scheduledMatches: {
          queueA: {
            matchID: 'missing-scheduled-match',
            status: 'scheduled',
          },
        },
        playerListID: 'missing-player-list',
        scoreboardID: 'missing-scoreboard',
      },
    },
    matches: {
      orphanedMatch: {
        scheduling: {
          tableID: 'missing-table',
          sourceType: 'table',
        },
      },
      repairedMatch: {
        scheduling: {},
      },
    },
    teamMatches: {
      'team-match-1': {
        ownerID: 'ownerA',
        currentMatches: {
          1: 'repairedMatch',
          2: 'missing-team-match',
        },
      },
    },
    teams: {},
    playerLists: {},
    scoreboards: {},
    scoreboardTemplates: {},
    dynamicurls: {
      'dyn-1': {
        ownerID: 'ownerA',
        tableID: 'missing-table',
      },
    },
  })

  assert.ok(report.issues.some((issue) => issue.code === 'table_missing_current_match'))
  assert.ok(report.issues.some((issue) => issue.code === 'table_missing_scheduled_match'))
  assert.ok(report.issues.some((issue) => issue.code === 'dynamic_url_missing_target'))
  assert.ok(report.issues.some((issue) => issue.code === 'match_missing_owner'))
  assert.ok(report.issues.some((issue) => issue.code === 'match_missing_scheduling_backref'))

  assert.ok(report.fixPlan.actions.some((action) => action.path === 'tables/table-1/currentMatch' && action.value === ''))
  assert.ok(report.fixPlan.actions.some((action) => action.path === 'tables/table-1/playerListID' && action.value === null))
  assert.ok(report.fixPlan.actions.some((action) => action.path === 'tables/table-1/scoreboardID' && action.value === null))
  assert.ok(report.fixPlan.actions.some((action) => action.type === 'soft_delete_canonical' && action.path === 'dynamicurls/dyn-1'))
  assert.ok(report.fixPlan.actions.some((action) => action.type === 'soft_delete_canonical' && action.path === 'matches/orphanedMatch'))

  const schedulingRepair = report.fixPlan.actions.find((action) => action.path === 'matches/repairedMatch/scheduling')
  assert.ok(schedulingRepair)
  assert.equal(schedulingRepair.value.teamMatchID, 'team-match-1')
  assert.equal(schedulingRepair.value.tableNumber, '1')
  assert.equal(schedulingRepair.value.sourceType, 'team-match')
})
