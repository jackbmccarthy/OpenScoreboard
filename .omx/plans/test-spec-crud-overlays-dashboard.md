# Test Spec: CRUD Overlays And Dashboard Management

## Acceptance checks
1. Logged-in users can open add overlays from the main list pages instead of inline add forms.
2. Teams have an edit surface reachable from the UI.
3. Remove/hide actions prompt for confirmation before committing.
4. Players support bulk add, bulk edit, and bulk remove.
5. Teams support bulk add, bulk edit, and bulk remove.
6. `npm run typecheck` passes.
7. `npm run build` passes.
8. Diagnostics on the repo show zero errors on affected files.

## Regression focus
- Existing object shapes passed into mutation helpers remain intact.
- Existing list reads still render correctly after modal-driven adds/edits/deletes.
- Dashboard-linked routes still work.
- Team and player bulk operations do not bypass the current mutation layer contract.

## Evidence plan
- Typecheck output
- Production build output
- Diagnostics output
- Code inspection of CRUD affordances and route hookups
