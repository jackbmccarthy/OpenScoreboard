Cleanup plan

1. Freeze external data contracts first.
   Preserve every existing Realtime Database path, field name, and object shape used by live clients and overlays.

2. Separate read and write responsibilities.
   Keep client-side read/listener helpers intact where possible, and introduce a narrow server-write transport instead of editing object models.

3. Replace routing/bootstrap with the smallest viable Next.js shell.
   Migrate entrypoints and route wrappers before touching feature logic.

4. Repoint write helpers one module at a time.
   Centralize server-bound mutations behind a shared request layer, then swap each existing helper to use it without changing its public API.

5. Verify compatibility continuously.
   Build, typecheck, and inspect affected files after the route migration and again after the server-write migration.
