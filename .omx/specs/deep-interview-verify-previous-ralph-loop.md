# Deep Interview Spec: Verify Previous Ralph Loop

## Metadata
- Profile: `standard`
- Context type: `brownfield`
- Rounds: `4`
- Final ambiguity: `0.12`
- Threshold: `0.20`
- Context snapshot: [verify-previous-ralph-loop-20260408T084900Z.md](/Users/jackmccarthy/AIProjects/OpenScoreboard/.omx/context/verify-previous-ralph-loop-20260408T084900Z.md)
- Transcript: [verify-previous-ralph-loop-20260408T085300Z.md](/Users/jackmccarthy/AIProjects/OpenScoreboard/.omx/interviews/verify-previous-ralph-loop-20260408T085300Z.md)

## Clarity Breakdown
- Intent Clarity: `0.95`
- Outcome Clarity: `0.95`
- Scope Clarity: `0.95`
- Constraint Clarity: `0.90`
- Success Criteria Clarity: `0.95`
- Context Clarity: `0.90`

## Intent
Independently verify that the previous Ralph tranche was done correctly before trusting or shipping it, without widening the ask into runtime/manual QA or release management.

## Desired Outcome
Judge engineering correctness of the previous local Ralph tranche across the full claimed scope using code review plus engineering evidence only.

## In Scope
- The full current local Ralph tranche as claimed in the prior completion summary
- `CI-1` outcome:
  - zero `@ts-nocheck`
  - stricter no-new-`@ts-nocheck` baseline and script behavior
- `CI-2` future-facing outcome:
  - additive `deletionLog` tracking through canonical delete flows
- `CI-3` first-slice outcome:
  - realtime inventory grounding
  - shared realtime helper introduction
  - initial listener/cleanup consolidation
- Verification methods:
  - code review
  - `npm run typecheck`
  - `npm run build`
  - diagnostics
  - architect review

## Out of Scope / Non-goals
- Commit readiness
- Push readiness
- Cleanup of unrelated worktree artifacts such as deleted `.env*`, `.omx/`, and `*.tsbuildinfo`
- Browser/manual runtime validation unless static/code-level evidence shows it is required

## Decision Boundaries
OMX may decide the verification result entirely from engineering evidence:
- code review
- typecheck
- build
- diagnostics
- architect review

OMX should not require browser/manual runtime checks unless a concrete code-level reason appears showing static verification is insufficient.

## Constraints
- Treat the repo as brownfield verification against the current local diff
- Preserve the already-stated three-outcome scope
- Do not widen into release-management concerns

## Testable Acceptance Criteria
- The verification explicitly covers all three claimed outcomes:
  1. zero `@ts-nocheck`
  2. `deletionLog` delete tracking
  3. first CI-3 realtime helper/cleanup slice
- Static engineering evidence is collected and read:
  - `npm run typecheck`
  - `npm run build`
  - diagnostics
- Architect review is obtained
- The verification report distinguishes in-scope engineering correctness from out-of-scope release/runtime concerns

## Assumptions Exposed And Resolved
- Assumption: “done correctly” might include runtime/manual QA.
  - Resolution: No, engineering correctness only.
- Assumption: verification might only apply to the most recent CI-3 code.
  - Resolution: No, all three claimed tranche outcomes are in scope.
- Assumption: commit/push cleanliness might be part of correctness.
  - Resolution: No, unrelated worktree/release concerns are out of scope.
- Assumption: OMX might need browser checks by default.
  - Resolution: No, static/code-review evidence is sufficient unless a concrete code-level gap appears.

## Pressure-pass Findings
The phrase “verify everything ... was done correctly” was refined into a specific acceptance boundary:
- engineering correctness only
- all three tranche outcomes
- no release-management concerns
- no runtime/manual verification by default

## Brownfield Evidence Notes
- Local repo state shows the Ralph tranche is still uncommitted and present in the worktree.
- Prior Ralph artifacts indicated:
  - typecheck/build/diagnostics passing
  - architect approval
  - tranche coverage over CI-1, CI-2 future-facing delete tracking, and CI-3 first realtime cleanup
- Those facts were used only to ground the interview, not to skip the explicit scope/criteria confirmation.

## Technical Context Findings
- The tranche spans a broad local diff across:
  - `src/functions/*`
  - `src/screens/*`
  - `src/editor/*`
  - `src/scoreboard/*`
  - docs and CI guardrails
- The verification target is the local engineering state, not a committed branch state.

## Handoff Recommendation
Recommended next step: `$ralplan` or direct code-review-style verification against this spec.

Suggested handoff artifact:
- [deep-interview-verify-previous-ralph-loop.md](/Users/jackmccarthy/AIProjects/OpenScoreboard/.omx/specs/deep-interview-verify-previous-ralph-loop.md)
