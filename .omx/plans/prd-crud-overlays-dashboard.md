# PRD: CRUD Overlays And Dashboard Management

## Goal
Give authenticated users complete, consistent CRUD management across the dashboard-linked list screens.

## Non-negotiables
- Add flows use overlays rather than inline list insert forms.
- Edit is available for all relevant managed entities via overlay or dedicated page.
- Delete/hide actions require confirmation.
- Players and teams support bulk add, bulk edit, and bulk remove.
- Existing database field names, object shapes, and paths stay compatible.

## User stories
1. As an operator, I can add new players, teams, tables, team matches, and similar items through overlays without the list layout jumping.
2. As an operator, I can edit a team and other managed items from the list flow.
3. As an operator, I get a confirmation step before removing or hiding data from my list.
4. As an operator, I can perform bulk add/edit/remove for players and teams.

## Scope
- CRUD UX parity for key list entities linked from the dashboard.
- Modal/overlay add flows.
- Edit surfaces for missing entities, especially teams.
- Confirmation overlays for destructive actions.
- Bulk actions for players and teams.

## Out of scope
- Database schema redesign
- Auth model changes
- Full visual redesign of the app shell
