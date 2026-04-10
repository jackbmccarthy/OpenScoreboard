Task statement
- Add complete CRUD UX for list-driven entities in the Next.js app.
- Use overlays for add flows instead of inline forms across the list screens.
- Ensure teams can be edited.
- Add compatible add, edit, and delete/hide affordances across players, tables, team matches, teams, dynamic URLs, and similar list surfaces.
- Provide confirmation UI for destructive remove/hide actions.
- Allow bulk add, bulk edit, and bulk remove for players and teams.

Desired outcome
- Logged-in users can manage list entities from `/dashboard` and linked screens with consistent modal/overlay add flows.
- Each managed entity has an add flow, an edit flow (overlay or dedicated page), and a delete/hide confirmation flow where applicable.
- Players and teams support bulk management actions.
- Existing database field names, object shapes, and paths remain compatible with the current branch contract.

Known facts / evidence
- The app now uses Next.js with route wrappers under `app/` and screen components under `src/screens/`.
- Current list pages include `PlayersPage`, `TeamsPage`, `TablesPage`, `TeamMatchesPage`, `ScoreboardsPage`, `ScheduledMatchesPage`, `PlayerListsPage`, and supporting detail screens.
- Some screens still use inline add forms instead of modal overlays, notably `TeamsPage` and `ScoreboardsPage`.
- Teams currently have no clear edit page/surface from the main list experience.
- Players already have some modal patterns, but CRUD coverage is inconsistent across entities.
- `BulkPlayerPage` exists, but bulk CRUD support is incomplete and teams do not have an equivalent bulk management flow.
- Data mutations currently flow through `src/functions/*.ts` and then the server-mediated database compatibility layer.

Constraints
- Preserve existing Realtime Database paths and payload shapes.
- Keep the UI consistent with the current app shell and avoid a broad design-system rewrite.
- Destructive actions need explicit confirmation.
- Adds should prefer overlays; edits may be overlays or dedicated pages.
- Bulk CRUD for players and teams must be supported.

Unknowns / open questions
- Which existing list entities should support hide instead of delete, if any, versus plain removal from the user-owned lists.
- Whether dynamic URLs already have an unfinished screen or only function-level support.
- How far the current functions layer supports team editing versus requiring new helpers.

Likely codebase touchpoints
- Screen pages: `src/screens/PlayersPage.tsx`, `src/screens/TeamsPage.tsx`, `src/screens/TablesPage.tsx`, `src/screens/TeamMatchesPage.tsx`, `src/screens/ScoreboardsPage.tsx`, `src/screens/PlayerListsPage.tsx`, `src/screens/ScheduledMatchesPage.tsx`, `src/screens/BulkPlayerPage.tsx`
- Supporting components and UI primitives: `src/components/ui/index.tsx`
- Data helpers: `src/functions/players.ts`, `src/functions/teams.ts`, `src/functions/tables.ts`, `src/functions/teammatches.ts`, `src/functions/scoreboards.ts`
- App routing: `app/(main)/*`, `src/screens/DashboardPage.tsx`
