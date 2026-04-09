# Ownership And Delete Model

This document captures the first `CI-2` ownership baseline for OpenScoreboard v3.

## Canonical records vs preview/index records

Canonical records:
- `tables/{tableID}`
- `matches/{matchID}`
- `teams/{teamID}`
- `teamMatches/{teamMatchID}`
- `playerLists/{playerListID}`
- `scoreboards/{scoreboardID}`
- `scoreboardTemplates/{templateID}`
- `dynamicurls/{dynamicURLID}`
- `tournaments/{tournamentID}` future

Owner preview/index paths:
- `users/{uid}/myTables/{myTableID}`
- `users/{uid}/myTeams/{myTeamID}`
- `users/{uid}/myTeamMatches/{myTeamMatchID}`
- `users/{uid}/myPlayerLists/{myPlayerListID}`
- `users/{uid}/myScoreboards/{myScoreboardID}`
- `users/{uid}/myDynamicURLs/{myDynamicURLID}`

Public access paths and compatibility surfaces:
- `tables/{tableID}/password` current table scorer access compatibility field
- `playerLists/{playerListID}/password` current player registration compatibility field
- `scoreboard/view?sid={scoreboardID}&tid={tableID}`
- `scoreboard/view?sid={scoreboardID}&tmid={teamMatchID}&tableNumber={tableNumber}`
- `tables/{tableID}/scheduledMatches` derived queue compatibility view
- `teamMatches/{teamMatchID}/currentMatches/{tableNumber}` active table assignment compatibility view

## Create, update, and delete ownership map

### Tables
- Canonical: `tables/{tableID}`
- Owner preview: `users/{uid}/myTables/{myTableID}` -> string `tableID`
- Create path: `createNewTable`
- Update paths: `updateTable`, `setPlayerListToTable`, `setScheduledTableMatchToCurrentMatch`, `resetTablePassword`
- Delete path: `deleteTable`
- Dependents:
  - `tables/{tableID}/currentMatch`
  - `tables/{tableID}/scheduledMatches/*`
  - `dynamicurls/*` where `tableID` matches
  - public scorer access via compatibility password field
- Current delete behavior:
  - soft-delete canonical table
  - soft-delete dependent dynamic URLs
  - remove owner preview
- Future delete behavior:
  - archive or detach `currentMatch`, `scheduledMatches`, and QR/operator links explicitly

### Matches
- Canonical: `matches/{matchID}`
- Owner preview: none directly today; ownership is derived through table or team match containment
- Create paths: `createNewTableMatch`, `createTeamMatchNewMatch`, queue promotion flows future
- Update paths: scoring helpers and scoring station writes
- Delete path: no dedicated first-class delete flow yet
- Dependents:
  - `tables/{tableID}/currentMatch`
  - `tables/{tableID}/scheduledMatches/*`
  - `teamMatches/{teamMatchID}/currentMatches/*`
  - archived match summaries on tables and team matches
- Future work:
  - add explicit match ownership, archive, and retention policy

### Teams
- Canonical: `teams/{teamID}`
- Owner preview: `users/{uid}/myTeams/{myTeamID}` -> object `{ id, name, createdOn }`
- Create path: `addNewTeam`
- Update paths: `updateTeam`, `updateMyTeam`
- Delete path: `deleteMyTeam`
- Dependents:
  - `teamMatches/*` via `teamAID` and `teamBID`
- Current delete behavior:
  - soft-delete canonical team
  - remove owner preview
- Future delete behavior:
  - detach or archive dependent team matches for review

### Team matches
- Canonical: `teamMatches/{teamMatchID}`
- Owner preview: `users/{uid}/myTeamMatches/{myTeamMatchID}` -> object with `id`
- Create path: `addNewTeamMatch`
- Update paths: `updateTeamMatch`, score/team assignment helpers
- Delete path: `deleteTeamMatch`
- Dependents:
  - `teamMatches/{teamMatchID}/currentMatches/*`
  - `teamMatches/{teamMatchID}/archivedMatches/*`
  - `dynamicurls/*` where `teamMatchID` or `teammatchID` matches
  - public score view links
- Current delete behavior:
  - soft-delete canonical team match
  - soft-delete dependent dynamic URLs
  - remove owner preview
- Future delete behavior:
  - archive current matches and scheduled assignments instead of leaving raw references

### Player lists
- Canonical: `playerLists/{playerListID}`
- Owner preview: `users/{uid}/myPlayerLists/{myPlayerListID}` -> object with `id`
- Create path: `addPlayerList`
- Update paths: `updatePlayerListName`, `replacePlayersInList`, player CRUD helpers, `resetPlayerListPassword`
- Delete path: `deletePlayerList`
- Dependents:
  - `tables/*` via `playerListID`
  - public self-registration via compatibility password field
- Current delete behavior:
  - soft-delete canonical player list
  - remove owner preview
- Future delete behavior:
  - flag attached tables and registration links for reassignment or archival

### Scoreboards
- Canonical: `scoreboards/{scoreboardID}`
- Owner preview: `users/{uid}/myScoreboards/{myScoreboardID}` -> object with `id`
- Create paths: `addNewScoreboard`, `duplicateScoreboard`, `createScoreboardFromTemplate`
- Update paths: `updateScoreboardDetails`, `setScoreboardSettings`
- Delete path: `deleteMyScoreboard`
- Dependents:
  - `dynamicurls/*` where `scoreboardID` matches
  - overlay links using `scoreboard/view?...`
- Current delete behavior:
  - soft-delete canonical scoreboard
  - soft-delete dependent dynamic URLs
  - remove owner preview
- Future delete behavior:
  - archive saved scoreboard/template pairings and link history

### Scoreboard templates
- Canonical: `scoreboardTemplates/{templateID}`
- Owner preview: none in this repo today
- Create path: `addScoreboardTemplate`
- Update path: `updateScoreboardTemplate`
- Delete path: `deleteScoreboardTemplate`
- Dependents:
  - `scoreboards/*` when template ids are stored in future/current compatibility fields
- Current delete behavior:
  - soft-delete canonical template
- Future delete behavior:
  - mark dependent scoreboards as using archived templates without breaking render

### Dynamic URLs
- Canonical: `dynamicurls/{dynamicURLID}`
- Owner preview: `users/{uid}/myDynamicURLs/{myDynamicURLID}` -> object with `id`
- Create path: `addDynamicURL`
- Update path: `updateDynamicURL`
- Delete path: `deleteDynamicURL`
- Dependents:
  - points at `scoreboards`, `tables`, and `teamMatches`
- Current delete behavior:
  - soft-delete canonical dynamic URL
  - remove owner preview

## Delete modes and retention behavior

- `active`: normal visible record
- `soft_deleted`: hidden from normal list views but canonical record remains
- `archived`: reserved for future flows where records remain visible in history but are no longer operational
- `purged`: reserved for future irreversible cleanup after retention checks

Soft delete metadata:
- `deleteMode`
- `deletedAt`
- `deletedBy`
- `deleteReason`
- `purgeAfter`

Retention baseline for this tranche:
- tables, team matches, scoreboards, teams, player lists, templates, and dynamic URLs are soft-deleted first
- hard delete is deferred to a later purge job
- preview/index nodes are removed from active list views once the canonical record is soft-deleted
- restore and purge tooling are not implemented yet
- every new soft delete also writes a ledger entry under `deletionLog/*` so future delete actions remain traceable even after the preview/index node is removed

Deletion ledger fields:
- `entityType`
- `canonicalPath`
- `canonicalID`
- `ownerID`
- `previewPath`
- `deleteMode`
- `deleteReason`
- `deletedAt`
- `deletedBy`
- `dependents`

## Current tranche behavior

The first CI-2 slice changes destructive list actions so they no longer only remove owner preview nodes. The owner preview entry is still removed from normal list views, but the canonical record is soft-deleted first.

Initial dependency handling added in this tranche:
- Deleting a table soft-deletes dynamic URLs referencing that table.
- Deleting a scoreboard soft-deletes dynamic URLs referencing that scoreboard.
- Deleting a team match soft-deletes dynamic URLs referencing that team match.

## Orphan scanning and dry-run reporting

The first dry-run scanner is implemented in:
- `scripts/ownership-audit.mjs`
- `scripts/report-orphans.mjs`

Usage:

```bash
npm run audit:ownership -- ./path/to/database-export.json
```

Strict mode returns a failing exit code when warnings or errors are found:

```bash
npm run audit:ownership -- ./path/to/database-export.json --strict
```

Current scanner checks:
- preview entries that point to missing canonical records
- preview entries that still point to soft-deleted canonical records
- canonical records with no owner preview entry
- tables pointing at missing player lists or matches
- team matches pointing at missing teams or current matches
- dynamic URLs pointing at missing tables, scoreboards, or team matches
- scoreboards referencing missing templates

Future tranches should extend this with:
- archive vs purge rules
- repair/backfill actions
- explicit restore paths
- cascade handling for scheduled/current/archived match references
