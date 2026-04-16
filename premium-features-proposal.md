# OpenScoreboard v3 Premium Features Proposal

## Scope
This proposal is grounded in the current OpenScoreboard v3 codebase and `TASKS.md`, with emphasis on the existing data model, realtime architecture, tournament model, scoreboard system, and signed-capability security layer.

## Current Architecture Snapshot
The current codebase already has enough structure to support a serious commercial tier:

| Area | Current state in code | Premium leverage |
| --- | --- | --- |
| Canonical entities | Top-level records already exist for `tables/`, `matches/`, `teamMatches/`, `teams/`, `playerLists/`, `scoreboards/`, `scoreboardTemplates/`, `dynamicurls/`, `tournaments/`, and `capabilityTokens/`. User-facing previews live under `users/{uid}/...`. | Premium features can be layered onto the current schema without inventing a second storage model. |
| Match schema | `src/classes/Match.ts` and `src/schema/matchSchemaBridge.js` already dual-write flat score fields plus normalized `games`, `pointHistory`, `auditTrail`, `context`, and `scheduling`. | Analytics, audit exports, public replays, compliance logs, and tournament-aware automation are all now structurally possible. |
| Tournament model | `src/classes/Tournament.ts` and `src/functions/tournaments.ts` already define `events`, `rounds`, `brackets`, `scheduleBlocks`, `staffAssignments`, `pendingInvites`, and `publicVisibility`. | Advanced formats, multi-venue scheduling, roles, registration, and premium public surfaces should extend this model instead of creating a separate premium-only schema. |
| Realtime operations | `subscribeToMyTables`, `subscribeToMyTeamMatches`, `useRealtimeCollection`, and `src/functions/liveSync.ts` already provide live table, team-match, queue, and public-view state. | Premium operator dashboards, venue control centers, analytics refresh, and kiosk/admin consoles can use the same subscription layer. |
| Secure public/operator links | `src/functions/accessTokens.ts`, `src/server/capabilities.ts`, `app/api/capabilities/route.ts`, and `src/screens/QRCodePage.tsx` already support signed capability tokens with expiry, rotation, revocation, audit, and rate limiting. | Kiosk mode, self-service registration, judge access, branded public pages, and paid check-in flows should all build on capability tokens. |
| Scoreboards and overlays | `scoreboards/{id}` stores HTML/CSS/JS, templates exist in `scoreboardTemplates/`, dynamic routing exists in `dynamicurls/`, and public/live views already exist. | White-label branding, automated broadcast delivery, sponsor rotation, embeddable widgets, and custom domains are natural premium extensions. |
| Dual database mode | The app already supports Firebase and AceBase through the same database abstraction. | Commercial features can be sold both as hosted SaaS and as enterprise/self-hosted packages with minimal architectural split. |

## Premium Feature Proposals

### 1. Tournament Kiosk & Self-Service Registration
- **Problem it solves:** Clubs still rely on manual front-desk workflows for on-site registration, table assignment, and player intake. This creates long queues, duplicate records, and staffing overhead.
- **How it leverages existing OpenScoreboard data/architecture:** Uses `playerLists/{id}`, `tournaments/{id}`, capability tokens, `PlayerRegistrationPage`, and existing QR issuance from `QRCodePage`. The registration flow already supports secure token resolution and writes to player lists.
- **Technical complexity estimate:** Medium
- **Monetization potential:** High for clubs running frequent open events, youth tournaments, and check-in desks with volunteers.
- **Suggested implementation approach:** Add a dedicated kiosk mode with event-scoped registration forms, required/optional fields, pending approval state, duplicate detection, and kiosk session reset. Use signed registration tokens plus tournament-level registration settings rather than table/password flows.
- **Suggested packaging:** Monthly SaaS feature in Pro/Operations tier.

### 2. Self Check-In, Waiver, and Badge Station
- **Problem it solves:** Registration is only part of event flow; organizers also need check-in confirmation, waiver capture, division confirmation, and printed badge or queue slip generation.
- **How it leverages existing OpenScoreboard data/architecture:** Extends tournament `settings`, `events`, and `publicVisibility`; stores check-in metadata under tournament registration records; reuses QR/capability access control and player list/tournament references.
- **Technical complexity estimate:** Medium
- **Monetization potential:** Medium to high for larger weekend events and multi-day tournaments.
- **Suggested implementation approach:** Introduce event registration records under tournaments, kiosk-friendly check-in state, printable badge payloads, and optional scanner-friendly participant codes. Keep player creation in the existing `playerLists` path but add tournament registration metadata as a sibling data set.
- **Suggested packaging:** SaaS feature plus optional one-time deployment/configuration add-on.

### 3. Analytics Hub
- **Problem it solves:** Today OpenScoreboard is strong at live operations but weak at post-event insight. Clubs want score trends, throughput, average match time, queue bottlenecks, no-show patterns, and event performance summaries.
- **How it leverages existing OpenScoreboard data/architecture:** Directly uses `matches/{id}/games`, `pointHistory`, `auditTrail`, `scheduling`, `tables/{id}/scheduledMatches`, and tournament `scheduleBlocks`.
- **Technical complexity estimate:** Medium
- **Monetization potential:** High for recurring clubs and tournament directors who need staffing and scheduling insight.
- **Suggested implementation approach:** Build a reporting read model that summarizes match duration, table utilization, queue delay, score volatility, dispute frequency, and completion rates. For Firebase, precompute aggregate snapshots to avoid expensive client-side scans. For AceBase/local mode, compute on demand with a narrower feature set.
- **Suggested packaging:** Monthly SaaS feature in Pro/Analytics tier.

### 4. Player Performance History & Club Rankings
- **Problem it solves:** Organizers want more than one-event scoring. They want player history, opponent history, win/loss trends, game differential, participation frequency, and season rankings.
- **How it leverages existing OpenScoreboard data/architecture:** The normalized match model already carries player objects, game results, event metadata, and point history. Tournament context fields make cross-event aggregation feasible.
- **Technical complexity estimate:** Medium to High
- **Monetization potential:** High for leagues, academies, and clubs with repeat participants.
- **Suggested implementation approach:** Add stable player identity strategy first, then create per-player aggregate records and history views. Start with event-level and account-level summaries, then expand into ratings/rankings once duplicate resolution and identity reconciliation are good enough.
- **Suggested packaging:** Monthly SaaS feature; advanced ranking engine can be an upper-tier unlock.

### 5. Venue & Operations Trend Reporting
- **Problem it solves:** Multi-table venues need to know which tables run late, which formats cause delays, and when staffing is insufficient.
- **How it leverages existing OpenScoreboard data/architecture:** Uses `tables`, `matches.scheduling`, tournament `scheduleBlocks`, and live sync timestamps already visible in operations screens.
- **Technical complexity estimate:** Medium
- **Monetization potential:** Medium for single-site clubs, high for tournament operators with many concurrent tables.
- **Suggested implementation approach:** Add venue dashboards for table occupancy, average turnover time, queue depth by hour, late start heatmaps, and dispute/timeout hotspots. This should sit on top of the same summary service as Analytics Hub.
- **Suggested packaging:** Monthly SaaS feature; bundle with Analytics Hub.

### 6. White-Label Brand Kit
- **Problem it solves:** Commercial operators do not want generic branding on public pages, kiosks, overlays, QR surfaces, or registration forms.
- **How it leverages existing OpenScoreboard data/architecture:** Scoreboards already store custom HTML/CSS/JS, templates already support reusable layouts, and public score routes already exist. Branding settings can be attached to accounts and tournaments without changing scoring truth.
- **Technical complexity estimate:** Medium
- **Monetization potential:** Very high because this is visibly client-facing and easy to justify commercially.
- **Suggested implementation approach:** Add account-level and tournament-level branding records for logos, colors, typography, public footer text, default overlay styles, and `Powered by` suppression. Apply these to `ScoreboardViewPage`, QR pages, public score pages, registration pages, and templates.
- **Suggested packaging:** Core premium differentiator in Pro; custom design services as one-time add-on.

### 7. Custom Domains & Branded Public Microsites
- **Problem it solves:** Organizers want branded public URLs for scores, brackets, registration, and event landing pages instead of product-owned routes and query strings.
- **How it leverages existing OpenScoreboard data/architecture:** Public surfaces already route through capability links, dynamic URLs, and `scoreboard/view`. Tournament `publicVisibility` already distinguishes what is safe to expose.
- **Technical complexity estimate:** High
- **Monetization potential:** High for commercial organizers, schools, and agencies.
- **Suggested implementation approach:** Add a domain binding layer that maps branded hosts to account/tournament public settings. Reuse existing `dynamicurls` concepts for route resolution, then add public site shells for registration, schedule, brackets, and live scores.
- **Suggested packaging:** Enterprise SaaS feature with optional one-time DNS onboarding/setup fee.

### 8. Advanced Tournament Formats Pack
- **Problem it solves:** Single-elimination alone is not enough for most serious organizers. They need double elimination, pool play into bracket, Swiss-like progression, consolation brackets, and reseeding controls.
- **How it leverages existing OpenScoreboard data/architecture:** The tournament model already has `events`, `rounds`, `brackets`, `scheduleBlocks`, bracket nodes, and match/tournament compatibility fields.
- **Technical complexity estimate:** High
- **Monetization potential:** Very high for tournament directors; this is one of the strongest premium anchors.
- **Suggested implementation approach:** Keep current single-elimination support as baseline, then expand the bracket engine with modular advancement rules and phase transitions. Use `scheduleBlocks` as the canonical scheduling layer and keep scoring truth in `matches`/`teamMatches`.
- **Suggested packaging:** Monthly SaaS feature in Tournament Pro tier.

### 9. League & Season Manager
- **Problem it solves:** Clubs running recurring leagues need round robin pools, standings, ladder logic, home/away fixtures, and season tables rather than one-off brackets.
- **How it leverages existing OpenScoreboard data/architecture:** Tournament `events`, `rounds`, `scheduleBlocks`, and player/team aggregates can represent league rounds and fixtures. Team match records already support aggregate team scoring.
- **Technical complexity estimate:** High
- **Monetization potential:** High for recurring clubs, schools, and regional leagues.
- **Suggested implementation approach:** Add a league event type with fixtures, standings, tie-break rules, and season snapshots. Reuse `teamMatches`, `matches`, and tournament scheduling, but add standings calculations and recurring-season metadata.
- **Suggested packaging:** Monthly SaaS feature; premium tournament/league bundle.

### 10. Multi-Venue Control Tower
- **Problem it solves:** Commercial organizers often run multiple venues or simultaneous tournaments and need one control plane for schedules, staff, branding, reporting, and public outputs.
- **How it leverages existing OpenScoreboard data/architecture:** The current owner-scoped preview system plus tournament ownership, staff assignments, roles, and table/team-match collections are already organized in a way that can be rolled up to account/group level.
- **Technical complexity estimate:** High
- **Monetization potential:** Very high for enterprise, franchise, and agency customers.
- **Suggested implementation approach:** Introduce an account-group or organization layer above tournaments, then attach venues, staff scopes, tournament portfolios, and cross-event analytics. Avoid copying data; use references to current canonical records.
- **Suggested packaging:** Enterprise monthly SaaS tier.

### 11. Broadcast Automation Hub
- **Problem it solves:** Score updates are currently great for overlays inside OpenScoreboard, but event producers also want scores to drive stream graphics, sponsor scenes, lower-thirds, and broadcast state changes automatically.
- **How it leverages existing OpenScoreboard data/architecture:** Scoreboard HTML/CSS/JS, dynamic URLs, public score views, and match/tournament context already exist. Realtime scoring data is already centralized.
- **Technical complexity estimate:** Medium to High
- **Monetization potential:** High for streamed events and media partners.
- **Suggested implementation approach:** Add a broadcast connector service that emits live score payloads, event labels, sponsor metadata, and scene cues. Start with OBS/browser-source-friendly JSON and websocket endpoints; then add managed connectors for streaming workflows.
- **Suggested packaging:** Monthly SaaS feature; connector setup can be a one-time add-on.

### 12. Twitch/YouTube/Overlay Connector Pack
- **Problem it solves:** Many operators do not want to custom-build their own overlay pipeline. They want prebuilt connectors and simple publish flows.
- **How it leverages existing OpenScoreboard data/architecture:** Extends the existing overlay system and public routes. Uses dynamic scoreboard templates and live score runtime as the source of truth.
- **Technical complexity estimate:** High
- **Monetization potential:** Medium to high, especially for event producers and streamers.
- **Suggested implementation approach:** Ship official connectors for OBS/browser sources first, then add managed adapter outputs for Twitch panels, YouTube live pages, and graphics systems via webhook or socket delivery. Avoid direct platform lock-in early; keep an internal broadcast event bus.
- **Suggested packaging:** Add-on module on top of Broadcast Automation Hub.

### 13. Paid Registration & Entry Fee Checkout
- **Problem it solves:** Clubs want registration, payment, and roster capture in one flow instead of separate forms and manual reconciliation.
- **How it leverages existing OpenScoreboard data/architecture:** Tournament registration settings already exist, player self-registration already exists, capability links already secure public entry points, and tournament/public visibility model already separates public surfaces.
- **Technical complexity estimate:** High
- **Monetization potential:** Very high because it creates direct revenue operations inside the product.
- **Suggested implementation approach:** Add tournament registration orders, payment status, refund state, and admin review queues. Start with Stripe Checkout plus webhook reconciliation, then map paid registrations into player list entries and event registrations. Keep payment records separate from score data for security/compliance reasons.
- **Suggested packaging:** Monthly SaaS feature plus transaction fee or premium percentage; enterprise customers may want flat pricing.

### 14. Priority Support & SLA Tiers
- **Problem it solves:** Commercial events need response guarantees when scoring or public links fail during live operation.
- **How it leverages existing OpenScoreboard data/architecture:** Audit trails, capability token logs, security events, and ownership logs already give support agents enough diagnostic surface to support SLA-backed operations.
- **Technical complexity estimate:** Low
- **Monetization potential:** High margin and especially attractive for event weekends.
- **Suggested implementation approach:** Productize support around account/tournament diagnostics, event escalation views, and event “war room” status. Add account metadata for support tier and internal runbooks rather than changing customer-facing schema much.
- **Suggested packaging:** Pure recurring SaaS support tier or event-weekend support add-on.

### 15. Partner API & Webhooks
- **Problem it solves:** Third parties want to sync schedules, scores, registrations, standings, and broadcast metadata into CRM, club management, signage, or custom apps.
- **How it leverages existing OpenScoreboard data/architecture:** The current canonical paths are already cleanly separated by entity, the server database proxy already enforces access, and capability token logic proves the platform can handle scoped external access patterns.
- **Technical complexity estimate:** High
- **Monetization potential:** Very high for enterprise and integration-heavy customers.
- **Suggested implementation approach:** Expose a supported read/write API around tournaments, tables, matches, scoreboards, registrations, and live events. Add webhook topics for score update, match completed, queue promoted, round published, registration submitted, and link revoked. Do not expose raw database paths directly.
- **Suggested packaging:** Enterprise SaaS feature; custom integrations billed separately as one-time services.

### 16. Video Match Recording & Evidence Sync
- **Problem it solves:** Competitive events want links between a scored match and its recorded video for highlights, disputes, coach review, and post-event content.
- **How it leverages existing OpenScoreboard data/architecture:** Match `auditTrail`, `pointHistory`, `judgePauseReason`, dispute flags, and tournament context already provide the metadata needed to anchor recordings to exact matches and time windows.
- **Technical complexity estimate:** Medium to High
- **Monetization potential:** Medium, but higher for professional/academy workflows.
- **Suggested implementation approach:** Add optional recording metadata references on matches and tournaments first, not actual video hosting. Start with external URL attachments, timestamp bookmarks, and dispute evidence references. Later add recorder integrations and clip exports.
- **Suggested packaging:** Add-on module; storage-heavy hosting should be priced separately if ever offered.

### 17. Print & Scanner Operations Pack
- **Problem it solves:** Events still use paper handouts, QR placards, table sheets, badges, and scanner-based check-in even when the scoring layer is digital.
- **How it leverages existing OpenScoreboard data/architecture:** QR issuance already exists, schedule blocks already know round/table/time context, and capability tokens already support revocable links for printed material.
- **Technical complexity estimate:** Medium
- **Monetization potential:** Medium to high for larger in-person events.
- **Suggested implementation approach:** Add print layouts for table cards, scorer handouts, registration slips, judge sheets, and badge labels. Pair those with scanner flows that resolve participant codes into tournament or registration records.
- **Suggested packaging:** Could be bundled into Operations Pro; hardware certification and custom printer setup should be a one-time add-on.

## Best Premium Candidates From Existing v3 Plans
The following already-planned v3 items are strong candidates to move into the JBM-Software commercial tier:

| Planned v3 area from `TASKS.md` | Recommendation | Reason |
| --- | --- | --- |
| Advanced bracket generation and rendering | Move to premium | High operational value, strong willingness to pay, clear differentiation from basic scoring tools. |
| Round management, bulk assignment, advancement logic | Move to premium | Tournament directors will pay; casual clubs can live without it. |
| Event scheduling vs table scheduling | Move to premium | Valuable at scale and tightly tied to tournament operations. |
| Bulk queue operations and auto-advance | Move to premium | Best for large events and operations-heavy customers. |
| Staff roles, invites, scoped permissions, ownership transfer | Premium for advanced scopes | Keep a simple owner/admin baseline in core, but tournament-scoped roles and transfers fit paid tiers well. |
| Public score view enhancements | Split | Basic public score view should stay core; branded/public microsites and premium public layouts should be premium. |
| Floor judge mode | Move to premium | Specialized operations workflow with strong value at larger events. |
| Player self-registration upgrades | Split | Secure token-based registration should be core; moderation, custom forms, payments, kiosk mode, and analytics should be premium. |
| Template administration and publish/unpublish workflows | Premium | Built-in templates and personal reuse can stay core; admin-managed template catalogs are commercial. |
| Point history export and advanced audit tooling | Premium | Base history is useful for product integrity; exports and analytics are commercial. |
| Team lineup management | Premium | Valuable mostly in organized team competition. |
| Bulk import dedupe, preview, rollback | Split | Basic import validation should be core; rollback, advanced merge logic, and audit workflows fit premium. |

## What Should Stay Core
These should remain part of the base product because they are infrastructure or trust features, not monetization levers:

- Security fixes for table/player-list access and migration away from plaintext passwords.
- Realtime scoring stability and live sync correctness.
- Basic tournament shell creation.
- TypeScript/typecheck remediation.
- Match schema evolution and compatibility work.
- Basic QR issuance and secure public/operator access.
- Basic public score view.
- Basic template use and scoreboard creation.

## SaaS Tiers vs One-Time Add-Ons

### Best Fit for Monthly SaaS Subscription
- Tournament Kiosk & Self-Service Registration
- Analytics Hub
- Player Performance History & Rankings
- Venue & Operations Trend Reporting
- White-Label Brand Kit
- Advanced Tournament Formats Pack
- League & Season Manager
- Multi-Venue Control Tower
- Broadcast Automation Hub
- Paid Registration & Entry Fee Checkout
- Partner API & Webhooks
- Priority Support / SLA

These work well as SaaS because they deliver ongoing operational value, require continued hosting/support, and become more valuable as customers run more events.

### Best Fit for One-Time Add-Ons
- Custom brand implementation and theme production
- Custom domain onboarding and DNS setup
- Printer/scanner hardware certification or onsite setup
- Custom API integration projects
- Event-weekend launch support
- Data migration from legacy systems

These are service-heavy and not inherently recurring, even if they support recurring premium features.

### Best Fit for Hybrid Pricing
- White-labeling: recurring feature fee plus optional design/setup fee
- API access: recurring platform fee plus one-time custom integration work
- Broadcast connectors: recurring connector access plus one-time scene/template setup
- Video integration: recurring metadata feature plus storage/integration fees if hosting or ingest is provided
- Payments: recurring feature fee plus payment volume fee or transaction margin

## Recommended Commercial Tier Structure

### Tier 1: Pro Operations
- Tournament kiosk
- secure self-registration with moderation
- premium QR print layouts
- queue automation
- branded public pages
- advanced staff roles

### Tier 2: Tournament Pro
- advanced formats
- rounds and schedule controls
- lineup tools
- league/standings support
- venue analytics
- public bracket/schedule publishing

### Tier 3: Broadcast Pro
- white-label overlays
- sponsor/branding controls
- broadcast automation hub
- connector pack
- public score embeds and microsites

### Tier 4: Enterprise / Multi-Venue
- multi-site management
- partner API and webhooks
- SLA and priority support
- custom domains
- organization-level reporting
- custom integration options

## Recommended Near-Term Premium Roadmap

### Phase 1: Fastest monetizable upgrades
- White-Label Brand Kit
- Tournament Kiosk & Self-Service Registration
- Advanced Tournament Formats Pack
- Broadcast Automation Hub
- Priority Support / SLA

### Phase 2: Expansion modules
- Analytics Hub
- Player Performance History
- Paid Registration & Entry Fees
- Partner API & Webhooks
- Print & Scanner Operations Pack

### Phase 3: Enterprise differentiation
- Multi-Venue Control Tower
- Custom Domains & Microsites
- League & Season Manager
- Video Match Recording & Evidence Sync

## Final Recommendation
The strongest JBM-Software commercial positioning is not “basic scorekeeping plus a paywall.” It is “event operations, branded public delivery, and tournament intelligence on top of a solid realtime scoring core.”

The best premium anchors for OpenScoreboard v3 are:

1. Advanced tournament operations
2. White-label/public presentation
3. Registration and payments
4. Analytics and history
5. Multi-venue control and integrations

That package fits the current architecture well because the codebase already has the hard foundational pieces: normalized match history, tournament containers, live sync, dynamic/public score routing, and a signed capability system.
