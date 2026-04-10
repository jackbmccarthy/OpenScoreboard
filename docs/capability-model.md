# Capability Token Model

This document captures the first additive `CI-4` capability-token slice.

## Purpose

Replace raw password-link patterns with signed, revocable capability links while keeping legacy password reads functional during migration.

## Current capability types

- `table_scoring`
- `team_match_scoring`
- `player_registration`
- `public_score_view`

## Storage

Canonical token records live under:
- `capabilityTokens/{tokenId}`

## Runtime configuration

- Production deployments must provide `CAPABILITY_TOKEN_SECRET` or `OPENSCOREBOARD_CAPABILITY_SECRET`.
- Production deployments that issue or resolve capability-token writes must provide `FIREBASE_DATABASE_SECRET` or `FIREBASE_LEGACY_DATABASE_SECRET` until this repo adopts Firebase Admin SDK credentials.
- Development/local runs use a deterministic fallback secret so local links remain testable without extra setup.
- Capability management requests derive `createdBy` from the verified Firebase caller; clients cannot choose token ownership.
- Database proxy reads and writes without Firebase auth are limited to the resolved capability target.
- Table and team-match scoring capability links must include an existing `matchID`; token-only scorers cannot create new matches.
- Scoring capability issuance verifies that the `matchID` already belongs to the requested table or team-match/table slot before a token is minted.
- Capability-token sessions proxy reads through the server database route instead of direct client Firebase reads.
- Public score view links require a scoreboard and either a table or a team-match target so the view can render live data.

Stored metadata includes:
- capability type
- created/expiry/revocation timestamps
- label
- target ids (`tableID`, `teamMatchID`, `playerListID`, `scoreboardID`, `tableNumber`)
- token fingerprint

## Current routes

- server issue/resolve/revoke/list route:
  - [app/api/capabilities/route.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/app/api/capabilities/route.ts)
- capability-aware database proxy:
  - [app/api/database/route.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/app/api/database/route.ts)
  - [src/server/databaseDriver.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/server/databaseDriver.ts)

## Backward compatibility notes

- Existing legacy `tables/{tableID}/password` and `playerLists/{playerListID}/password` fields are still read for migration compatibility.
- New and reset access secrets write `passwordHash`, `passwordUpdatedAt`, and `accessSecretMode: "hashed"` instead of persisting the generated raw secret.
- Existing routes continue to work:
  - `/scoring/table/:id`
  - `/teamscoring/teammatch/:id`
  - `/playerregistration/:id`
  - `/scoreboard/view`
- Secure token support is additive through `?token=...`; it does not replace the old route structure.
- Existing scoreboard URLs/query params are preserved.

## Current limitations

- This repo still relies on Firebase rules for cloud-mode writes because it is not using the Firebase Admin SDK for privileged server writes.
- The token model is a first security slice, not the full CI-4 completion.
- Legacy password flows remain readable until migration retirement is explicitly implemented.
