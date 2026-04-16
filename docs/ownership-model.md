# Ownership And Delete Model

This is the `CI-2` ownership baseline for OpenScoreboard v3. It defines where each record lives, who owns it, which paths are derived compatibility views, and what happens during delete, archive, retention, and orphan repair flows.

## Ownership Matrix

| Entity | Canonical record path | Owner preview path | Dependent child paths | Derived summary paths | Public access paths |
| --- | --- | --- | --- | --- | --- |
| Table | `tables/{tableID}` | `users/{uid}/myTables/{myTableID}` -> string `tableID` | `tables/{tableID}/currentMatch`, `tables/{tableID}/scheduledMatches/*`, `tables/{tableID}/archivedMatches/*`, `matches/*` owned through `currentMatch` or scheduled queue entries | `tables/{tableID}/scheduledMatches`, `tables/{tableID}/archivedMatches`, table cards in `subscribeToMyTables` | `capabilityTokens/*` with `tableID`, `scoreboard/view?sid={scoreboardID}&tid={tableID}`, `dynamicurls/*` with `tableID` |
| Match | `matches/{matchID}` | none; owner is derived from `matches/{matchID}/scheduling` plus live parent refs | `matches/{matchID}/games/*`, `matches/{matchID}/pointHistory/*`, `matches/{matchID}/auditTrail/*` | `tables/*/currentMatch`, `tables/*/scheduledMatches/*`, `tables/*/archivedMatches/*`, `teamMatches/*/currentMatches/*`, `teamMatches/*/archivedMatches/*` | `capabilityTokens/*` with `matchID` |
| Team match | `teamMatches/{teamMatchID}` | `users/{uid}/myTeamMatches/{myTeamMatchID}` -> preview object with `id` | `teamMatches/{teamMatchID}/currentMatches/*`, `teamMatches/{teamMatchID}/scheduledMatches/*`, `teamMatches/{teamMatchID}/archivedMatches/*`, `matches/*` owned through `currentMatches` and team-match scheduling | `users/{uid}/myTeamMatches/*`, team-match cards, team-match scoreboard listeners | `capabilityTokens/*` with `teamMatchID`, `scoreboard/view?sid={scoreboardID}&tmid={teamMatchID}&tableNumber={tableNumber}`, `dynamicurls/*` with `teamMatchID` |
| Team | `teams/{teamID}` | `users/{uid}/myTeams/{myTeamID}` -> preview object with `id` | referenced by `teamMatches/*` via `teamAID` and `teamBID` | `users/{uid}/myTeams/*`, team-match preview names | no direct public route |
| Player list | `playerLists/{playerListID}` | `users/{uid}/myPlayerLists/{myPlayerListID}` -> preview object with `id` | `playerLists/{playerListID}/players/*`, `tables/*` via `playerListID` | `users/{uid}/myPlayerLists/*`, `tables/{tableID}/playerListID` | `capabilityTokens/*` with `playerListID`, `playerregistration/{playerListID}` |
| Scoreboard | `scoreboards/{scoreboardID}` | `users/{uid}/myScoreboards/{myScoreboardID}` -> preview object with `id` | `scoreboards/{scoreboardID}/config`, `scoreboards/{scoreboardID}/web/*`, `tables/*` via `scoreboardID`, `dynamicurls/*` via `scoreboardID` | `users/{uid}/myScoreboards/*`, table/overlay selection lists | `capabilityTokens/*` with `scoreboardID`, `scoreboard/view?sid={scoreboardID}&tid={tableID}`, `scoreboard/view?sid={scoreboardID}&tmid={teamMatchID}&tableNumber={tableNumber}` |
| Scoreboard template | `scoreboardTemplates/{templateID}` | none today | referenced by `scoreboards/*` via `templateID` or `scoreboardTemplateID` | template list in `subscribeToScoreboardTemplates` | no direct public route |
| Dynamic URL | `dynamicurls/{dynamicURLID}` | `users/{uid}/myDynamicURLs/{myDynamicURLID}` -> preview object with `id` | none; it is itself a dependent record of table/teamMatch/scoreboard ownership | `users/{uid}/myDynamicURLs/*` | `scoreboard/view?...` resolution through dynamic URL targeting |

## Create, Update, And Delete Paths

### Tables
- Create: `src/functions/tables.ts:createNewTable`
- Update: `updateTable`, `setPlayerListToTable`, `setScheduledTableMatchToCurrentMatch`, `resetTablePassword`
- Delete: `deleteTable`
- Canonical owner field: `creatorID`

### Matches
- Create: `src/functions/scoring.ts:createNewMatch`, `createNewScheduledMatch`; `src/functions/teammatches.ts:createTeamMatchNewMatch`
- Update: scoring helpers in `src/functions/scoring.ts`, schema sync in `src/functions/matchSchema.ts`
- Delete/archive: no standalone UI delete; records are archived through table/team-match ownership deletes and orphan repair
- Canonical owner field: derived from `scheduling.tableID`, `scheduling.teamMatchID`, or live parent refs

### Team matches
- Create: `src/functions/teammatches.ts:addNewTeamMatch`
- Update: `updateTeamMatch`, team score setters, current match setters
- Delete: `deleteTeamMatch`
- Canonical owner field: `ownerID`

### Teams
- Create: `src/functions/teams.ts:addNewTeam`
- Update: `updateTeam`, `updateMyTeam`
- Delete: `deleteMyTeam`
- Canonical owner field: `ownerID`

### Player lists
- Create: `src/functions/players.ts:addPlayerList`
- Update: `updatePlayerListName`, `replacePlayersInList`, player CRUD helpers, `resetPlayerListPassword`
- Delete: `deletePlayerList`
- Canonical owner field: `ownerID`

### Scoreboards
- Create: `src/functions/scoreboards.ts:addNewScoreboard`, `duplicateScoreboard`; `src/functions/scoreboardTemplates.ts:createScoreboardFromTemplate`
- Update: `updateScoreboardDetails`, `setScoreboardSettings`, editor writes under `scoreboards/{scoreboardID}/web/*`
- Delete: `deleteMyScoreboard`
- Canonical owner field: `ownerID`

### Scoreboard templates
- Create: `src/functions/scoreboardTemplates.ts:addScoreboardTemplate`
- Update: `updateScoreboardTemplate`, `toggleScoreboardTemplateActive`, `duplicateScoreboardTemplate`
- Delete: `deleteScoreboardTemplate`
- Canonical owner field: `createdBy`

### Dynamic URLs
- Create: `src/functions/dynamicurls.ts:addDynamicURL`
- Update: `updateDynamicURL`
- Delete: `deleteDynamicURL`
- Canonical owner field: `ownerID`

## Delete Modes, Archive Rules, And Retention

| Entity | Soft-delete behavior | Archive behavior | Hard-delete behavior | Retention |
| --- | --- | --- | --- | --- |
| Table | Canonical table is marked `soft_deleted`, owner preview is removed, dependent matches are soft-deleted, dependent dynamic URLs are soft-deleted, related capability links are revoked | Archive stays in-place on the canonical `tables/{tableID}` node; embedded `archivedMatches` stay attached | No automatic hard-delete in UI; only future purge tooling after dry-run | 30 days |
| Match | Child match is soft-deleted when its owning table/team-match is deleted or when orphan repair finds no active owner | Archive stays in-place on `matches/{matchID}` with deletion metadata | No automatic hard-delete; future purge only after retention | 30 days |
| Team match | Canonical team match is marked `soft_deleted`, owner preview is removed, dependent matches and dynamic URLs are soft-deleted, related capability links are revoked | Archive stays in-place on `teamMatches/{teamMatchID}` with embedded `archivedMatches` retained | No automatic hard-delete in UI; future purge only after dry-run | 30 days |
| Team | Canonical team is marked `soft_deleted`, owner preview is removed, active team-match refs are recorded for manual review | Archive stays in-place on `teams/{teamID}` so historical references can be inspected during retention | No automatic hard-delete in UI; future purge only after dry-run | 30 days |
| Player list | Canonical player list is marked `soft_deleted`, owner preview is removed, `tables/*/playerListID` refs are cleared, player-registration capability links are revoked | Archive stays in-place on `playerLists/{playerListID}` including player entries | No automatic hard-delete in UI; future purge only after dry-run | 30 days |
| Scoreboard | Canonical scoreboard is marked `soft_deleted`, owner preview is removed, `tables/*/scoreboardID` refs are cleared, dependent dynamic URLs are soft-deleted, related public-view capability links are revoked | Archive stays in-place on `scoreboards/{scoreboardID}` including web/config payload | No automatic hard-delete in UI; future purge only after dry-run | 30 days |
| Scoreboard template | Canonical template is marked `soft_deleted`, scoreboard template refs are cleared from scoreboards first | Archive stays in-place on `scoreboardTemplates/{templateID}` | No automatic hard-delete in UI; future purge only after dry-run | 60 days |
| Dynamic URL | Canonical dynamic URL is marked `soft_deleted`, owner preview is removed | Archive stays in-place on `dynamicurls/{dynamicURLID}` | No automatic hard-delete in UI; future purge only after dry-run | 14 days |

Soft-delete metadata written to every canonical record:
- `deleteMode`
- `deletedAt`
- `deletedBy`
- `deleteReason`
- `retentionDays`
- `purgeAfter`

Each soft delete also appends an audit event to `deletionLog/*`.

## Cascade Rules

### Delete table
- Soft-delete the canonical table record.
- Soft-delete the canonical `matches/*` referenced by `currentMatch`, `scheduledMatches/*`, and legacy `previousMatches`.
- Soft-delete `dynamicurls/*` that target the table.
- Revoke capability links that target the table.
- Remove the owner preview entry under `users/{uid}/myTables/*`.

### Delete team match
- Soft-delete the canonical team-match record.
- Soft-delete the canonical `matches/*` referenced by `currentMatches/*` and `scheduledMatches/*`.
- Soft-delete `dynamicurls/*` that target the team match.
- Revoke capability links that target the team match.
- Remove the owner preview entry under `users/{uid}/myTeamMatches/*`.

### Delete player list
- Clear `tables/*/playerListID` before soft-deleting the player list.
- Revoke player-registration capability links that target the player list.
- Remove the owner preview entry under `users/{uid}/myPlayerLists/*`.

### Delete scoreboard
- Clear `tables/*/scoreboardID` before soft-deleting the scoreboard.
- Soft-delete `dynamicurls/*` that target the scoreboard.
- Revoke public-score capability links that target the scoreboard.
- Remove the owner preview entry under `users/{uid}/myScoreboards/*`.

### Delete scoreboard template
- Clear `scoreboards/*/templateID` and `scoreboards/*/scoreboardTemplateID` before soft-deleting the template.
- No owner preview node exists today.

## Dry-Run And Repair Tooling

### Delete flow dry-run
The destructive list actions now accept an optional dry-run mode and return a report instead of mutating data:

- `deleteTable(myTableID, { dryRun: true })`
- `deleteTeamMatch(myTeamMatchID, { dryRun: true })`
- `deleteMyTeam(myTeamID, { dryRun: true })`
- `deletePlayerList(myPlayerListID, { dryRun: true })`
- `deleteMyScoreboard(myScoreboardID, { dryRun: true })`
- `deleteScoreboardTemplate(templateID, { dryRun: true })`
- `deleteDynamicURL(myDynamicURLID, dynamicURLID, { dryRun: true })`

### Orphan scanner
- Snapshot audit entrypoint: `npm run audit:ownership -- ./path/to/database-export.json`
- Live repair entrypoint: `scanAndRepairOwnershipOrphans({ dryRun: true | false })`

The orphan scanner detects and plans fixes for:
- preview entries with missing canonical ids
- preview entries pointing to missing or soft-deleted canonical records
- active canonical records missing owner previews
- tables referencing missing player lists, scoreboards, current matches, or scheduled matches
- team matches referencing missing current matches
- dynamic URLs targeting deleted tables, team matches, or scoreboards
- scoreboards referencing deleted templates
- matches with no active owning table/team-match or missing `scheduling` backrefs

Repair actions include:
- removing orphaned preview nodes
- rebuilding missing preview/index nodes when owner information is available
- backfilling missing canonical owner fields from preview/index ownership
- clearing broken references on tables, scoreboards, and team matches
- archiving queue items that point at missing matches
- soft-deleting orphaned canonical `matches/*` and `dynamicurls/*`

## Firebase And AceBase Notes

- Firebase mode writes pass through the database proxy. `src/server/databaseDriver.ts` now explicitly allows writes to all ownership preview collections under `users/{uid}/*`: `myTables`, `myTeams`, `myTeamMatches`, `myPlayerLists`, `myScoreboards`, `myDynamicURLs`, and `archivedTeamMatches`.
- AceBase mode uses the same delete/orphan helper logic through the shared `db.ref(...).set/remove/push` API, so the ownership cascade behavior stays aligned even though the transport differs.
