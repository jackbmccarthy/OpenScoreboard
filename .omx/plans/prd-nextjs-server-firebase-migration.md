# PRD: Next.js Server-Write Migration

## Goal
Convert OpenScoreboard from Vite to Next.js while keeping the current product behavior and Realtime Database contract intact.

## Non-negotiables
- Existing Firebase Realtime Database field names remain unchanged.
- Existing object shapes remain unchanged.
- Existing database paths remain unchanged.
- Realtime client updates continue to flow through current listener paths.
- Current browser-originated Firebase writes are moved to the server for the migrated surface.

## User stories
1. As an authenticated operator, I can use the app through a Next.js frontend without losing any current routes or workflows.
2. As a scoring client, I still see realtime updates when a match, team match, table, scoreboard, or player list changes.
3. As a maintainer, I can merge this branch without forcing downstream consumers to change field names or database object parsing.

## Scope
- Replace Vite bootstrap with Next.js bootstrap and route files.
- Add server endpoints/actions for current Firebase write operations.
- Preserve client-side subscriptions for live scoreboard updates.
- Keep auth available in the browser for current login flows unless a route requires server mediation.

## Out of scope
- Database schema redesign
- Firestore migration
- Realtime protocol redesign
- Cosmetic redesign
