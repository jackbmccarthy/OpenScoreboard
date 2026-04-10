# PRD: TASKS.md Execution Program

## Goal
Execute the `TASKS.md` backlog as a staged, verifiable program without breaking current operator workflows or the existing Firebase/AceBase compatibility contract.

## Non-negotiables
- Preserve current canonical paths, owner preview nodes, scoreboard URLs, query params, and flat match fields until migration is complete.
- Start with the critical issues section before broader feature work.
- Each tranche must include migration/backfill, UI state handling, permission checks, and verification.
- No “all at once” schema rewrite.

## Phased delivery order
1. CI-1 Type baseline and `@ts-nocheck` reduction
2. CI-2 Ownership, soft delete, and orphan control
3. CI-3 Shared realtime sync model
4. CI-4 Secure access token/QR workflow
5. CI-5 Extensible match schema with legacy compatibility
6. Feature streams after foundations are stable

## Scope
- Program-level execution framing for the full backlog.
- Immediate execution kickoff on foundation work only.

## Out of scope for the first tranche
- Claiming completion of the full `TASKS.md` backlog in a single patch
- Parallel execution of dependent critical issues without baseline verification
