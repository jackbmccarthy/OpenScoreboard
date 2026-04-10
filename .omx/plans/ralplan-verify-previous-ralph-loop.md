# Verification Plan: Previous Ralph Loop

## Metadata
- Source spec: `.omx/specs/deep-interview-verify-previous-ralph-loop.md`
- Context: brownfield, local uncommitted tranche
- Goal: engineering-correctness verification only
- Scope:
  - CI-1 zero-`@ts-nocheck` + stricter guardrail
  - CI-2 future-facing `deletionLog` tracking
  - CI-3 first realtime helper/cleanup slice

## RALPLAN-DR Summary

### Principles
1. Verify the code that exists, not the code that was intended.
2. Prefer evidence already reproducible from the local worktree.
3. Preserve the user’s verification boundary: engineering correctness only.
4. Keep unrelated worktree noise out of the verdict.
5. Treat compatibility guarantees as first-class acceptance criteria.

### Decision Drivers
1. The tranche is broad and uncommitted, so correctness must be grounded in the current worktree, not prior summaries.
2. The user explicitly excluded runtime/manual QA and release readiness.
3. The highest-risk areas are compatibility preservation and listener cleanup behavior, not surface-level build health alone.

### Viable Options
1. Evidence-first direct verification
   - Pros: fastest, aligned with the user’s engineering-only boundary, uses the repo’s strongest current evidence.
   - Cons: runtime behavior is inferred from code + static checks, not browser-tested.
2. Diff-first audit with targeted evidence spot checks
   - Pros: strongest focus on changed files and claimed outcomes; catches “green build but wrong scope” failures.
   - Cons: slower and more review-heavy; needs explicit mapping from claims to files.
3. Runtime-heavy validation
   - Pros: highest confidence in live behavior.
   - Cons: violates the user’s stated verification boundary, so invalid here.

### Recommended Option
- Option 2 with Option 1 evidence collection.
- Reason: the user wants engineering correctness across three claimed outcomes, so the plan must audit that each claim maps to the current diff while still using the existing green evidence (`typecheck`, `build`, diagnostics, architect review).

## Architect Review Notes
- Steelman antithesis: a pure “green checks == correct” approach is too weak because the tranche spans CI guardrails, delete semantics, and realtime cleanup; code review must confirm the right code changed, not just that it compiles.
- Real tension:
  - broad local diff vs narrow verification scope
  - compatibility promises vs lack of runtime/browser coverage
- Synthesis:
  - use a claim-to-evidence matrix
  - verify each claimed outcome against concrete files and commands
  - explicitly report runtime coverage as residual risk rather than silently widening scope

## Critic Evaluation
- Principle-option consistency: pass
- Alternatives fairness: pass
- Risk mitigation clarity: pass
- Acceptance criteria testability: pass
- Verification steps concreteness: pass
- Verdict: APPROVE

## Ordered Verification Steps
1. Lock the verification scope.
   - In scope: only the three claimed outcomes from the spec.
   - Out of scope: commit/push readiness, unrelated worktree artifacts, browser/manual QA.
2. Build a claim-to-code matrix.
   - CI-1:
     - `.github/ts-nocheck-baseline.txt`
     - `scripts/check-no-new-ts-nocheck.sh`
     - `src/`, `app/`
   - CI-2:
     - `src/functions/deletion.ts`
     - `src/functions/{tables,players,teams,teammatches,scoreboards,scoreboardTemplates,dynamicurls}.ts`
     - `docs/ownership-model.md`
   - CI-3:
     - `src/lib/realtime.ts`
     - `docs/realtime-model.md`
     - `src/functions/scoring.ts`
     - `src/functions/players.ts`
     - `src/scoreboard/dynamicurls.ts`
     - `src/scoreboard/index.ts`
     - `src/scoreboard/addScoreboardSettingListeners.ts`
3. Re-read the local diff for those files only.
   - Verify that each claimed outcome is actually present in code, not only in prior summaries.
4. Run engineering evidence commands and read the output.
   - `npm run typecheck`
   - `npm run check:ts-nocheck`
   - `npm run build`
   - project diagnostics
5. Verify CI-1 specifically.
   - `rg -n "@ts-nocheck" src app` returns no matches.
   - baseline file is `0`.
   - guardrail script handles zero-match case.
6. Verify CI-2 specifically.
   - delete flows soft-delete canonical records instead of only removing preview entries.
   - `deletionLog` is additive and does not replace or rename existing canonical paths.
   - compatibility-sensitive field names and owner preview paths remain intact.
7. Verify CI-3 specifically.
   - shared realtime helper exists and is used in the claimed first-slice listeners.
   - scoreboard runtime cleanup registration now owns the HTML/CSS, dynamic URL, and settings listeners in:
     - `src/scoreboard/index.ts`
     - `src/scoreboard/addScoreboardSettingListeners.ts`
     - `src/scoreboard/dynamicurls.ts`
     - `src/functions/scoring.ts`
     - `src/functions/players.ts`
   - no new compatibility break was introduced in the listener flow.
8. Run final architectural sanity review.
   - confirm no blocking correctness/regression findings
   - explicitly note residual risks instead of widening scope
9. Produce the final verification verdict.
   - approved / not approved
   - supporting evidence
   - residual risks

## Acceptance Criteria
- The verification covers all three claimed outcomes, not just the latest code.
- Evidence is collected from the current local worktree, not prior agent summaries alone.
- `npm run typecheck` passes.
- `npm run check:ts-nocheck` passes with `current=0 baseline=0`.
- `npm run build` passes.
- diagnostics report `0 errors / 0 warnings`.
- Code review confirms:
  - zero `@ts-nocheck` in `src/` and `app/`
  - additive `deletionLog` integration in delete flows
  - shared realtime helper and initial cleanup registration are present
- Final report distinguishes:
  - verified engineering correctness
  - unverified runtime/browser behavior

## Evidence To Collect
- Command outputs:
  - typecheck
  - no-`@ts-nocheck` gate
  - build
  - diagnostics
- Code references for each claim:
  - guardrail files
  - delete helper + delete-flow call sites
  - realtime helper + runtime listener call sites
- Architect approval record

## Risks
- Broad callback/snapshot typing in scoreboard/editor runtime can still hide model drift even when typecheck is green.
- The verification does not prove browser/runtime behavior of GrapesJS or live scoreboard rendering.
- Unrelated local files remain in the worktree and must stay explicitly out of scope.

## ADR
- Decision:
  - Verify the previous Ralph tranche using a claim-to-code matrix plus local engineering evidence only.
- Drivers:
  - user explicitly limited the verification boundary
  - current local diff is broad and uncommitted
  - compatibility-sensitive changes need code review, not just green commands
- Alternatives considered:
  - green-check-only verification | rejected because it is too weak for a broad tranche
  - runtime/browser-heavy verification | rejected because it exceeds scope
- Why chosen:
  - balances rigor with the user’s boundary
- Consequences:
  - strong engineering-confidence verdict
  - residual runtime risk must be reported, not silently assumed away
- Follow-ups:
  - if the user later wants stronger confidence, run targeted runtime/manual validation on editor and scoreboard behavior

## Available-Agent-Types Roster
- `planner`
- `architect`
- `critic`
- `verifier`
- `explore`
- `executor`

## Staffing Guidance

### Ralph lane
- Leader: `verifier` or `architect`
- Supporting lanes:
  - `explore` for claim-to-file mapping
  - `verifier` for command evidence collection
  - `architect` for final sign-off

### Team lane
- Lane 1: `explore`
  - map claims to concrete files and changed code
- Lane 2: `verifier`
  - run typecheck/build/gate/diagnostics and summarize outputs
- Lane 3: `architect`
  - evaluate compatibility and regression risk

## Reasoning-By-Lane Guidance
- `explore`: low to medium
- `verifier`: medium
- `architect`: medium to high

## Launch Hints
- Ralph:
  - `$ralph .omx/specs/deep-interview-verify-previous-ralph-loop.md`
- Team:
  - `$team .omx/specs/deep-interview-verify-previous-ralph-loop.md`

## Team Verification Path
1. `explore` builds the claim-to-code matrix
2. `verifier` runs and reads:
   - `npm run typecheck`
   - `npm run check:ts-nocheck`
   - `npm run build`
   - diagnostics
3. `architect` reviews the current local diff against the three claimed outcomes
4. leader merges the evidence into one verdict
5. if anything fails or is unsupported, return `ITERATE`; otherwise approve the tranche
