# Match Schema Bridge

This document captures the additive `CI-5` match-schema bridge for OpenScoreboard v3.

## Goals

- Preserve all existing flat match fields and readers.
- Add a normalized schema that future tournament, bracket, history, and audit features can extend.
- Dual-write normalized structures from existing scoring/match mutation flows.
- Dual-read old matches by normalizing them in memory when the schema fields are missing.

## Current additive fields

On `matches/{matchID}`:
- `schemaVersion`
- `games`
- `pointHistory`
- `auditTrail`
- `tournamentContext`
- `context`
- `scheduling`
- `scoringRules`

On `teamMatches/{teamMatchID}`:
- `schemaVersion`
- `auditTrail`
- `tournamentContext`
- `context`
- `scheduling`

## Compatibility guarantees

The following flat fields remain canonical compatibility fields and are still populated:
- `game1AScore` through `game9BScore`
- `isGame1Started` through `isGame9Finished`
- `game1StartTime` through `game9EndTime`
- `bestOf`
- `pointsToWinGame`
- `changeServeEveryXPoints`
- `enforceGameScore`
- `isManualServiceMode`
- `matchRound`
- `eventName`
- `teamMatchID`
- `sportName`
- `scoringType`

Legacy readers continue working because none of those fields were removed or renamed.

## Dual-read behavior

- `getMatchData(...)` normalizes old matches in memory via `normalizeMatchSchema(...)`
- `subscribeToMatchData(...)` emits normalized matches even if the stored record predates `schemaVersion`
- `getTeamMatch(...)` and `subscribeToTeamMatch(...)` normalize team-match records in memory

## Dual-write behavior

The current scoring/match mutation flows continue writing the legacy flat fields and now also keep the normalized schema in sync.

Current dual-write coverage includes:
- point add/remove
- game start/end
- manual game score correction
- best-of / points-to-win / serve-rotation changes
- scoring type changes
- doubles/manual-service mode changes
- initial server selection
- round-name updates
- team-match creation and update

## Backfill jobs

Available helper jobs in [src/functions/matchSchema.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/matchSchema.ts):
- `backfillAllMatchSchemas()`
- `backfillAllTeamMatchSchemas()`

These derive the normalized additive structures from the current flat match/team-match records.

## Next follow-up

The bridge is in place, but the next CI-5 slice should:
- cover the remaining legacy write paths with richer audit/history semantics
- add tournament/event/round ids to creation and promotion flows
- surface normalized history in admin/public views
