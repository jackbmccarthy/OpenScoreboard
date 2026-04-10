# TASKS.md — OpenScoreboard v3

_All work below is additive and backwards-compatible. Preserve existing Firebase/AceBase paths, existing preview/index nodes under `users/*`, existing scoreboard URLs/query params, and existing flat match fields until every reader has been migrated and verified. Every implementation task includes schema docs, migration/backfill work, UI states, permission checks, and automated verification before release._

## Status Updates
Completed items are marked here conservatively based on implemented and verified work.

- [done] CI-1 core goal: typecheck baseline restored, `@ts-nocheck` regression gate added, and `npm run typecheck` / build baseline restored.
- [done] CI-4 sub-task: replace raw table/player-list password storage with hashed or capability-based access while preserving legacy reads during migration.
- [done] CI-4 sub-task: add signed QR/operator links for table scoring, team-match scoring, public score viewing, and player self-registration.
- [done] CI-4 sub-task: add auth and permission enforcement in the server database proxy so client-side hiding is not the only protection layer.
- [done] CI-4 sub-task: replace the QR placeholder page with a real generation/management workflow.
- [done] CI-5 sub-task: define `schemaVersion` for matches and team matches.
- [done] CI-5 sub-task: introduce additive normalized structures for per-game data, point history, audit events, and scheduling metadata.
- [done] CI-5 sub-task: preserve current flat fields while normalized structures are added.
- [done] Feature 1.2 foundation: reusable subscription helpers adopted across key admin screens including tables, team matches, scheduled queues, dynamic URLs, scoreboards, templates, players, and bulk pages.
- [done] Feature 1.3 foundation: live table cards now show current match summary, queue count, next queued match, and sync-aware status.
- [done] Feature 1.4 foundation: team-match cards now show live team score and current table summaries.
- [done] Feature 3.1 foundation: scheduled-match queue model now carries explicit queue order, status, notes, and assigned-scorer metadata.
- [done] Feature 3.2 foundation: `Promote next match` and `Promote selected match` workflows exist for table queues.
- [done] Feature 3.4 foundation: bulk queue select/status/time/remove and copy/move between tables are implemented.
- [done] Feature 3.5 foundation: table-level auto-advance settings now support `manual`, `prompt`, and `automatic` modes with delay.
- [done] Feature 5.1 foundation: QR generation/management exists for scoring, public score view, and player registration links with revocation support.
- [done] Feature 5.3 foundation: public score view route now has safe loading/expired/missing-target/no-active-match states plus live spectator context.
- [done] Feature 5.4 foundation: floor judge mode now supports pause/resume, dispute flags, penalty/card updates, and judge notes with audit logging.
- [done] Feature 5.5 foundation: player self-registration supports signed registration tokens while preserving existing routes.
- [done] Feature 2.1 foundation: canonical `tournaments/{tournamentID}` records and user preview/index nodes under `users/{uid}` are implemented.
- [done] Feature 2.2 foundation: tournament list/detail routes and core create/edit UI are implemented.
- [done] Feature 2.2 slice: tournament list now supports create, duplicate, archive, and delete actions.
- [done] Feature 2.3 foundation: bracket records, single-elimination bracket generation, manual seed editing, bracket-node editing, and a public bracket view route are implemented.
- [done] Feature 2.4 foundation: rounds support edit/reorder/status transitions, lock state, visibility changes, and explicit override before mutating locked/completed rounds.
- [done] Feature 2.5 foundation: tournament schedule blocks exist as event-level schedule records and can be assigned to tables.
- [done] Feature 2.5 bridge: tournament schedule blocks can create source matches, queue onto table queues, and resync derived queue items.
- [done] Feature 2.6 foundation: `matchRound` and `eventName` are now carried into table cards, team-match cards, scoring station headers, archived matches, public score view, and scoreboard/editor field lists.
- [done] Feature 4.1 foundation: additive tournament-level role/grant model exists for `owner`, `admin`, `scorer`, and `viewer`.
- [done] Feature 4.2 foundation: tournament staff management now supports direct user grants, pending email invites, role filtering, inline role changes, and revoke flows.
- [done] Feature 4.4 foundation: tournament detail and tournament list now gate major management actions by effective role, and the server database proxy enforces tournament owner/admin writes for authenticated users.

## Critical Issues (Fix First)
### CI-1: Eliminate TypeScript debt and restore a green typecheck baseline
- Task: Remove the current TypeScript delivery blocker by inventorying the 83 `@ts-nocheck` files, fixing the active `npm run typecheck` failures, and establishing a zero-regression baseline.
- Sub-tasks:
  - Record the exact current `npm run typecheck` failure set and pin it as the initial remediation baseline.
  - Fix dependency/type resolution for `next`, `next/server`, `next/navigation`, `next/link`, `firebase/app`, `acebase-client`, `uuid`, and Node `process` globals.
  - Align the typecheck entrypoint so `app/**/*`, `src/**/*`, `next-env.d.ts`, and server-only files are all included intentionally.
  - Prioritize removal of `@ts-nocheck` from runtime-critical files first: `src/components/scoring/ScoringStation.tsx`, `src/functions/scoring.ts`, `src/functions/tables.ts`, `src/functions/teammatches.ts`, `src/lib/database.ts`, `src/lib/auth.tsx`, `src/lib/firebase.ts`, `src/lib/router.tsx`, `src/lib/serverDatabaseClient.ts`, `src/server/databaseDriver.ts`, `src/classes/Match.ts`, `src/classes/Table.ts`, `src/classes/Team.ts`, and `app/api/database/route.ts`.
  - Replace untyped database reads/writes with typed helpers instead of spreading `any` deeper into the app.
  - Replace object copy loops that blindly assign unknown keys with typed constructors or typed normalization helpers.
  - Add a project rule that no new `@ts-nocheck` directives may be introduced.
  - Add a CI gate that fails on both type errors and new `@ts-nocheck` additions.
  - Verify the final state with a clean `npm run typecheck` run in CI conditions.

### CI-2: Fix data ownership and orphaned records on delete
- Task: Define canonical ownership rules for every entity and remove the current behavior where delete actions only remove user index entries but leave canonical records orphaned.
- Sub-tasks:
  - Inventory every create/update/delete path for `tables`, `matches`, `teamMatches`, `teams`, `playerLists`, `scoreboards`, `scoreboardTemplates`, `dynamicurls`, and future `tournaments`.
  - Document the canonical record path, owner preview path, dependent child paths, derived summary paths, and public access paths for each entity.
  - Define hard-delete, soft-delete, archive, and retention behavior separately for tables, matches, team matches, scoreboards, templates, player lists, and teams.
  - Fix the current delete flows that only remove preview nodes: `deleteTable`, `deleteTeamMatch`, `deleteMyTeam`, `deletePlayerList`, `deleteMyScoreboard`, and any similar owner-index-only operations.
  - Define cascade behavior for deleting a table that still has `currentMatch`, `scheduledMatches`, `archivedMatches`, dynamic URLs, and public/QR access tokens.
  - Define cascade behavior for deleting a team match that still has active table assignments, archived matches, scheduled matches, and public score views.
  - Define cascade behavior for deleting a player list that is still attached to one or more tables or registration links.
  - Define cascade behavior for deleting a scoreboard or template that is still referenced by dynamic URLs or saved configurations.
  - Add an orphan scanner/backfill job that detects existing orphaned canonical records and either repairs ownership links or archives the records for manual review.
  - Add dry-run reporting for destructive cleanup jobs before any permanent deletion occurs.
  - Add confirmation copy in the UI that clearly states what dependent data will be archived, detached, or removed.
  - Verify deletes against both Firebase and local AceBase modes.

### CI-3: Unify fragmented realtime sync across scoring and admin surfaces
- Task: Replace ad-hoc per-screen subscription logic with one shared realtime model for scoring, tables, team matches, scheduled queues, and admin dashboards.
- Sub-tasks:
  - Inventory every active realtime listener in the project, including `ScoringStation`, scoreboard runtime listeners, password watchers, and any page-level polling/reload logic.
  - Define one shared subscription contract for table state, current match state, team match state, scheduled queue state, score/history state, and access token state.
  - Standardize loading, reconnecting, stale, conflict, unauthorized, and offline UI states across all live screens.
  - Standardize listener attach/detach ownership so route changes and component unmounts do not leak subscriptions.
  - Replace page-specific refetch-after-mutation flows with live updates wherever the page already depends on mutable data.
  - Ensure subscription helpers expose both raw canonical records and derived view models for list pages.
  - Verify multi-tab behavior so simultaneous admin/scorer sessions stay consistent.
  - Verify reconnect behavior after temporary network loss and server restarts.

### CI-4: Close security gaps in table access, player registration, and QR workflows
- Task: Remove plaintext access secrets from persistent storage/UI flows and replace the current QR placeholder with secure, revocable operator links.
- Sub-tasks:
  - Replace raw `tables/{tableID}/password` and `playerLists/{playerListID}/password` storage with hashed or signed capability-based access tokens while preserving legacy reads during migration.
  - Stop returning raw registration secrets in list APIs and admin screens once secure token generation is in place.
  - Add secure token rotation, revocation, expiration, and audit metadata for every issued QR/operator link.
  - Add signed QR links for table scoring, team-match scoring, public score viewing, and player self-registration.
  - Define how old password-based links continue to work during the migration window and how they are retired safely.
  - Add auth and permission enforcement in the server database proxy so client-side hiding is not the only protection layer.
  - Ensure local/AceBase mode still has a safe capability model for demos and offline development.
  - Add abuse protection for public/QR endpoints: invalid token handling, rate limiting strategy, and suspicious access logging.
  - Replace the current QR placeholder page with a real generation/management workflow.
  - Verify that no plaintext secret is exposed in logs, copied links, list responses, or exported admin data.

### CI-5: Evolve the flat match schema without breaking current consumers
- Task: Introduce an extensible match schema for games, audit history, point history, tournament context, and future sports rules while continuing to support existing flat fields and readers.
- Sub-tasks:
  - Define `schemaVersion` for matches and team matches.
  - Introduce additive normalized structures for per-game data, point history, audit events, tournament/event references, and scheduling metadata.
  - Preserve all current flat fields such as `game1AScore` through `game9BScore`, `isGame1Started` through `isGame9Finished`, `matchRound`, `eventName`, `teamMatchID`, `sportName`, and `scoringType`.
  - Define dual-write rules so every write to the new normalized model updates the existing flat fields until legacy readers are retired.
  - Define dual-read rules so old matches without the new structures still render correctly everywhere.
  - Add a backfill job that derives normalized game/history structures from existing flat matches wherever enough data exists.
  - Update scoreboard bindings so both legacy and new fields remain available.
  - Verify that tournament/bracket features can extend the match object without another schema rewrite.

## Feature 1: Realtime Scoring/Admin Sync
### Sub-Feature 1.1: Firebase subscriptions in ScoringStation
- Task: Rebuild `src/components/scoring/ScoringStation.tsx` around a shared subscription/store layer so live scoring is consistent, typed, and conflict-aware.
- Sub-tasks:
  - Move initial table/team-match fetch and live subscription setup into dedicated hooks/services instead of mixing them directly into component effects.
  - Subscribe to table state, current match state, team match state, queue state, access-token changes, and score history from one coordinated source.
  - Replace field-by-field match listeners with a smaller number of canonical record listeners wherever that reduces listener fan-out without losing UI responsiveness.
  - Keep support for both table scoring mode and team-match scoring mode.
  - Ensure the active match can switch live without requiring a full page refresh.
  - Handle table reassignment, team-match table-number changes, and match archival while the screen is open.
  - Add local optimistic updates for point entry and reconcile them when the canonical record returns.
  - Surface reconnecting/conflict states directly inside the scoring controls.
  - Prevent duplicate subscriptions when React effects rerun or route params change.
  - Add regression tests for scoring while another client updates the same match.

### Sub-Feature 1.2: Shared subscription model across all admin screens
- Task: Build one reusable admin subscription pattern and adopt it across every screen that currently refetches live data manually.
- Sub-tasks:
  - Define reusable subscription helpers for tables, team matches, scheduled queues, dynamic URLs, scoreboards, templates, player lists, and tournaments.
  - Adopt the shared subscription model in `src/screens/TablesPage.tsx`.
  - Adopt the shared subscription model in `src/screens/TeamMatchesPage.tsx`.
  - Adopt the shared subscription model in `src/screens/ScheduledTableMatchesPage.tsx`.
  - Adopt the shared subscription model in `src/screens/DynamicURLsPage.tsx`.
  - Adopt the shared subscription model in `src/screens/ScoreboardsPage.tsx` and `src/screens/ScoreboardTemplatesPage.tsx`.
  - Adopt the shared subscription model in `src/screens/PlayersPage.tsx`, `src/screens/BulkPlayerPage.tsx`, and `src/screens/BulkTeamsPage.tsx` where live updates matter.
  - Standardize empty/loading/error states and toast behavior across all subscribed admin screens.
  - Add a reusable unsubscribe lifecycle so list pages do not leak listeners after modal navigation or route changes.
  - Verify that list pages update when the underlying canonical record changes from another browser or device.

### Sub-Feature 1.3: Live table state in TablesPage
- Task: Turn `TablesPage` into a live operations board that reflects each table’s current match, score, queue depth, and status in real time.
- Sub-tasks:
  - Join each table record with its `currentMatch` record and derive current competitor names.
  - Join each table with its scheduled queue and derive scheduled match count and next-up match summary.
  - Derive table status values such as `idle`, `queued`, `warmup`, `active`, `paused`, `between-games`, `completed-awaiting-promotion`, and `attention-required`.
  - Show current score directly on each table card.
  - Show the next scheduled match directly on each table card.
  - Show a queue count badge directly on each table card.
  - Show a clear last-updated/sync state indicator directly on each table card.
  - Ensure every live field updates without a manual reload button.
  - Handle tables with no current match, no queue, missing player list, or invalid linked data gracefully.
  - Add list sorting/filtering by table status for operators managing many tables.

### Sub-Feature 1.4: Live match state in TeamMatchesPage
- Task: Turn `TeamMatchesPage` into a live operations view for multi-table team matches.
- Sub-tasks:
  - Subscribe to the canonical `teamMatches/{teamMatchID}` record for each visible team match card.
  - Derive and display current team score in real time.
  - Derive and display per-table current match summaries from `currentMatches`.
  - Derive and display per-table status such as `not-started`, `active`, `awaiting-lineup`, `completed`, and `archived`.
  - Show next queued matchup or unassigned round tasks for the team match when tournament/queue data exists.
  - Highlight stale or broken table references on the card instead of silently failing.
  - Keep the visible preview list synced when teams are renamed elsewhere.
  - Remove the need to manually reload after creating, editing, deleting, or archiving a team match.
  - Add a detail drill-in state for operators who need more than the high-level card.

### Sub-Feature 1.5: Real-time undo and point history propagation
- Task: Make scoring history and undo availability live data that stays synchronized across scoring, admin, and public views.
- Sub-tasks:
  - Persist every scoring action as an ordered history event.
  - Compute undo availability from canonical history, not local component state.
  - Broadcast undo/redo effects to all connected scoring/admin clients in real time.
  - Update table summaries and team-match summaries immediately after undo or correction events.
  - Ensure scoreboards/public views refresh when point history rewrites the current score.
  - Define conflict rules for simultaneous undo attempts from two clients.
  - Preserve history order after reconnect or delayed writes.
  - Add tests for undo after point additions, manual corrections, game completion, and match archival.

## Feature 2: Tournament/Event Model
### Sub-Feature 2.1: Tournament class and data model
- Task: Introduce a new tournament/event domain model that can coexist with the current table/team-match data model.
- Sub-tasks:
  - Define a canonical `tournaments/{tournamentID}` record with owner, metadata, timezone, venue, status, and settings.
  - Define a user preview/index path for tournaments under `users/{uid}` without breaking existing user data structures.
  - Define additive child structures for events, rounds, brackets, schedule blocks, registration settings, staff assignments, and public visibility.
  - Define references from tournaments to tables, player lists, teams, team matches, scoreboards, and templates.
  - Define optional references from tables/matches/team matches back to tournament and event identifiers.
  - Keep tournament references optional so non-tournament scoring flows remain unchanged.
  - Define archive status and lifecycle states for draft, published, in-progress, completed, and archived tournaments.
  - Document the schema with explicit compatibility notes for existing flat match fields and owner preview nodes.

### Sub-Feature 2.2: Tournament screen (new)
- Task: Add a dedicated tournament management screen and route without disrupting existing navigation patterns.
- Sub-tasks:
  - Add a top-level route and navigation entry for tournaments.
  - Create a tournament list view with create, duplicate, archive, and delete actions.
  - Create a tournament detail view with tabs/sections for overview, events, brackets, schedule, staff, registration, and public settings.
  - Add create/edit forms for tournament name, short code, venue, timezone, dates, description, and visibility.
  - Add empty, loading, error, and unauthorized states for the new screen.
  - Add deep links from tournament records to related team matches, tables, player lists, and public score pages.
  - Preserve direct access to old team-match/table pages for users who do not adopt tournaments.

### Sub-Feature 2.3: Bracket generation and display
- Task: Add bracket generation and bracket rendering that can drive match creation without changing existing match IDs or score storage.
- Sub-tasks:
  - Define supported initial bracket formats and the storage contract for bracket nodes, seeds, byes, and advancement rules.
  - Start with a clearly scoped first implementation format and leave extension points for additional formats.
  - Add seed import and manual seed editing.
  - Add bye placement rules and validation.
  - Add automatic next-round matchup generation from previous results.
  - Add manual override controls for bracket corrections with audit logging.
  - Add bracket display views for both admins and public spectators.
  - Show bracket node status values such as `unassigned`, `queued`, `on-table`, `in-progress`, `final`, and `disputed`.
  - Link bracket nodes to the underlying scheduled/team-match records without duplicating scoring truth.
  - Verify bracket rendering on desktop and mobile.

### Sub-Feature 2.4: Round management
- Task: Add explicit round management so tournaments can coordinate table assignment, advancement, and visibility.
- Sub-tasks:
  - Define round records with round order, title, short label, event association, status, and visibility.
  - Add UI to create, rename, reorder, publish, lock, and archive rounds.
  - Add round-level controls to bulk assign matches to tables or queues.
  - Add round-level controls to mark a round ready, active, paused, complete, or archived.
  - Prevent accidental edits to locked/completed rounds without an explicit override flow.
  - Allow advancement rules to promote winners to the next round automatically.
  - Allow manual overrides when the bracket operator needs to repair or reseed a round.
  - Surface round context inside scoring, table views, team-match views, and public score views.

### Sub-Feature 2.5: Event scheduling versus table scheduling
- Task: Separate event scheduling from per-table scheduling while keeping the current `tables/{tableID}/scheduledMatches` model functional.
- Sub-tasks:
  - Define event-level schedule records that describe when a match should happen irrespective of table assignment.
  - Define table-assignment records that bind an event-scheduled match to a specific table/queue slot.
  - Preserve `tables/{tableID}/scheduledMatches` as a derived compatibility layer during rollout.
  - Document which fields are canonical at the event layer and which are derived at the table layer.
  - Add sync rules so moving a match between tables updates both the event schedule and the derived table queue view.
  - Handle unassigned scheduled matches that belong to an event but not yet to a table.
  - Handle reschedules that change time without changing table, table without changing time, or both.
  - Prevent race conditions when two admins assign the same scheduled match concurrently.

### Sub-Feature 2.6: Match round field utilization
- Task: Turn the existing `matchRound` and `eventName` fields into reliable compatibility fields backed by real tournament metadata.
- Sub-tasks:
  - Standardize how `matchRound`, `eventName`, `tournamentID`, `eventID`, and `roundID` are populated when a match is created or promoted.
  - Keep `matchRound` and `eventName` filled for legacy readers even when normalized tournament references exist.
  - Backfill round/event strings for existing matches where the information can be inferred from related team matches or schedules.
  - Display round/event labels in scoring, table cards, team-match cards, archived match views, and public score views.
  - Expose round/event fields to scoreboard bindings so overlays can show them without custom code.
  - Add validation so moving a match between rounds updates both normalized refs and compatibility strings together.

## Feature 3: Queue-to-Table Workflow
### Sub-Feature 3.1: Scheduled match queue UI
- Task: Replace the current scheduled match list with a real queue workflow suitable for operators running multiple matches.
- Sub-tasks:
  - Define queue item states such as `scheduled`, `queued`, `called`, `active`, `paused`, `completed`, `cancelled`, and `archived`.
  - Extend the scheduled-match model with stable ordering, source references, operator notes, and status metadata without breaking existing queue readers.
  - Redesign the scheduled-match screen to show queue position, table assignment, event/round, and scheduled start time.
  - Add filters by table, event, round, status, and assigned scorer.
  - Add search for competitors/teams when the queue grows large.
  - Add empty-state copy for tables with no queue.
  - Add visual indicators for late matches, unassigned lineups, and blocked promotions.

### Sub-Feature 3.2: “Promote next match” to active scoring
- Task: Add an explicit workflow for moving the next queue item into active scoring while preserving existing match IDs and archives.
- Sub-tasks:
  - Add a `Promote next match` action to table-level admin views.
  - Add a `Promote selected match` action for operators who skip queue order intentionally.
  - If a table already has an active match, require the operator to archive, pause, or replace it explicitly.
  - When promoting a queued item, set the table `currentMatch`, update queue state, and retain queue audit history.
  - Preserve the existing scheduled-match summary structure for backwards compatibility while adding promotion metadata.
  - Auto-fill scoring context such as sport, scoring type, round, event, and team-match references from the queued item.
  - Handle promotion from tournament events, standalone scheduled matches, and team-match queues with the same core workflow.
  - Add tests for promotion with empty queue, invalid match record, and concurrent promotion attempts.

### Sub-Feature 3.3: Queue ordering and drag-drop
- Task: Add stable queue reordering controls that work on desktop and touch devices.
- Sub-tasks:
  - Stop depending on push-order insertion as the queue sort key.
  - Add an explicit persistent order field for queue items.
  - Add drag-and-drop reordering for desktop.
  - Add touch-friendly reorder controls for mobile.
  - Add keyboard-accessible move up/move down controls as a non-pointer fallback.
  - Ensure queue order updates propagate to all subscribers immediately.
  - Prevent reorder conflicts from overwriting each other silently when two admins reorder simultaneously.
  - Recompute the derived “next scheduled match” for tables as soon as order changes.

### Sub-Feature 3.4: Bulk queue operations
- Task: Add batch controls so staff can manage many scheduled matches quickly.
- Sub-tasks:
  - Add bulk select for queue items.
  - Add bulk assign to table.
  - Add bulk change start time.
  - Add bulk pause/resume.
  - Add bulk remove/cancel.
  - Add bulk duplicate/copy to another table or round.
  - Add bulk move between rounds/events where tournament context exists.
  - Add progress and error reporting for partial-success bulk operations.
  - Add audit trail entries for every bulk action.

### Sub-Feature 3.5: Auto-advance options
- Task: Add optional automation for advancing tables from one queued match to the next.
- Sub-tasks:
  - Define table-level and event-level auto-advance settings.
  - Support `manual only`, `prompt operator`, and `automatic after archive` modes.
  - Support optional delay timers before automatic promotion.
  - Prevent automatic promotion if the current match result is incomplete, disputed, or missing required metadata.
  - Auto-carry round/event/team-match context into the promoted match.
  - Update public score views and table cards automatically when auto-advance fires.
  - Add clear operator messaging when automation is blocked.
  - Add tests for automatic promotion after normal completion, cancellation, undo, and reconnect scenarios.

## Feature 4: Admin/Owner Roles & Permissions
### Sub-Feature 4.1: Role data model (owner, admin, scorer, viewer)
- Task: Introduce an additive permission model that supports shared administration without breaking current owner-based flows.
- Sub-tasks:
  - Define a role/grant schema for `owner`, `admin`, `scorer`, and `viewer`.
  - Define scope levels for global account objects, tournament objects, tables, team matches, player lists, scoreboards, templates, and public views.
  - Preserve current ownership behavior as the default when no extra grants exist.
  - Add support for direct user grants and pending email-based invitations.
  - Define effective-permission resolution when a user has multiple grants from different scopes.
  - Define read-only behavior explicitly instead of treating missing write access as a generic error.
  - Add compatibility rules for local/AceBase mode where full auth may not exist.

### Sub-Feature 4.2: Staff access grants UI
- Task: Add management UIs so owners can invite, review, and revoke staff access cleanly.
- Sub-tasks:
  - Add a staff management screen or panel for tournaments and account-level administration.
  - Add invite form fields for email, role, scope, expiration, and optional note.
  - Add a pending-invite list with resend and revoke actions.
  - Add an active-staff list with effective role and scope summaries.
  - Add revoke/downgrade flows with confirmation and impact messaging.
  - Add filters to find staff by role or scope quickly.
  - Add audit history for grant creation, change, acceptance, rejection, and revocation.

### Sub-Feature 4.3: Template administration UI
- Task: Separate personal template workflows from admin-managed template workflows and gate them by role.
- Sub-tasks:
  - Keep built-in templates immutable by default.
  - Add an admin-managed templates view with create, edit, activate/deactivate, duplicate, and archive actions.
  - Distinguish built-in, admin-managed, and personal templates visually in the UI.
  - Allow viewers/scorers to use templates they can see without allowing them to modify protected templates.
  - Add publish/unpublish behavior so admins can prepare templates before exposing them broadly.
  - Add usage metadata so admins can see which scoreboards were created from which template.
  - Preserve existing template IDs and user-created scoreboards during the transition.

### Sub-Feature 4.4: Permission-gated operations
- Task: Enforce permissions consistently in both client navigation and server-side data writes.
- Sub-tasks:
  - Gate destructive operations such as delete, archive, ownership transfer, queue reorder, bulk import, template publish, and scoreboard template admin.
  - Gate scoring actions so a `viewer` cannot submit points and a `scorer` cannot manage protected templates or grants.
  - Gate tournament-only operations so non-tournament staff cannot change bracket structure.
  - Add a shared permission-check helper used by UI components.
  - Add server-side validation in the database proxy for every write action that targets protected entities.
  - Return explicit unauthorized/forbidden errors rather than generic failures.
  - Add read-only disabled states and explanatory copy in the UI.
  - Verify that public/QR views never expose admin-only controls.

### Sub-Feature 4.5: Ownership transfer
- Task: Add safe transfer workflows for account-owned resources and tournament-owned resources.
- Sub-tasks:
  - Define which entities can be transferred directly and which must be reassigned via new owner grants first.
  - Add transfer UI for scoreboards, templates, tournaments, tables, player lists, and teams where appropriate.
  - Validate that the new owner exists and has accepted required access before completing the transfer.
  - Update canonical ownership and owner preview/index nodes together without changing resource IDs.
  - Preserve dynamic URLs, QR links, scoreboard view URLs, and public links after transfer.
  - Add transfer audit history and confirmation messaging.
  - Add rollback/recovery guidance for failed partial transfers.

## Feature 5: QR/Phone Operator Tools
### Sub-Feature 5.1: QR code generation (per table, per matches)
- Task: Add first-class QR generation and management for every operator/public workflow that currently depends on copied URLs.
- Sub-tasks:
  - Generate QR codes for table scoring access.
  - Generate QR codes for team-match table scoring access.
  - Generate QR codes for public score view pages.
  - Generate QR codes for player self-registration links.
  - Generate QR codes for specific queued/scheduled matches where direct handoff is useful.
  - Store token metadata, creation time, expiration, and revocation status for each generated QR.
  - Add print-friendly layouts for event staff handouts.
  - Add regenerate and revoke actions without breaking unrelated links.
  - Replace any raw-password-in-URL pattern with signed capability links.

### Sub-Feature 5.2: Phone-first scoring station (simplified)
- Task: Create a dedicated simplified scoring experience optimized for phones.
- Sub-tasks:
  - Add a phone-first route/layout that uses the same canonical scoring data as the full scoring station.
  - Simplify the visible controls to the minimum needed during live operation.
  - Increase touch target sizes for point, undo, timeout, side-switch, and correction actions.
  - Keep match context, sync state, and current server visible without requiring scrolling.
  - Add a compact settings drawer instead of always-on advanced controls.
  - Support portrait and landscape layouts.
  - Preserve permission enforcement so phone links cannot elevate access beyond the issued role.
  - Verify the phone-first layout on common small-screen breakpoints.

### Sub-Feature 5.3: Public score view page
- Task: Add a spectator-safe public score view that shows live match/table status without exposing admin controls.
- Sub-tasks:
  - Add a public score route that can resolve table, team-match, or match context from a signed/public token.
  - Display current competitor names, live score, server, round/event, table name, and table status.
  - Display next scheduled match when queue data exists and is safe to expose.
  - Display completed match summary after a match ends.
  - Auto-update in real time using the shared subscription model.
  - Add clear fallback copy for `match not started`, `paused`, `completed`, and `link expired` states.
  - Ensure the page is responsive and scoreboard-like on both desktop and mobile.
  - Ensure no admin mutation controls are reachable from this page.

### Sub-Feature 5.4: Floor judge mode
- Task: Add a limited-access judge/operator mode for resolving on-floor issues without exposing full admin power.
- Sub-tasks:
  - Define judge permissions separately from scorer/admin roles if needed, or map judge duties cleanly onto existing roles.
  - Add quick actions for pause/resume, dispute flag, penalty/card updates, lineup check, and score correction request.
  - Add a note field for rulings or interruptions that feeds the match audit trail.
  - Show clear visual status when a table is under review or paused by a judge.
  - Keep judge actions visible to admins in real time.
  - Verify that judge mode cannot edit unrelated tables or tournament setup unless explicitly granted.

### Sub-Feature 5.5: Player self-registration via QR
- Task: Replace the current password-based registration pattern with a secure QR-driven registration flow.
- Sub-tasks:
  - Convert `PlayerRegistrationPage` to resolve access through signed registration tokens instead of exposed passwords.
  - Keep existing player-list routes functional while adding the token-based access path.
  - Add registration form configuration per event/player list, including required and optional fields.
  - Add duplicate detection against existing player lists before registration is finalized.
  - Add pending/approved/rejected registration states when manual review is enabled.
  - Add success, duplicate, expired-link, and unauthorized states with explicit messaging.
  - Add registration audit entries so admins can trace who registered and when.
  - Add throttling/abuse protection for public registration endpoints.

## Feature 6: TypeScript Migration
### Sub-Feature 6.1: Install missing type definitions (`@types/node`, Firebase types, AceBase types, UUID types)
- Task: Restore all missing or misresolved type dependencies so the compiler can resolve runtime packages in every environment.
- Sub-tasks:
  - Verify the declared `@types/node` dependency is actually available in local and CI installs.
  - Verify Firebase v8 type resolution works with the current import style.
  - Verify `uuid` type resolution works everywhere it is imported.
  - Verify `acebase-client` ships usable types; if not, add local declaration shims with the narrowest possible surface.
  - Add any missing ambient module declarations only for packages that truly lack usable upstream types.
  - Remove temporary type shims once the real package types are confirmed to work.
  - Document the final dependency/type resolution strategy so it stays stable in CI.

### Sub-Feature 6.2: Fix `tsconfig` issues for the Next.js + Vite hybrid app
- Task: Make the TypeScript configuration intentional and stable across the hybrid app/runtime setup.
- Sub-tasks:
  - Audit `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, and `tsconfig.typecheck.json` for overlapping or conflicting settings.
  - Ensure Next app files, Vite client files, server files, and shared source files are included in the correct config.
  - Ensure JSX, module resolution, path aliases, DOM libs, and Node libs are defined once and inherited cleanly.
  - Ensure `next-env.d.ts` participates in typecheck when Next files are included.
  - Ensure server-only code is not forced into client-only DOM assumptions and vice versa.
  - Ensure `process.env` access is typed correctly in files that run in both browser and server contexts.
  - Add comments/docs describing why the split configs exist and which command uses which config.

### Sub-Feature 6.3: Remove `@ts-nocheck` from scoring core files
- Task: Fully type the live scoring runtime before broader UI cleanup.
- Sub-tasks:
  - Remove `@ts-nocheck` from `src/components/scoring/ScoringStation.tsx`.
  - Remove `@ts-nocheck` from `src/App.tsx` if routing/types are still suppressed there.
  - Type every scoring action callback, state object, route param, and async helper used by the scoring station.
  - Replace anonymous record lookups with typed `Match`, `Table`, `TeamMatch`, `ScheduledMatch`, and history types.
  - Type the manual score correction state and settings draft state.
  - Type shared scoring helper return values in `src/functions/scoring.ts`, `src/functions/tables.ts`, and `src/functions/teammatches.ts`.
  - Add unit coverage for typed helpers that calculate current game, match score, queue summaries, and archive payloads.

### Sub-Feature 6.4: Remove `@ts-nocheck` from screens
- Task: Type every screen-level component so page routing, params, and data contracts are explicit.
- Sub-tasks:
  - Remove `@ts-nocheck` from `src/screens/ArchivedMatchesPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/BulkPlayerPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/BulkTeamsPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/DynamicURLsPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/EditorPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/LoginPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/MatchPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/MyAccountPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/PlayerRegistrationPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/PlayersPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/QRCodePage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/ScheduledTableMatchesPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/ScoreboardPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/ScoreboardTemplatesPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/ScoreboardViewPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/ScoreboardsPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/SettingsPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TableScoringPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TablesPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TeamDetailPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TeamMatchesPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TeamsPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/TeamsScoringPage.tsx`.
  - Remove `@ts-nocheck` from `src/screens/login/index.tsx`.
  - Replace loosely typed route params with explicit route-param types everywhere.
  - Replace generic array state with typed tuple/list models for preview rows and canonical records.

### Sub-Feature 6.5: Remove `@ts-nocheck` from editor files
- Task: Type the full GrapesJS/editor surface so template editing does not remain an untyped island.
- Sub-tasks:
  - Remove `@ts-nocheck` from `src/editor/fieldLists.ts`.
  - Remove `@ts-nocheck` from `src/editor/initializeGrapesJS.ts`.
  - Remove `@ts-nocheck` from container block files under `src/editor/leftpanel/container/*`.
  - Remove `@ts-nocheck` from court-side service files under `src/editor/leftpanel/courtside/*`.
  - Remove `@ts-nocheck` from media/text block loaders under `src/editor/leftpanel/load*`.
  - Remove `@ts-nocheck` from match-point helpers under `src/editor/leftpanel/matchpoint/*`.
  - Remove `@ts-nocheck` from penalty flag block files under `src/editor/leftpanel/penaltyflags/*`.
  - Remove `@ts-nocheck` from service icon block files under `src/editor/leftpanel/service/*`.
  - Remove `@ts-nocheck` from timeout block files under `src/editor/leftpanel/timeout/*`.
  - Remove `@ts-nocheck` from editor plugins under `src/editor/plugins/*`.
  - Remove `@ts-nocheck` from right-panel border control files under `src/editor/rightpanel/border/*`.
  - Define typed field-list items, plugin options, block config objects, and editor-instance helpers.

### Sub-Feature 6.6: Type the database layer
- Task: Give the client/server database abstraction a typed contract so every data write is explicit.
- Sub-tasks:
  - Type the ref wrapper returned by `src/lib/database.ts`.
  - Type the auth helpers in `src/lib/auth.tsx`.
  - Type Firebase config access and environment parsing in `src/lib/firebase.ts` and `src/lib/env.ts`.
  - Type the server write proxy in `src/lib/serverDatabaseClient.ts`.
  - Type the database execution engine in `src/server/databaseDriver.ts`.
  - Define typed action payloads for `set`, `update`, `push`, and `remove` operations.
  - Define typed success/error result contracts returned by the server database API.
  - Add typed permission/auth context to server write execution.

### Sub-Feature 6.7: Type the `Match`, `Table`, `Scoreboard`, `Team`, `Player`, and `TeamMatch` classes/models
- Task: Replace dynamic model construction with explicit, reusable TypeScript model contracts.
- Sub-tasks:
  - Type `src/classes/Match.ts` and make `createNew` return a typed record.
  - Type `src/classes/Table.ts` and normalize table defaults through one typed constructor/factory.
  - Type `src/classes/Scoreboard.ts`.
  - Type `src/classes/Player.ts`.
  - Type `src/classes/Team.ts`.
  - Type `src/classes/TeamMatch.ts`.
  - Replace `any`-based normalization with typed helper functions.
  - Ensure the canonical type definitions in `src/types/matches.ts` stay aligned with the class/factory outputs.

### Sub-Feature 6.8: Type the API route
- Task: Make the Next API boundary fully typed so database write actions are validated before execution.
- Sub-tasks:
  - Type `app/api/database/route.ts` request parsing.
  - Type the response payload for success and failure states.
  - Define a validated request schema for `actions` arrays.
  - Define typed auth-token extraction and permission error responses.
  - Ensure the route stays compatible with both Next runtime expectations and the client caller contract.

### Sub-Feature 6.9: Fix typecheck CI/CD
- Task: Make type safety a permanent part of delivery rather than a one-time cleanup.
- Sub-tasks:
  - Add `npm run typecheck` as a required CI status check.
  - Ensure CI installs all dependencies needed for hybrid Next/Vite typing.
  - Add a dedicated failure message/artifact that points to the typed migration guide when typecheck fails.
  - Prevent merges when typecheck fails.
  - Add a follow-up rule that new files should default to typed strictness instead of inheriting legacy `any` patterns.

### Sub-Feature 6.10: Type the scoreboard runtime and binding layer
- Task: Remove `@ts-nocheck` from the overlay runtime so editor and runtime contracts stay aligned.
- Sub-tasks:
  - Remove `@ts-nocheck` from `src/scoreboard/addCSS.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/addFieldListeners.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/addScoreboardSettingListeners.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/dynamicurls.ts`.
  - Remove `@ts-nocheck` from every file under `src/scoreboard/fields/*` that is currently suppressed.
  - Remove `@ts-nocheck` from `src/scoreboard/getBroadcastChannelName.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/index.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/interfaces/Match.ts` and `src/scoreboard/interfaces/Player.ts`.
  - Remove `@ts-nocheck` from `src/scoreboard/match.ts`, `src/scoreboard/players.ts`, `src/scoreboard/runAllListeners.ts`, and `src/scoreboard/teamUpdates.ts`.
  - Align scoreboard runtime field names with the typed match/team/tournament schema, including new round/event/history bindings.

## Feature 7: Scoring UX Enhancements
### Sub-Feature 7.1: Undo last scoring action
- Task: Add a safe, audited undo flow for live scoring.
- Sub-tasks:
  - Persist each point-add, point-remove, manual correction, and game-complete action as a reversible history event.
  - Add an undo control in the scoring station with explicit disabled states.
  - Restrict undo scope to the most recent reversible action by default.
  - Show who performed the last action and when it happened.
  - Recompute score, service, game state, and match state from canonical history after undo.
  - Ensure undo works across clients and not just in local component state.
  - Add permission checks so only allowed roles can undo.
  - Add tests for undo immediately after a point, after a timeout, after manual correction, and after reconnect.

### Sub-Feature 7.2: Point/scoring history timeline
- Task: Add an operator-facing history timeline that makes live scoring auditable and recoverable.
- Sub-tasks:
  - Add a canonical point-history structure to each match.
  - Record timestamp, actor, device/session, event type, affected game, previous value, new value, and optional note.
  - Add a timeline panel to the scoring station.
  - Add a read-only timeline view to admin pages and archived match views.
  - Add filters by game, actor, event type, and correction/undo status.
  - Highlight disputed or corrected events clearly.
  - Allow export of the history timeline for support/debugging if needed.

### Sub-Feature 7.3: Destructive action confirmations
- Task: Ensure risky scoring/admin actions always show clear impact before execution.
- Sub-tasks:
  - Add confirmations for match reset, game reset, archive current match, delete queue item, delete table, delete team match, delete player list, delete scoreboard, and ownership transfer.
  - Add confirmations for manual score overwrite when it changes an already-finished game or match.
  - Add confirmations when promoting a queued match would replace an active one.
  - Include the exact impacted entity names and follow-on effects in the confirmation copy.
  - Add “cannot undo” language where the action truly is irreversible.

### Sub-Feature 7.4: Clearer sync state indicators
- Task: Make sync health visible so scorers know whether their changes are live.
- Sub-tasks:
  - Add a shared sync-status component that can show `connecting`, `live`, `saving`, `pending local change`, `reconnecting`, `conflict`, and `error`.
  - Display sync status prominently in the scoring station.
  - Display sync status in live admin pages where edits can occur.
  - Show last successful sync time when useful.
  - Show explicit conflict recovery messaging when another client overwrites state.
  - Keep sync status lightweight in phone-first mode.

### Sub-Feature 7.5: Manual score correction UX
- Task: Add a structured correction flow instead of relying on raw field edits.
- Sub-tasks:
  - Add a correction dialog that targets a specific game and side.
  - Show the current score, proposed score, derived winner impact, and rule validation result before saving.
  - Require an optional or mandatory correction reason based on configuration.
  - Write corrections through the canonical history/audit layer instead of direct silent field replacement.
  - Update table/team-match summaries immediately after correction.
  - Prevent invalid impossible scores according to sport/scoring rules unless an explicit override is used.

### Sub-Feature 7.6: Game/match undo
- Task: Support higher-level rollback when an entire game or archived match must be reopened.
- Sub-tasks:
  - Add a “reopen last completed game” workflow.
  - Add a “reopen archived match” workflow for a configurable safe window.
  - Restore table/team-match aggregate state when a match is reopened.
  - Restore queue state if reopening should return a match to active or queued status.
  - Gate these actions behind elevated permissions.
  - Add prominent audit history and spectator/public update rules for reopen events.

## Feature 8: Tables Page Live State
### Sub-Feature 8.1: Show current match names on each table
- Task: Display the live participant names for each table card.
- Sub-tasks:
  - Resolve current table `currentMatch` IDs into live participant names.
  - Support singles, doubles, and team-match-derived participant naming.
  - Show placeholders when a match is assigned but lineups are incomplete.
  - Keep names updated when roster or lineup changes occur elsewhere.

### Sub-Feature 8.2: Show current score
- Task: Display live score summaries on each table card.
- Sub-tasks:
  - Derive current game score and match score from the canonical match record.
  - Show a compact score format that works on both desktop and mobile cards.
  - Distinguish between live game score and completed match score.
  - Handle tables without an active game gracefully.

### Sub-Feature 8.3: Show scheduled match count
- Task: Surface queue depth directly on the tables overview.
- Sub-tasks:
  - Count queued/scheduled items per table.
  - Exclude archived/completed items from the active queue count.
  - Update the count in real time.
  - Add count badges that remain readable on small cards.

### Sub-Feature 8.4: Show next scheduled match
- Task: Surface the immediate next-up match directly on the table card.
- Sub-tasks:
  - Derive the next scheduled item from stable queue order.
  - Show competitor/team names, round/event if available, and scheduled time.
  - Show “no next match” explicitly when the queue is empty.
  - Update the preview instantly after reorder, promotion, or cancellation.

### Sub-Feature 8.5: Show table status (active/idle/paused)
- Task: Add a reliable live status badge for each table.
- Sub-tasks:
  - Define status derivation rules from table, match, and queue state.
  - Add visual badges/colors/icons for idle, queued, active, paused, warmup, and attention-required states.
  - Keep the status consistent with public score view and scoring station messaging.
  - Add filters/sorting by status for larger operations.

### Sub-Feature 8.6: Live update without page refresh
- Task: Remove manual refresh as a dependency for the tables overview.
- Sub-tasks:
  - Subscribe to live table summaries instead of one-time fetches.
  - Update cards after create/edit/delete, promotion, queue changes, and score changes automatically.
  - Handle reconnection without wiping the card layout or scroll position.
  - Verify performance with many tables visible at once.

## Feature 9: Team Matches Operations
### Sub-Feature 9.1: Per-table current match display
- Task: Show every active team-match table assignment and its live state in one place.
- Sub-tasks:
  - Resolve `currentMatches` into per-table cards or rows.
  - Show table number/name, player names, current score, and match status for each active sub-match.
  - Show unassigned tables explicitly so operators know what still needs attention.
  - Link each table row directly to its scoring station.

### Sub-Feature 9.2: Team score aggregation view
- Task: Give operators a clear aggregate view of team-match progress.
- Sub-tasks:
  - Show official `teamAScore`/`teamBScore` in real time.
  - Show optional derived metrics such as completed tables won, tables in progress, and remaining tables.
  - Detect and highlight mismatches between official aggregate score and completed sub-match results.
  - Show round/event context when the team match belongs to a tournament.

### Sub-Feature 9.3: Quick jump to any table’s scoring
- Task: Reduce navigation friction for operators moving between team-match tables.
- Sub-tasks:
  - Add direct jump controls from `TeamMatchesPage` and the team-match detail view into any active table scoring screen.
  - Preserve team-match context and return navigation when the operator leaves scoring.
  - Indicate whether the target table is idle, in progress, paused, or locked by another scorer.
  - Add touch-friendly jump controls for mobile.

### Sub-Feature 9.4: Match archive history per team
- Task: Make archived sub-match results easy to audit per team match.
- Sub-tasks:
  - Expand archived match summaries to include table, players, score, round, event, and archive time.
  - Add filters by table, team, round, and date.
  - Add links from archived summaries to detailed match history/audit views.
  - Preserve current archived match storage while layering richer metadata on top.

### Sub-Feature 9.5: Lineup management
- Task: Add explicit lineup planning and validation for team matches.
- Sub-tasks:
  - Define lineup records per team match, per round, and per table when needed.
  - Add UI to assign players to upcoming sub-matches before promotion to active play.
  - Validate duplicate player usage, missing players, and any sport-specific lineup constraints.
  - Auto-fill new sub-matches from the assigned lineup when scoring begins.
  - Record lineup changes in the audit trail.
  - Show lineup completeness status on team-match cards and queue items.

## Feature 10: Bulk Import Validation
### Sub-Feature 10.1: Duplicate detection on player import
- Task: Prevent duplicate player creation during bulk import and registration flows.
- Sub-tasks:
  - Define normalization rules for duplicate detection using name, optional country, club, and other configured keys.
  - Detect duplicates within the import file itself.
  - Detect duplicates against the existing target player list.
  - Present duplicate rows for merge, skip, or create-new decisions before commit.
  - Record the operator’s decision per duplicate row for auditability.

### Sub-Feature 10.2: Import preview before confirm
- Task: Add a staging/preview step before any bulk import writes canonical data.
- Sub-tasks:
  - Parse the entire import into a staged preview model.
  - Show counts for valid rows, invalid rows, duplicates, updates, and new creates.
  - Allow per-row edits in the preview before commit.
  - Allow preview filtering to only invalid or duplicate rows.
  - Prevent final import until required conflicts are resolved.

### Sub-Feature 10.3: Row-level validation errors
- Task: Make bulk import validation precise enough that operators know exactly what must be fixed.
- Sub-tasks:
  - Validate required fields per row.
  - Validate field length/format constraints per row.
  - Surface row number, field name, and clear error copy for every failure.
  - Allow export/download of validation errors.
  - Support partial import only if the operator explicitly chooses that mode.

### Sub-Feature 10.4: Country code validation
- Task: Normalize and validate country information consistently.
- Sub-tasks:
  - Define accepted country code formats and supported alias mapping.
  - Normalize accepted values to one stored format.
  - Flag unsupported codes before import commit.
  - Keep compatibility with legacy stored country values that may not already be normalized.
  - Add validation reuse so player self-registration follows the same rules.

### Sub-Feature 10.5: Team name deduplication
- Task: Prevent accidental duplicate teams during team import and bulk editing.
- Sub-tasks:
  - Define normalized team-name comparison rules.
  - Detect duplicate team names within the import set.
  - Detect duplicate team names against the user’s existing teams and tournament teams.
  - Offer merge, skip, rename, or create-separate decisions before commit.
  - Ensure downstream team-match references resolve to the intended team after import.

### Sub-Feature 10.6: Undo import
- Task: Add rollback support for recently completed bulk imports.
- Sub-tasks:
  - Record each import as a batch with created IDs, updated IDs, skipped rows, and operator identity.
  - Add a recent-imports view showing the result of each import batch.
  - Add a rollback action for reversible imports.
  - Prevent rollback from silently breaking active matches, queues, or lineups that already reference the imported data.
  - Add explicit warning/override flow when rollback would affect live operations.

## Feature 11: Mobile Navigation
### Sub-Feature 11.1: Faster section switching
- Task: Reduce mobile friction when moving between tables, team matches, scoreboards, and settings.
- Sub-tasks:
  - Audit current mobile navigation paths and count taps for common operator tasks.
  - Add a mobile-friendly primary navigation pattern for the most-used sections.
  - Preserve scroll/filter state when switching sections.
  - Prefetch or retain hot navigation data where it improves responsiveness.
  - Add clear active-section indicators that remain visible on small screens.

### Sub-Feature 11.2: Mobile-optimized forms
- Task: Make admin and scoring forms usable on small screens.
- Sub-tasks:
  - Replace cramped modal patterns with sheets or full-screen forms where appropriate.
  - Use correct mobile input types for date/time, number, email, and search fields.
  - Keep primary save/submit actions sticky or always reachable.
  - Prevent the keyboard from covering critical fields or buttons.
  - Review all high-frequency forms: table create/edit, team match create/edit, queue edit, login, player registration, and imports.

### Sub-Feature 11.3: Touch-friendly scoring controls
- Task: Optimize scoring interactions for thumbs and rapid live entry.
- Sub-tasks:
  - Increase the minimum touch target for live scoring controls.
  - Add pressed/disabled feedback so operators can trust rapid taps.
  - Prevent accidental double-submit by debouncing or reconciling repeated taps safely.
  - Keep undo and correction controls reachable without clutter.
  - Verify left/right side buttons remain clear when the scoreboard is switched.

### Sub-Feature 11.4: Full-screen scoring mode
- Task: Add a distraction-free scoring mode for tablets and phones.
- Sub-tasks:
  - Add a full-screen toggle in scoring views.
  - Hide nonessential navigation and admin chrome in full-screen mode.
  - Preserve visibility of sync state, table/match context, and undo controls.
  - Add an obvious exit path from full-screen mode.
  - Verify orientation changes do not corrupt layout or hide controls.

### Sub-Feature 11.5: Responsive scoreboard view
- Task: Ensure scoreboard preview/view experiences scale well across screen sizes.
- Sub-tasks:
  - Audit `ScoreboardPage` and `ScoreboardViewPage` on mobile sizes.
  - Add fit/fill/actual-size display options where needed.
  - Keep embedded/public scoreboard views legible on phones.
  - Ensure dynamic URL/public score view pages remain responsive.
  - Verify preview controls do not overlap the rendered scoreboard on narrow screens.

## Feature 12: Match Schema Evolution
### Sub-Feature 12.1: Sport-specific scoring rules per game
- Task: Move scoring logic toward a rules model instead of scattered flat-field assumptions.
- Sub-tasks:
  - Define a scoring-rules model keyed by `sportName` and `scoringType`.
  - Support per-game overrides when a sport format changes mid-match or by round.
  - Keep compatibility fields such as `bestOf`, `pointsToWinGame`, `changeServeEveryXPoints`, `enforceGameScore`, and `isManualServiceMode` populated.
  - Centralize win detection, service rotation, deuce logic, and validation behind the rules layer.
  - Ensure the scoreboard/editor binding layer can access the resolved live rules.

### Sub-Feature 12.2: Per-game metadata (start time, end time, winner)
- Task: Add normalized per-game records without removing existing per-game flat fields.
- Sub-tasks:
  - Define a normalized `games` collection/array inside each match.
  - Add per-game fields for start time, end time, winner, status, duration, and notes.
  - Mirror per-game normalized values back into legacy flat fields such as `game1StartTime` and `isGame1Finished`.
  - Backfill normalized per-game metadata from existing flat records where possible.
  - Use the normalized per-game metadata in scoring UI, history UI, and archived summaries.

### Sub-Feature 12.3: Game history within match
- Task: Make game-level history first-class rather than implicit.
- Sub-tasks:
  - Store game-level event collections or references for every match.
  - Associate point history and corrections with a specific game.
  - Allow the UI to replay or inspect a single game’s history independently.
  - Preserve history ordering across reconnects and undo operations.
  - Surface game history in archive views and admin troubleshooting views.

### Sub-Feature 12.4: Match audit trail
- Task: Track all meaningful match changes in a formal audit log.
- Sub-tasks:
  - Record actor identity, action type, timestamp, device/session metadata, and before/after values for all important match writes.
  - Include point scoring, undo, manual correction, lineup changes, round reassignment, pause/resume, and archive/reopen events.
  - Add admin-only audit views for matches and team matches.
  - Add retention/export guidance for audit data.
  - Ensure audit events remain compatible with local/AceBase mode.

### Sub-Feature 12.5: Point-by-point history
- Task: Persist complete point-by-point match history as canonical data.
- Sub-tasks:
  - Store enough data per point event to reconstruct current score, server state, and game progression.
  - Link every point event to its resulting score snapshot and undo/correction status.
  - Keep point history available to public replay/analysis features later without needing another schema rewrite.
  - Ensure point history write volume is acceptable for realtime updates.
  - Add retention/archival rules for long-term history storage if needed.

### Sub-Feature 12.6: Compatibility bridge and migration plan
- Task: Make schema evolution safe for existing consumers.
- Sub-tasks:
  - Add `schemaVersion` to new/updated matches.
  - Define dual-read and dual-write behavior between legacy flat fields and new normalized structures.
  - Add idempotent backfill jobs for existing matches.
  - Add verification scripts/tests that compare legacy-derived values against normalized-derived values.
  - Do not remove any legacy match fields until every consumer is verified against the new model.

## Feature 13: Scoreboard Editor Enhancements
### Sub-Feature 13.1: Template save/load improvements
- Task: Improve template persistence so editors can save, duplicate, restore, and reuse templates reliably.
- Sub-tasks:
  - Add clear distinction between save, save as new, duplicate, and publish operations.
  - Add template metadata such as description, category, owner, version, and last updated timestamp.
  - Add unsaved-change detection in the editor.
  - Add a restore/revert workflow for unsaved edits.
  - Add import/export for template data if the product should support moving templates between environments.
  - Preserve backward compatibility with existing `scoreboardTemplates` records and built-in templates.

### Sub-Feature 13.2: Preview in editor
- Task: Add a reliable live preview inside the editor workflow.
- Sub-tasks:
  - Add a preview pane or preview mode that renders the current template using sample data.
  - Add a preview mode that can attach to live table/team-match data safely for authorized users.
  - Allow switching between sample data and live data without losing unsaved editor state.
  - Add clear loading/error states when live preview data is unavailable.
  - Keep preview usable on smaller screens and in split-pane layouts.

### Sub-Feature 13.3: Service icon blocks (already have, improve UX)
- Task: Make service icon blocks easier to discover and configure.
- Sub-tasks:
  - Audit the existing service icon blocks under `src/editor/leftpanel/service/*` and `src/editor/plugins/addServiceIconBlocks.ts`.
  - Improve naming, grouping, and searchability of service icon blocks in the editor UI.
  - Add clearer configuration labels and defaults for each service icon variation.
  - Ensure service icon blocks bind correctly to the live service state for every supported sport/scoring type.
  - Add preview examples so editors can see the icon behavior before publishing.

### Sub-Feature 13.4: Flag/penalty blocks
- Task: Turn flag/penalty indicators into polished first-class editor blocks.
- Sub-tasks:
  - Audit the existing flag/penalty block files under `src/editor/leftpanel/penaltyflags/*` and `src/editor/plugins/addFlagPenalties.ts`.
  - Improve discoverability and naming for yellow/red card and similar penalty blocks.
  - Add visual previews and sample states for each block.
  - Ensure the blocks bind cleanly to the live match penalty fields and any future judge/dispute fields.
  - Add sport-specific visibility rules so unsupported flags do not appear by default in irrelevant sports.

### Sub-Feature 13.5: Dynamic data binding improvements
- Task: Expand and harden the editor/runtime binding model.
- Sub-tasks:
  - Audit current field-list definitions in `src/editor/fieldLists.ts` and `src/scoreboard/fields/*`.
  - Unify duplicate field definitions between editor and runtime where possible.
  - Add new binding targets for round, event, tournament, queue state, table status, team totals, and history-derived fields.
  - Add validation so broken or unknown bindings are surfaced before publish.
  - Add fallback/sample values for all bindings so previews remain readable.
  - Keep legacy field names working for existing templates.

## Feature 14: Backward Compatibility, Migration, and Release Safeguards
### Sub-Feature 14.1: Preserve existing data contracts
- Task: Document and enforce the exact contracts that must not break while v3 features land.
- Sub-tasks:
  - Document every canonical path and owner preview/index path currently in use.
  - Document every public URL/query-param contract currently in use, including scoreboard/dynamic URL patterns.
  - Document every legacy match/table/team-match field that existing views still read.
  - Add compatibility adapters where new features need richer normalized records.
  - Require new schemas to be additive by default.
  - Require new client screens to keep reading legacy data if migrated data is missing.

### Sub-Feature 14.2: Data migrations and backfills
- Task: Make all schema/security/ownership changes deployable to existing data safely.
- Sub-tasks:
  - Create idempotent migration plans for hashed/signed access tokens.
  - Create idempotent migration plans for owner/role grants.
  - Create idempotent migration plans for tournament/event references.
  - Create idempotent migration plans for normalized match game/history structures.
  - Create idempotent migration plans for queue ordering/status metadata.
  - Add dry-run output, progress tracking, and rollback guidance for every migration.
  - Backfill user preview/index nodes whenever canonical records gain required summary fields.

### Sub-Feature 14.3: Verification and QA matrix
- Task: Define the test matrix required for production rollout.
- Sub-tasks:
  - Add unit tests for scoring rules, queue ordering, permission checks, and compatibility adapters.
  - Add integration tests for live table updates, team-match updates, queue promotion, and ownership cleanup.
  - Add regression tests for dual-read/dual-write match schema compatibility.
  - Add end-to-end checks for table scoring, team scoring, QR flows, player registration, bulk import, and public score view.
  - Run verification in both Firebase-backed and local/AceBase-backed modes.
  - Add multi-client realtime tests for scorer/admin/public combinations.

### Sub-Feature 14.4: Release controls and observability
- Task: Add the operational guardrails needed to ship these changes safely.
- Sub-tasks:
  - Add feature flags for major new surfaces such as tournaments, queue automation, public score view, and role-based permissions.
  - Add structured logging for critical mutation paths and migration runs.
  - Add error reporting hooks for realtime failures, permission failures, and migration failures.
  - Add rollout checklists for staging, migration, verification, and rollback.
  - Add admin-facing diagnostics for stale subscriptions, broken references, and permission resolution issues.
  - Document the production cutover order so critical issues are fixed before new feature flags are enabled.
