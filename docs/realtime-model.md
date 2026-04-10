# Realtime Inventory And Direction

This document captures the first `CI-3` grounding pass for OpenScoreboard v3.

## Current live update entrypoints

Scoring and operator flows:
- `src/functions/scoring.ts`
  - `subscribeToAllMatchFields`
  - `watchForPasswordChange`
- `src/functions/players.ts`
  - `watchForPlayerListPasswordChange`
- `src/components/scoring/ScoringStation.tsx`
  - subscribes to table password change while unlocked

Scoreboard runtime:
- `src/scoreboard/index.ts`
  - listens to scoreboard HTML/CSS
  - dynamic URL listener
- `src/scoreboard/dynamicurls.ts`
  - dynamic URL path listener
- `src/scoreboard/addFieldListeners.ts`
  - BroadcastChannel fan-out listeners for rendered field nodes
- `src/scoreboard/runAllListeners.ts`
  - current table/team-match live wiring
- `src/scoreboard/teamUpdates.ts`
  - live team/team-match field propagation
- `src/scoreboard/addScoreboardSettingListeners.ts`
  - window message-driven display fade behavior

## Current fragmentation

- multiple modules attach `db.ref(path).on("value")` directly
- attach/detach ownership is inconsistent
- some flows use direct DB listeners, others use `BroadcastChannel`, others use `window.postMessage`
- subscription cleanup is manual and spread across scoring and scoreboard runtime code

## First shared primitive added in this tranche

`src/lib/realtime.ts` now provides:
- `subscribeToPathValue(path, callback)`
- `subscribeToPathState(path, callback)`
- `unwrapRealtimeValue(value)`
- `RealtimeState`
- `RealtimeStatus`

It is now used by:
- `watchForPasswordChange`
- `watchForPlayerListPasswordChange`
- `dynamicURLListener`
- `subscribeToAllMatchFields`

## Backward compatibility notes

- Existing Firebase/AceBase paths are unchanged.
- Existing preview/index nodes under `users/*` are unchanged.
- Existing scoreboard URL/query contracts such as `scoreboard/view?sid=...&tid=...` and `...&tmid=...` remain valid.
- The new subscription helpers are additive wrappers around the existing database paths; they do not introduce a new canonical storage path.
- Current CI-3 work replaces ad-hoc listener ownership with shared cleanup helpers, but does not remove legacy flat match fields.

## Next CI-3 target

Replace ad-hoc scoreboard runtime wiring with a shared subscription contract for:
- table current match state
- team-match current table state
- scoreboard HTML/CSS payload
- password/access token state
- derived scoring context state

That next slice should centralize:
- listener creation
- listener cleanup
- reconnect behavior
- raw record + derived view model emission

## Shared UI state contract

`RealtimeState` standardizes the live-state vocabulary used by subscribed screens:
- `idle`
- `loading`
- `live`
- `error`
- `stale`
- `offline`

Screens can opt into `subscribeToPathState(...)` when they need explicit loading/offline/error UI states. Existing `subscribeToPathValue(...)` remains available for compatibility-oriented call sites that only need values.
