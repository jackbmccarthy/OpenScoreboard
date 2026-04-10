# Plan: Livestream And Tournament Operations Roadmap

## Requirements Summary

The goal is to identify the next features that most improve OpenScoreboard for users actively running a live sports stream or operating a tournament desk. These features should either:

- automate repetitive stream-day operations,
- reduce clicks and context switching during live management,
- improve visibility and confidence for operators,
- or make the app easier and faster to use under pressure.

## Current Product Surface

Evidence from the current repo:

- The primary authenticated entrypoint is the dashboard in [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx), which routes users into tables, team matches, players, teams, scoreboards, dynamic URLs, and settings.
- Table operations already support live scoring and table-to-scoreboard link management in [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx).
- Team match management exists in [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx).
- Player list and roster management exist in [src/screens/PlayersPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/PlayersPage.tsx), [src/screens/BulkPlayerPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/BulkPlayerPage.tsx), and [src/screens/TeamDetailPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamDetailPage.tsx).
- Scoreboard creation, duplication, previews, templates, and editor entrypoints now live in [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx) and [src/screens/ScoreboardTemplatesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardTemplatesPage.tsx).
- Dynamic URL routing exists in [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx).
- The overlay runtime depends on `sid + tid` or `sid + tmid` URL combinations in [src/screens/ScoreboardViewPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardViewPage.tsx) and [src/scoreboard/index.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/scoreboard/index.ts).

## Key Strengths To Build On

1. The app already has the core operator primitives: tables, matches, scoreboards, templates, dynamic URLs, and bulk player/team editing.
2. The app already understands the difference between display and data: scoreboards are visual layouts, while tables/team matches are data sources.
3. The dashboard and tables UI already behave like an operator console, so stream-focused features can sit naturally on top of the current structure instead of requiring a new IA.

## Highest-Value Features To Add Next

### 1. Stream Session / Control Room Mode

**Why it matters**
- Live operators need one screen that shows: active tables, active team matches, current overlays in use, quick link access, and “what is live right now.”
- The current feature set is present, but distributed across several pages.

**Feature**
- Add a dedicated “Control Room” page that aggregates:
  - currently active tables,
  - current match assignments,
  - quick-open scoreboard links,
  - dynamic URL shortcuts,
  - and recent operator actions.

**Current files to build on**
- [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx)
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
- [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx)
- [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx)

### 2. “Go Live” Pairing Wizard

**Why it matters**
- Operators think in terms of “put this scoreboard on this table/team match now,” not raw IDs.
- The app already exposes table + scoreboard link combinations, but the pairing flow is still ID/URL-oriented.

**Feature**
- Add a guided wizard that:
  - selects a data source (table or team match),
  - selects a scoreboard display,
  - previews the combo,
  - generates the correct live URL,
  - optionally creates a dynamic URL,
  - and offers copy/open/QR in one step.

**Current files to build on**
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
- [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx)
- [src/screens/ScoreboardViewPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardViewPage.tsx)

### 3. Match Queue And Auto-Assignment Helpers

**Why it matters**
- Tournament desks repeatedly schedule, reassign, and push matches onto available tables.
- Current table and scheduled match surfaces exist, but the operator still does a lot of manual routing.

**Feature**
- Add automation helpers such as:
  - “next available table” recommendation,
  - one-click assign next match,
  - warning when a table has no scoreboard pairing configured,
  - and table state badges like `idle`, `warmup`, `live`, `between games`.

**Current files to build on**
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/ScheduledTableMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScheduledTableMatchesPage.tsx)
- [src/functions/tables.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/tables.ts)
- [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts)

### 4. Operator Hotkeys And Quick Actions

**Why it matters**
- Stream operators benefit from low-latency keyboard-driven control while watching the broadcast or table feed.
- Current flows are click-heavy for repeated tasks.

**Feature**
- Add optional keyboard shortcuts and quick actions for:
  - open scoreboard links,
  - copy current live URL,
  - jump to active tables,
  - start next match,
  - and toggle recently used overlays.

**Current files to build on**
- [src/components/TabsLayout.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/TabsLayout.tsx)
- [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx)
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)

### 5. Pre-Flight Overlay Validation

**Why it matters**
- A common stream-day failure is generating a link that technically works, but points at the wrong data source, wrong scoreboard, or incomplete setup.
- The app now has previews and link generation, but not a full “ready to stream” validation pass.

**Feature**
- Add a validation checklist for every live pairing:
  - scoreboard has previewable content,
  - URL parameters are complete,
  - data source exists,
  - table/team match is active or scheduled,
  - dynamic URL is valid,
  - required names/players are populated.

**Current files to build on**
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx)
- [src/components/scoreboards/ScoreboardPreview.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/scoreboards/ScoreboardPreview.tsx)

### 6. Template Packs And Event Presets

**Why it matters**
- Stream teams often reuse the same look-and-feel across an event, tournament, or venue.
- The current templates flow exists, but could grow into a full “preset pack” model.

**Feature**
- Support grouped template packs such as:
  - Event branded pack,
  - Court-side pack,
  - Match summary pack,
  - Team match pack.
- Add “create this event’s standard set” workflows that auto-provision several scoreboards at once.

**Current files to build on**
- [src/screens/ScoreboardTemplatesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardTemplatesPage.tsx)
- [src/functions/scoreboardTemplates.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts)
- [src/components/scoreboards/ScoreboardPreview.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/scoreboards/ScoreboardPreview.tsx)

### 7. Team Match Operator Board

**Why it matters**
- Team matches are more complex than a single table score flow because they combine several tables, rosters, and aggregate team scores.
- The app has the underlying pieces, but not a strong “command board” view.

**Feature**
- Add a dedicated team match operator board showing:
  - each assigned table,
  - which matchup is currently there,
  - current team score,
  - quick swap/reassign actions,
  - and quick overlay link generation for each table in the team match.

**Current files to build on**
- [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
- [src/screens/TeamsScoringPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamsScoringPage.tsx)
- [src/functions/teammatches.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/teammatches.ts)

### 8. Broadcast-Focused Recent Activity And Undo

**Why it matters**
- Stream-day operators need confidence when they copy the wrong link, assign the wrong scoreboard, or delete the wrong visible item.

**Feature**
- Add a short-lived recent activity feed with reversible actions for:
  - dynamic URL created,
  - scoreboard duplicated,
  - table link copied,
  - team or player removed from a list,
  - overlay opened.

**Current files to build on**
- [src/components/crud/ConfirmDialog.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/crud/ConfirmDialog.tsx)
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx)

## Recommended Priority Order

1. Stream Session / Control Room Mode
2. Go Live Pairing Wizard
3. Match Queue And Auto-Assignment Helpers
4. Pre-Flight Overlay Validation
5. Team Match Operator Board
6. Operator Hotkeys And Quick Actions
7. Template Packs And Event Presets
8. Broadcast-Focused Recent Activity And Undo

## Acceptance Criteria

1. The plan identifies only features that materially help live-stream operators or tournament directors.
2. Each recommended feature has a clear operator value, not just a generic product enhancement.
3. Every recommendation is grounded in the current repo surface with concrete route/file references.
4. The priority order favors stream-day speed, setup confidence, and lower operator error rates.
5. No recommendation requires a schema rewrite as a first step.

## Implementation Steps

1. Audit the highest-frequency stream-day flows on top of the current surfaces:
   - dashboard,
   - tables,
   - team matches,
   - scoreboards,
   - dynamic URLs.
2. Validate which flows currently require the most manual link generation, setup repetition, or page switching.
3. Start with the highest-leverage operator workflow:
   - either a Control Room page,
   - or a Go Live Pairing Wizard.
4. Add validation and automation before adding more cosmetic features:
   - pairing validation,
   - ready-to-stream state,
   - queue/assignment helpers.
5. Add advanced operator quality-of-life features:
   - hotkeys,
   - recent activity,
   - undo,
   - template packs.

## Risks And Mitigations

- **Risk:** Feature ideas drift into general tournament software instead of stream-focused operations.
  - **Mitigation:** Prioritize only features that reduce operator actions during a live event or make overlay setup safer/faster.

- **Risk:** Link-generation or automation features accidentally fork the existing scoreboard URL contract.
  - **Mitigation:** Keep all new live-pairing features grounded in the current `sid + tid` / `sid + tmid` contract already used by the runtime.

- **Risk:** Template and automation work becomes a schema migration project.
  - **Mitigation:** Favor additive orchestration and UI layers over new core object models.

## Verification Steps

1. Confirm that every proposed feature still maps cleanly onto the current route and helper structure.
2. Before implementation, identify whether the feature changes:
   - only UI,
   - UI + orchestration,
   - or data contracts.
3. For top-priority items, define the measurable operator win before coding:
   - fewer clicks,
   - fewer page switches,
   - fewer invalid overlay launches,
   - faster time-to-live.
