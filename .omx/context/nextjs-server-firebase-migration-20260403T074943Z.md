Task statement
- Convert the current Vite React application into a Next.js application.
- Move all current Firebase write operations behind the server while keeping client-side live updates working as they do now.
- Preserve compatibility with the main branch by keeping the same field names, object shapes, and database paths.

Desired outcome
- A running Next.js app that serves the current UI and routes.
- Browser clients no longer write directly to Firebase for the migrated write surface.
- Realtime listeners continue to observe the same Realtime Database nodes so existing scoreboards and clients keep updating.

Known facts / evidence
- The repo is currently a Vite app with `src/main.tsx` bootstrapping `src/App.tsx`.
- Routing is defined with `react-router-dom` in `src/App.tsx`.
- Firebase auth uses the web SDK in `src/lib/firebase.ts` and `src/lib/auth.tsx`.
- Realtime Database access is centralized only partially: most writes occur through helper modules under `src/functions/*.ts`.
- Live reads and subscriptions use `db.ref(...).on("value")` in scoreboard/runtime code and should remain compatible with current paths.
- The current write surface is concentrated in:
  - `src/functions/players.ts`
  - `src/functions/scoreboards.ts`
  - `src/functions/scoring.ts`
  - `src/functions/tables.ts`
  - `src/functions/teams.ts`
  - `src/functions/teammatches.ts`
  - `src/editor/plugins/connectToLiveTTScoreboardDB.ts`

Constraints
- Preserve field names and object shapes from the current main branch.
- Preserve database paths so downstream listeners and overlays still update.
- Keep the migration reviewable and reversible.
- Do not add unnecessary dependencies.
- Ralph planning gate requires PRD and test spec artifacts before implementation.

Unknowns / open questions
- Whether every page can be ported directly into the Next app router without route-specific SSR issues.
- Whether server-side Firebase writes should use the admin SDK with ID-token verification or a narrower proxy abstraction first.
- Whether local AceBase mode should remain client-only, server-only, or support both.

Likely codebase touchpoints
- Build/runtime: `package.json`, `tsconfig*.json`, `vite.config.ts`, Next config files
- App shell and routing: `src/App.tsx`, `src/main.tsx`, `src/components/TabsLayout.tsx`, page components
- Auth/database layer: `src/lib/firebase.ts`, `src/lib/database.ts`, `src/lib/auth.tsx`
- Mutation helpers: `src/functions/*.ts`, `src/editor/plugins/connectToLiveTTScoreboardDB.ts`
- Styling/assets: `src/index.css`, `public/*`
