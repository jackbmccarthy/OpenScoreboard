# Feature Roadmap: Livestream Automation And Operator UX

## Requirements Summary

Goal: identify the highest-value feature additions on top of the current OpenScoreboard product for people running a live sports stream or tournament desk. The emphasis is on automation, faster operator workflows, fewer clicks, better visibility into what is on-air, and safer production handling.

Current feature baseline in the repo:
- Authenticated operator dashboard with entry points for tables, team matches, players, teams, scoreboards, dynamic URLs, and settings in [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx).
- Table-scoring workflow and table management in [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx) and [src/screens/TableScoringPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx).
- Team-match management in [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx).
- Dynamic URL management in [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx).
- Scoreboard management, previews, duplication, and templates in [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx) and [src/screens/ScoreboardTemplatesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardTemplatesPage.tsx).
- Scoreboard editor in [src/screens/EditorPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/EditorPage.tsx).
- Live scoreboard rendering through `sid + tid` or `sid + tmid` URL contracts in [src/screens/ScoreboardViewPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardViewPage.tsx).

Observed constraints:
- Realtime Database field names, object shapes, and path contracts are intentionally preserved; most new features should layer on top rather than redesign core objects, as described in [README.md](/Users/jackmccarthy/AIProjects/OpenScoreboard/README.md).
- The current product already supports dynamic URL indirection and scoreboard previews, which makes broadcast-oriented automation easier to add than a full data-model rewrite.
- The app still relies heavily on operator-driven page-to-page movement, which means the biggest wins are likely orchestration, presets, queueing, shortcut surfaces, and broadcast state visibility.

## Recommended Priorities

### Priority 1: Broadcast Control Deck

Build a single “control room” surface for stream operators that merges:
- current match/table status
- active scoreboard/display assignment
- quick scoreboard link actions
- next scheduled match
- dynamic URL shortcuts
- stream-facing overlay preview

Why first:
- Today the operator has to bounce between table cards, scoreboards, team matches, and dynamic URLs, based on [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx) and [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx).
- This is the highest-impact workflow reduction for livestream users because it collapses multiple coordination tasks into one place.

Key capabilities:
- Show “on-air” table/team-match and scoreboard pairing
- One-click copy/open dynamic URL or overlay URL
- One-click swap scoreboard display for the current data source
- Current/next match pane
- Preview iframe of what the audience sees

Likely touchpoints:
- [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx)
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
- [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx)
- [src/components/scoreboards/ScoreboardPreview.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/scoreboards/ScoreboardPreview.tsx)

### Priority 2: One-Click Match Handoff / Next Match Automation

Add a guided handoff flow from “current match finished” to “next match live”.

Why second:
- The repo already has scheduled match concepts in scoring and table flows, but the operator still appears to manage the transitions manually through separate pages and actions in [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts), [src/functions/tables.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/tables.ts), and [src/screens/ScheduledTableMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScheduledTableMatchesPage.tsx).
- For streamers, the slowest and riskiest moments are transitions between matches.

Key capabilities:
- “End current match and advance next scheduled match” action
- Auto-assign next scheduled match to table
- Repoint saved dynamic URL or selected scoreboard pairing
- Optional countdown / “coming up next” broadcast state

Likely touchpoints:
- [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts)
- [src/functions/tables.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/tables.ts)
- [src/screens/ScheduledTableMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScheduledTableMatchesPage.tsx)
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)

### Priority 3: Scoreboard Presets And Scene Packages

Add “broadcast packages” that bundle:
- scoreboard template
- sponsor/lower-third assets
- show/hide timing rules
- sport-specific display rules
- maybe a recommended dynamic URL target pattern

Why third:
- The app already has scoreboard templates and the GrapesJS editor in [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx), [src/screens/ScoreboardTemplatesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardTemplatesPage.tsx), and [src/screens/EditorPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/EditorPage.tsx).
- The next step for streamers is repeatability, not just template browsing.

Key capabilities:
- “Use package for finals / interviews / sponsor slate / warmup”
- sport-specific preset switching
- reusable style kits across events

Likely touchpoints:
- [src/functions/scoreboardTemplates.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts)
- [src/classes/Scoreboard.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/classes/Scoreboard.ts)
- [src/editor/initializeGrapesJS.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/editor/initializeGrapesJS.ts)

### Priority 4: Operator Shortcuts And Hotkey Layer

Add a production-mode hotkey system and quick command palette.

Why fourth:
- The current UI is improving, but many production users need speed more than discoverability once they learn the app.
- The repo already centralizes a lot of action flows in a few screens, so a hotkey layer can bind to them without changing the data model.

Key capabilities:
- quick open for tables / players / teams / scoreboards
- next/previous match
- open scoreboard links overlay
- copy overlay URL
- mark timeout / game point / switch sides

Likely touchpoints:
- [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
- [src/screens/TableScoringPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx)
- [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
- shared shell in [src/components/TabsLayout.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/TabsLayout.tsx)

### Priority 5: Remote Assistant / Talent-Friendly Links

Let a producer create limited-purpose “assistant” links for remote helpers.

Why fifth:
- Stream operations often have volunteers doing roster corrections or updating side surfaces.
- The current app already uses URL-based routing and dynamic URLs, which is a natural base for limited-purpose operator links.

Key capabilities:
- roster-only edit link
- score-only lightweight control
- read-only match monitor link
- expiring or role-limited access

Likely touchpoints:
- auth layer in [src/lib/auth.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/lib/auth.tsx)
- route shell in [src/components/TabsLayout.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/TabsLayout.tsx)
- table/team scoring screens

## Additional Feature Candidates

These are strong follow-up items once the top five exist.

1. **Live production status strip**
   Show what is on-air, who is serving, timeout state, game point state, and whether the display pairing is valid.
   Evidence: those states already exist in the current scoreboard and scoring model in [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts) and [src/scoreboard/index.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/scoreboard/index.ts).

2. **Instant replay / highlight markers**
   Turn significant points into quick bookmarks for stream replay moments.
   Evidence: significant points already exist in [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts).

3. **Lower-third / intro / result card generator**
   Reuse the scoreboard display layer for non-score moments.
   Evidence: template and preview primitives already exist in [src/components/scoreboards/ScoreboardPreview.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/scoreboards/ScoreboardPreview.tsx) and [src/functions/scoreboardTemplates.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts).

4. **Health checks and broken-link detection**
   Detect missing `sid/tid/tmid`, missing template HTML, or invalid dynamic URL targets before the operator goes on-air.
   Evidence: missing-param failures are currently surfaced only in [src/screens/ScoreboardViewPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardViewPage.tsx).

5. **Event branding kit**
   Global sponsor colors, type, logos, and recurring lower-third assets applied to all templates and new scoreboards.

6. **Tablet-first scoring mode**
   Separate dense “desktop control room” and large-target “venue-side touch scoring” modes for tablets and secondary devices.

7. **Producer notes / runbook**
   Inline reminders, match notes, pronunciation notes, and sponsor cue notes tied to tables or matches.

## Recommendation

Recommended sequence:

1. Broadcast Control Deck
2. Match Handoff Automation
3. Scoreboard Presets / Scene Packages
4. Operator Shortcuts
5. Remote Assistant Links

Reason:
- It stacks from highest operator-time savings to broader collaboration capabilities.
- It reuses the current strengths of the product: route-based workflows, dynamic URLs, templates, previews, and the preserved realtime contract.
- It avoids risky schema changes until there is proof that automation layers truly need them.

## Acceptance Criteria

1. Every recommended feature clearly improves a livestream or tournament-operator workflow, not just generic CRUD depth.
2. The priority order is justified by current repo capabilities and likely operator pain points.
3. Each top-priority feature includes clear touchpoints in the current codebase.
4. At least the first three roadmap items can be implemented without breaking the current scoreboard/view URL contract.
5. The roadmap identifies both automation wins and UI-efficiency wins.

## Implementation Steps

1. Build a “control deck” PRD around the current dashboard, tables, team matches, and dynamic URL surfaces.
   Touchpoints:
   [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx)
   [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
   [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
   [src/screens/DynamicURLsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx)

2. Define a match-transition automation flow on top of existing scheduled/current match helpers.
   Touchpoints:
   [src/functions/scoring.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts)
   [src/functions/tables.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/tables.ts)
   [src/screens/ScheduledTableMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScheduledTableMatchesPage.tsx)

3. Extend scoreboard templates into reusable packages and non-score broadcast scenes.
   Touchpoints:
   [src/functions/scoreboardTemplates.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts)
   [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx)
   [src/screens/EditorPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/EditorPage.tsx)

4. Add a keyboard shortcut / command palette layer to the operator shell.
   Touchpoints:
   [src/components/TabsLayout.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/TabsLayout.tsx)
   [src/screens/TableScoringPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx)

5. Add limited-purpose helper links only after the first workflow automation pass is validated.
   Touchpoints:
   [src/lib/auth.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/lib/auth.tsx)
   scoring and roster screens

## Risks And Mitigations

- **Risk:** automation features start leaking into schema redesign.
  **Mitigation:** first ship orchestration and control-layer features using current paths and helper functions.

- **Risk:** too many new surfaces create more operator confusion.
  **Mitigation:** centralize new functionality under a single control-deck concept instead of scattering it across the dashboard.

- **Risk:** remote helper features become a security problem.
  **Mitigation:** defer them until auth/authorization design is explicit and server-side enforced.

- **Risk:** “premium” broadcast features outrun practical production needs.
  **Mitigation:** prioritize features that remove manual steps before adding purely aesthetic scene features.

## Verification Steps

1. Confirm the roadmap’s top five items all map to existing operator workflows visible in:
   [src/screens/DashboardPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx)
   [src/screens/TablesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx)
   [src/screens/TeamMatchesPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx)
   [src/screens/ScoreboardsPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx)

2. Confirm the proposed work does not require changing the current `scoreboard/view` URL contract in:
   [src/screens/ScoreboardViewPage.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardViewPage.tsx)

3. Confirm the proposed template/package direction reuses existing template infrastructure in:
   [src/functions/scoreboardTemplates.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts)
   [src/components/scoreboards/ScoreboardPreview.tsx](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/components/scoreboards/ScoreboardPreview.tsx)

4. Use this roadmap as the basis for a follow-up execution plan, ideally starting with the control deck and match handoff automation.
