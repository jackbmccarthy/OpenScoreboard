Task statement
- Execute the backlog in `TASKS.md` for OpenScoreboard v3.
- Preserve backwards compatibility with current Firebase/AceBase paths, owner preview nodes, scoreboard URLs/query params, and existing flat match fields during rollout.

Desired outcome
- The `TASKS.md` backlog is driven as a staged program beginning with critical foundation issues.
- Each implementation tranche is grounded in schema docs, migration/backfill strategy, UI state handling, permission checks, and verification.
- Critical issues are handled in dependency order instead of unsafe broad-sweep edits.

Known facts / evidence
- `TASKS.md` defines a multi-epic program across critical issues CI-1 through CI-5 and multiple feature streams.
- Existing planning artifacts in `.omx/plans/` cover specific earlier tasks, but not the full `TASKS.md` program.
- Current worktree includes local-only deletions for `.env.*` that are unrelated to this requested program and should not be swept into backlog execution accidentally.
- The repo currently still contains significant `@ts-nocheck` usage and owner-index-only delete flows, both explicitly called out by CI-1 and CI-2.
- The project already has live scoring, templates, dynamic URLs, and shared scoring helpers, so foundational debt and ownership issues should be fixed before broader features rely on them.

Constraints
- Preserve existing Firebase/AceBase paths and flat match fields until readers are migrated and verified.
- Avoid claiming completion of the entire backlog without phased delivery evidence.
- Do not mix unrelated local file deletions into backlog implementation commits.
- Start with critical issues in order because later features depend on them.

Unknowns / open questions
- How much of the current main/v3 drift affects CI-1 typing work versus feature work.
- Which existing canonical records are already orphaned in live data for CI-2 backfill.
- Whether local development/CI environments differ in ways that will affect the type baseline and delete/backfill tooling.

Likely codebase touchpoints
- `TASKS.md`
- typing/runtime-critical files listed under CI-1
- ownership/delete flows in `src/functions/*.ts`
- shared scoring/admin subscription surfaces
- schema-bearing classes and helper layers in `src/classes/*`, `src/functions/*`, and `src/server/*`
