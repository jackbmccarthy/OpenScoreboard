# LiveStream Operator Feature Roadmap

## Requirements Summary

Plan additional features on top of the current OpenScoreboard product that materially help people who are live streaming sporting events. The focus is on:

- automation that removes repetitive manual operator work
- UI changes that reduce clicks and increase speed under live pressure
- features that help tournament directors and stream operators coordinate tables, matches, overlays, and broadcast outputs
- keeping the existing app structure recognizable instead of proposing a full product reset

## Current Product Baseline

The current app already has a solid operational foundation:

- Dashboard route grouping for scoring, rosters, broadcast, and account access in [src/screens/DashboardPage.tsx:6](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx#L6)
- Table-level scoring entry flow in [src/screens/TableScoringPage.tsx:70](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx#L70)
- Team-match creation and scoring management in [src/screens/TeamMatchesPage.tsx:66](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx#L66)
- Scoreboard management, preview, duplicate, and template entry flow in [src/screens/ScoreboardsPage.tsx:55](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx#L55)
- Dynamic URL management in [src/screens/DynamicURLsPage.tsx:64](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx#L64)
- Table-to-scoreboard link generation in [src/screens/TablesPage.tsx:123](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx#L123)
- Server-mediated Firebase writes in [app/api/database/route.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/app/api/database/route.ts)

The main opportunity is not missing core CRUD anymore. The gap is orchestration: operators still have to move across multiple pages and manually stitch together scoring, overlays, link distribution, and broadcast actions.

## Recommended Features

### Priority 1: Show Control / Live Control Room

**Why it matters**

Today the product has feature pages, but not a live operations center. Stream operators need one “show mode” that surfaces the current table, active team match, active scoreboard, quick links, and critical controls without bouncing between tables, scoreboards, and dynamic URLs.

**User value**

- faster live management under pressure
- fewer route hops during broadcast
- a single place to see “what is on air” and what link is tied to it

**Suggested scope**

- New `/control-room` page
- current live tables, current scoreboard links, active dynamic URLs, and recent actions
- quick actions: start match, switch overlay, copy link, save dynamic URL, open editor, open scoring
- pinned “on-air” state so the operator knows what viewers currently see

**Likely touchpoints**

- [src/screens/DashboardPage.tsx:104](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DashboardPage.tsx#L104)
- [src/screens/TablesPage.tsx:123](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx#L123)
- [src/screens/ScoreboardsPage.tsx:132](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx#L132)
- [src/screens/DynamicURLsPage.tsx:124](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx#L124)

### Priority 2: Match Setup Wizard

**Why it matters**

Operators still create a table, create a match, choose a scoreboard, and wire links in multiple places. A guided setup wizard would collapse those steps into one flow.

**User value**

- less setup friction before a stream starts
- fewer opportunities for scoreboard/table mismatches
- simpler onboarding for volunteers or temporary event staff

**Suggested scope**

- “Start Broadcasted Match” wizard
- choose table or team match
- choose players/teams
- choose scoreboard or template
- auto-create dynamic URL and direct overlay links
- optional “open scoring and copy overlay link” at the end

**Likely touchpoints**

- [src/screens/TableScoringPage.tsx:70](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx#L70)
- [src/screens/TeamMatchesPage.tsx:85](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamMatchesPage.tsx#L85)
- [src/screens/ScoreboardsPage.tsx:188](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardsPage.tsx#L188)
- [src/screens/TablesPage.tsx:303](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx#L303)

### Priority 3: Overlay Pairing Presets

**Why it matters**

The current model keeps data source and display separate, which is powerful, but operators repeatedly create the same combinations for the same venues and productions.

**User value**

- one-click scoreboard pairing
- fewer repetitive dynamic URL saves
- consistent output across recurring events

**Suggested scope**

- saved “broadcast presets” containing:
  - scoreboard ID
  - target type (`table` or `team match`)
  - optional dynamic URL name
  - naming convention / brand preset
- quick apply from tables and team matches

**Likely touchpoints**

- [src/screens/TablesPage.tsx:303](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx#L303)
- [src/screens/DynamicURLsPage.tsx:83](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/DynamicURLsPage.tsx#L83)
- [src/functions/dynamicurls.ts:27](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/dynamicurls.ts#L27)

### Priority 4: Auto-Generated Broadcast Pack

**Why it matters**

A tournament director often needs more than one link: scoring URL, overlay URL, team-match URL, QR fallback, and possibly dynamic URL. The app already knows these combinations; it should package them automatically.

**User value**

- operators can share a full “broadcast pack” instead of copying links one by one
- easier handoff to commentators, TDs, and remote scorers

**Suggested scope**

- one-click “Generate Broadcast Pack”
- copy all relevant links
- printable/QR-ready version
- optional per-table notes and labels

**Likely touchpoints**

- [src/screens/TablesPage.tsx:303](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TablesPage.tsx#L303)
- [src/screens/QRCodePage.tsx:1](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/QRCodePage.tsx#L1)

### Priority 5: Streamer-Focused Match Events Automation

**Why it matters**

The scoring layer already knows game point, match point, timeouts, switches, and significant points. That can drive broadcast automation beyond just overlay state.

**User value**

- automatic lower-thirds or alerts
- fewer manual “trigger this graphic now” steps
- richer stream output with less operator attention

**Suggested scope**

- event hooks for:
  - match start
  - game point
  - match point
  - timeout start/end
  - side switch
  - match end
- event actions:
  - toggle overlay element
  - open sponsor slate
  - generate commentator note
  - fire webhook to OBS/automation layer

**Likely touchpoints**

- [src/functions/scoring.ts:414](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts#L414)
- [src/functions/scoring.ts:494](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts#L494)
- [src/functions/scoring.ts:505](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoring.ts#L505)

### Priority 6: Quick Action Dock For Scorers

**Why it matters**

The current scoring screens are functional but still page-based. A collapsible quick action dock would reduce tap distance for the actions that happen most often.

**User value**

- faster scoring on touch devices
- less hunting for controls mid-match
- easier operation for volunteers

**Suggested scope**

- floating quick actions on scoring pages:
  - pause
  - timeout
  - swap sides
  - copy overlay link
  - open control room
- large touch targets for key scoring actions

**Likely touchpoints**

- [src/screens/TableScoringPage.tsx:116](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TableScoringPage.tsx#L116)
- [src/screens/TeamsScoringPage.tsx:1](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/TeamsScoringPage.tsx#L1)

### Priority 7: Template Variables And Brand Packs

**Why it matters**

Templates exist now, but streamers often want fast brand personalization: sponsor bars, league marks, color systems, and commentator/venue labels.

**User value**

- faster event branding
- fewer duplicated scoreboards for small visual variations
- easier reuse across recurring productions

**Suggested scope**

- template variables for:
  - color palette
  - sponsor image
  - venue label
  - event name
  - social handle
- apply brand pack at scoreboard creation time

**Likely touchpoints**

- [src/screens/ScoreboardTemplatesPage.tsx:1](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/screens/ScoreboardTemplatesPage.tsx#L1)
- [src/functions/scoreboardTemplates.ts:1](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboardTemplates.ts#L1)
- [src/editor/initializeGrapesJS.ts:23](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/editor/initializeGrapesJS.ts#L23)

### Priority 8: Operator Activity Feed And Undo Safety

**Why it matters**

When multiple people are running an event, someone will eventually ask “who changed this?” or “what link was copied?” The app needs a thin operator audit layer.

**User value**

- faster recovery from mistakes
- better coordination across streamer + TD roles
- safer live operation

**Suggested scope**

- activity feed:
  - created dynamic URL
  - duplicated scoreboard
  - started match
  - edited team
  - changed table scoreboard link
- undo where safe for user-owned list removals and link creation

**Likely touchpoints**

- [app/api/database/route.ts](/Users/jackmccarthy/AIProjects/OpenScoreboard/app/api/database/route.ts)
- [src/functions/dynamicurls.ts:27](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/dynamicurls.ts#L27)
- [src/functions/scoreboards.ts:37](/Users/jackmccarthy/AIProjects/OpenScoreboard/src/functions/scoreboards.ts#L37)

## Recommended Order

1. **Control Room**
2. **Match Setup Wizard**
3. **Overlay Pairing Presets**
4. **Broadcast Pack Export**
5. **Match Event Automation**
6. **Quick Action Dock**
7. **Template Variables / Brand Packs**
8. **Activity Feed / Undo**

That order maximizes operator value fastest. It improves live-event speed first, then branding and visibility later.

## Acceptance Criteria

- Every proposed feature clearly reduces live-operator clicks, repeated manual link management, or setup time
- The first two roadmap items can be implemented without changing existing scoreboard/view URL contracts
- Broadcast-oriented features remain compatible with current `sid` + `tid/tmid` pairing and dynamic URL flows
- New plans keep the dashboard navigation structure recognizable
- Preview, visibility, and automation features are grounded in current routes and helper layers

## Implementation Steps

1. Add a **Control Room PRD** around tables, team matches, scoreboards, and dynamic URLs using the current routes as source inputs.
2. Define a **Broadcast Pack model** that bundles scoreboard links, scoring links, dynamic URLs, and optional QR assets.
3. Design a **Match Setup Wizard** that spans table/team-match selection, player/team assignment, scoreboard selection, and link output.
4. Add a **Preset layer** above dynamic URLs so recurring scoreboard pairings can be reused quickly.
5. Extend the scoring event model so broadcast automations can respond to live match state changes.
6. Add visibility/audit features once the automation and control-room flows stabilize.

## Risks And Mitigations

- **Risk: Feature sprawl makes the app harder to learn.**
  - Mitigation: keep the current dashboard structure and add advanced features as layered tools, not new top-level clutter.

- **Risk: Automation breaks existing scoreboard URL compatibility.**
  - Mitigation: require all new orchestration layers to emit the same `scoreboard/view?sid=...&tid=...` or `...&tmid=...` contract.

- **Risk: Template and preset systems overlap and confuse users.**
  - Mitigation: keep templates focused on layout/design, keep presets focused on data/display pairing and operator workflow.

- **Risk: Multi-user event coordination introduces data races or stale state.**
  - Mitigation: route automation through the existing server-mediated write path and add operator activity logging before multi-operator flows go wide.

## Verification Steps

- Review the plan against the current feature inventory and confirm each proposal is grounded in an existing route or helper surface.
- For any execution follow-up, require:
  - route references
  - URL-contract compatibility checks
  - `npm run typecheck`
  - `npm run build`
  - manual operator-walkthrough QA for the relevant live workflow

## Recommendation

If you want the highest-value next step, start with **Control Room + Match Setup Wizard** as one coordinated initiative. That gives streamers and tournament directors the biggest usability win: fewer page hops, fewer copy/paste steps, and faster “get this match on air now” workflows.
