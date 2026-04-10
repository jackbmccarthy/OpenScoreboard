# Test Spec: Next.js Server-Write Migration

## Acceptance checks
1. `npm run build` succeeds with the Next.js application.
2. `npx tsc --noEmit` succeeds for the migrated codebase.
3. Affected client code no longer performs direct Firebase Realtime Database writes for migrated helpers.
4. Realtime read/listener code still targets the same database paths under `matches`, `tables`, `teams`, `teamMatches`, `scoreboards`, `playerLists`, `users`, and `dynamicurls`.
5. Route parity is preserved for the current application entrypoints or documented redirects.

## Regression focus
- Mutation helper function signatures stay compatible with current callers.
- Scoreboard/editor save paths continue to write the same objects/fields.
- Scoring workflows still update the same match/team-match nodes.
- Auth-gated screens still compile and mount under Next.js.

## Evidence plan
- Static search confirming server write abstraction is used by migrated write helpers.
- Next build output.
- TypeScript no-emit output.
- Diagnostics on modified files if needed.
