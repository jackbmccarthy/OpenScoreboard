# OpenScoreboard

Open-source sports scoreboard and tournament management for table tennis, pickleball, tennis, badminton, and more.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Next.js](https://img.shields.io/badge/next.js-15-black.svg)
![React](https://img.shields.io/badge/react-19-cyan.svg)

## What It Is

OpenScoreboard is a free, open-source scoreboard and tournament management system. You can manage players and teams, run live scoring, design scoreboard overlays, and push updates to clients in realtime.

Built for: Table Tennis, Pickleball, Tennis, Badminton, Squash, Racquetball, and Paddle Tennis.

## v3 Architecture

The current `v3` branch is a Next.js application.

| Area | Current approach |
| --- | --- |
| App runtime | Next.js App Router |
| UI | React 19 + Tailwind CSS |
| Auth | Firebase Authentication |
| Cloud database | Firebase Realtime Database |
| Local database | AceBase |
| Scoreboard editor | GrapesJS |
| Realtime updates | Existing DB listener paths remain in place |
| Cloud writes | Routed through the Next server at `/api/database` |

The important compatibility constraint for this branch is that database field names, object shapes, and listener paths stay aligned with the existing main-branch contract. Clients still subscribe to the same Realtime Database paths, so scoreboard and scoring updates continue to propagate as before.

## What Changed In This Migration

- The old Vite app shell was replaced with Next.js route wrappers under `app/`.
- Existing screen components now live under `src/screens/`.
- React Router-dependent screen code is kept working through a small compatibility layer in `src/lib/router.tsx`.
- In Firebase cloud mode, browser writes no longer go directly to Firebase. They are proxied through `app/api/database/route.ts`.
- The server-side write driver in `src/server/databaseDriver.ts` preserves the same paths and payloads used by the current scoring and scoreboard code.

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- Firebase project for cloud mode, or AceBase for local mode

### Install

```bash
git clone https://github.com/jackbmccarthy/OpenScoreboard.git
cd OpenScoreboard
npm install
```

### Run in development

Firebase cloud mode:

```bash
npm run dev
```

AceBase mode:

```bash
npm run dev:local
```

### Production build

```bash
npm run build
npm run start
```

The production server listens on port `3000` by default.

### TypeScript baseline

Run these before pushing changes:

```bash
npm run typecheck
npm run check:ts-nocheck
```

Project rule: do not add new `@ts-nocheck` directives under `app/` or `src/`.

## Environment Variables

### Firebase cloud mode

Set these for the normal hosted app:

```env
NEXT_PUBLIC_USE_LOCAL_DB=false
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Legacy `VITE_*` names are still accepted as fallbacks, but new setups should use `NEXT_PUBLIC_*`.

### AceBase mode

```env
NEXT_PUBLIC_USE_LOCAL_DB=true
NEXT_PUBLIC_ACEBASE_HOST=localhost
NEXT_PUBLIC_ACEBASE_PORT=8080
NEXT_PUBLIC_ACEBASE_USE_SSL=false
NEXT_PUBLIC_DATABASE_NAME=openscoreboard
```

## Docker

Build:

```bash
docker build -t openscoreboard .
```

Run in Firebase cloud mode:

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_USE_LOCAL_DB=false \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com \
  -e NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com \
  -e NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id \
  -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com \
  -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 \
  -e NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123 \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  openscoreboard
```

The Dockerfile is a multi-stage Next.js production image and expects Next standalone output.

## Deployment Notes

- This is no longer a static Vite export. It must run as a Node server.
- In cloud mode, `/api/database` must be available because Firebase writes are mediated by the server.
- Firebase security rules still apply because the server forwards the signed-in user token to the Realtime Database REST API.
- Client-side realtime listeners still use the same database paths and objects as before.

For full deployment examples, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Main Routes

| Route | Description |
| --- | --- |
| `/` | Home dashboard |
| `/login` | Sign in |
| `/tables` | Manage tables and scoring surfaces |
| `/players` | Player list management |
| `/teams` | Team management |
| `/scoreboards` | Scoreboard list |
| `/editor` | GrapesJS scoreboard editor |
| `/scoreboard/view` | Live scoreboard overlay |
| `/scoring/table/[id]` | Table scoring |
| `/teamscoring/teammatch/[teamMatchID]` | Team match scoring |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend runtime | Next.js 15 |
| UI | React 19 |
| Styling | Tailwind CSS |
| Routing compatibility | Thin React Router compatibility layer |
| Auth | Firebase Authentication |
| Cloud DB | Firebase Realtime Database |
| Local DB | AceBase |
| Editor | GrapesJS |
| Language | TypeScript |

## Project Structure

```text
openscoreboard/
├── app/                  # Next.js app router entrypoints
├── src/
│   ├── screens/          # Screen components wrapped by app routes
│   ├── components/       # Shared UI components
│   ├── lib/              # Auth, env, Firebase, DB compatibility layer
│   ├── server/           # Server-side database write driver
│   ├── functions/        # Business logic and mutations
│   ├── scoreboard/       # Realtime scoreboard listeners/rendering
│   └── classes/          # Data models
├── public/
├── next.config.mjs
├── DEPLOYMENT.md
└── Dockerfile
```

## Supported Sports

- Table Tennis
- Pickleball
- Tennis
- Badminton
- Squash
- Racquetball
- Paddle Tennis

Custom sports can still be added by extending the current scoring and scoreboard configuration.

## Contributing

1. Fork the repository
2. Create a branch
3. Make changes
4. Run verification
5. Open a pull request

## License

MIT License.
