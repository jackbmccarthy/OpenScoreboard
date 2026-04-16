# Match Schema Bridge

This document captures the additive `CI-5` extensible match-schema bridge for OpenScoreboard v3.

## Versioning

- `matches/{matchID}/schemaVersion = 3`
- `teamMatches/{teamMatchID}/schemaVersion = 3`

The version bump is additive. Legacy records without `schemaVersion` still dual-read correctly.

## Additive normalized structures

`matches/{matchID}` now carries:
- `games`
- `pointHistory`
- `auditTrail`
- `tournamentContext`
- `context`
- `scheduling`
- `scoringRules`

`teamMatches/{teamMatchID}` now carries:
- `auditTrail`
- `tournamentContext`
- `context`
- `scheduling`
- `tables`

### `games`

Each game node now contains:
- `schemaVersion`
- `gameNumber`
- `status`
- `scoreA` / `scoreB`
- `winner`
- `startedAt` / `endedAt`
- `deleted` / `deletedAt`
- `legacy`
  maps back to `game1AScore`, `isGame1Started`, `game1StartTime`, and the other preserved flat fields
- `references`
  includes `pointHistoryIDs` and `auditEventIDs`
- `rules`
  sport + scoring settings snapshot
- `metadata`
  currently carries `significantPoints` and leaves room for sport-specific game extensions

### `pointHistory`

Point events now normalize old and new records into one additive structure:
- `eventID`
- `eventType`
- `createdAt`
- `sequence`
- `gameNumber`
- `side`
- `score`
- `delta`
- `undone`
- `source`
- `payload`
- `metadata`

Old point-history entries still work because the bridge fills missing fields during read/backfill.

### `auditTrail`

Audit events now normalize into:
- `eventID`
- `eventType`
- `createdAt`
- `sequence`
- `scope`
- `gameNumber`
- `source`
- `payload`
- `metadata`

### `tournamentContext`

Tournament/event references are additive and normalized under:
- flat compatibility fields: `tournamentID`, `eventID`, `roundID`, `bracketNodeID`, `teamMatchID`, `matchRound`, `eventName`
- normalized structure:
  - `refs`
  - `labels`
  - `metadata`

This keeps bracket/tournament extensions additive. Future refs can be added under `refs` or `metadata` without another schema rewrite.

### `scheduling`

Scheduling metadata is additive and normalized under:
- flat compatibility fields already used today
- normalized structure:
  - `assignment`
  - `queue`
  - `timing`
  - `refs`
  - `metadata`

`teamMatches/{teamMatchID}/tables` provides the team-match equivalent of normalized match-table references with:
- `currentMatchID`
- `scheduledMatchIDs`
- `archivedMatchIDs`
- `archivedMatches`
- `status`
- `metadata`

## Preserved flat compatibility fields

These flat fields remain present and usable for all existing readers:
- `game1AScore` through `game9BScore`
- `isGame1Started` through `isGame9Finished`
- `game1StartTime` through `game9EndTime`
- `matchRound`
- `eventName`
- `teamMatchID`
- `sportName`
- `scoringType`
- `bestOf`
- `pointsToWinGame`
- `changeServeEveryXPoints`
- `enforceGameScore`
- `isManualServiceMode`

For team matches, `matchRound`, `eventName`, `sportName`, `scoringType`, and `teamMatchID` are also preserved as flat compatibility fields.

## Dual-write rules

Until legacy readers retire, every write must preserve both surfaces:

1. Legacy flat writes remain the compatibility source of truth for existing readers.
2. Any write that changes normalized match context, games, history, tournament refs, or scheduling metadata must rebuild the normalized patch with `syncMatchSchemaFromFlat(...)` or `syncTeamMatchSchema(...)`.
3. New normalized writes must continue updating the corresponding flat compatibility fields.

Current enforced dual-write coverage includes:
- match creation
- scheduled-match promotion
- tournament schedule match creation and queue sync
- point add/remove and undo
- game start/end and manual score correction
- significant-point writes
- round updates
- team-match creation/update
- team-match score updates
- team-match table/archive updates

## Dual-read rules

All read surfaces normalize missing schema in memory before rendering:
- `getMatchData(...)`
- `subscribeToMatchData(...)`
- `new Match(existingRecord)`
- `getTeamMatch(...)`
- `subscribeToTeamMatch(...)`

This means:
- old flat-only matches still render correctly
- old team matches without `tables` or normalized context still render correctly
- scoreboard/admin consumers can read both legacy fields and normalized structures during rollout

## Backfill job

Backfill helpers are idempotent and additive:
- `backfillAllMatchSchemas()`
- `backfillAllTeamMatchSchemas()`
- `reportMatchSchemaBackfill()`
- `reportTeamMatchSchemaBackfill()`

Backfill behavior:
- derive `games` from flat game score/start/finish fields
- retain and normalize any existing `pointHistory` and `auditTrail`
- derive tournament/event refs from flat compatibility fields plus existing context
- derive scheduling metadata from flat/scheduling fields already on the record
- derive `teamMatches/*/tables` from `currentMatches`, `scheduledMatches`, and `archivedMatches`

## Scoreboard bindings

Legacy scoreboard bindings remain available:
- `matchRound`
- `eventName`
- `sportName`
- `scoringType`
- all `game{n}{A|B}Score` fields

New additive scoreboard bindings are also available:
- `schemaVersion`
- `tournamentID`
- `eventID`
- `roundID`
- `bracketNodeID`
- `teamMatchID`
- `tournamentContextMatchRound`
- `tournamentContextEventName`
- `schedulingTableID`
- `schedulingScheduledStartTime`
- `gamesJSON`
- `pointHistoryJSON`
- `auditTrailJSON`
- `tournamentContextJSON`
- `schedulingJSON`
- `scoringRulesJSON`

## Extension point for tournaments/brackets

The extensibility contract is:
- stable flat compatibility fields stay in place
- new tournament/bracket/scheduling refs expand under `tournamentContext.refs`, `tournamentContext.metadata`, `scheduling.refs`, and `scheduling.metadata`
- per-team-match table growth expands under `teamMatches/*/tables/*`

That gives future bracket, round-automation, and public replay features a place to land without another schema rewrite.
