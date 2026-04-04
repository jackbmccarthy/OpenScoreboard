# OpenScoreboard v3 - Deployment Guide

## Overview

OpenScoreboard v3 is a Next.js application:
- Auth: Firebase Authentication using the Firebase v8 web SDK
- Database: Firebase Realtime Database in cloud mode, or AceBase in local mode
- Writes: Cloud writes go through the Next server route at `/api/database`
- Realtime updates: Clients still subscribe to the same database paths and receive pushed updates as before
- Runtime: Long-running Node.js server, not a static export

## Docker Deployment

### Build the image

```bash
docker build -t openscoreboard .
```

### Run the container in Firebase cloud mode

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

Open the app at `http://localhost:3000`.

### Run the container in AceBase mode

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_USE_LOCAL_DB=true \
  -e NEXT_PUBLIC_ACEBASE_HOST=host.docker.internal \
  -e NEXT_PUBLIC_ACEBASE_PORT=8080 \
  -e NEXT_PUBLIC_ACEBASE_USE_SSL=false \
  -e NEXT_PUBLIC_DATABASE_NAME=openscoreboard \
  -e PORT=3000 \
  -e HOSTNAME=0.0.0.0 \
  openscoreboard
```

If AceBase is running in another container, set `NEXT_PUBLIC_ACEBASE_HOST` to that service name instead.

## Docker Compose Example

```yaml
services:
  openscoreboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_USE_LOCAL_DB: "false"
      NEXT_PUBLIC_FIREBASE_API_KEY: your_key
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: your_project.firebaseapp.com
      NEXT_PUBLIC_FIREBASE_DATABASE_URL: https://your_project.firebaseio.com
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: your_project_id
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: your_project.appspot.com
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789"
      NEXT_PUBLIC_FIREBASE_APP_ID: 1:123456789:web:abc123
      PORT: "3000"
      HOSTNAME: "0.0.0.0"
```

## Environment Variables

### Firebase cloud mode

Use these for production Docker deployments:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_LOCAL_DB` | Yes | Set to `false` for Firebase cloud mode |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Yes | Realtime Database URL used by both client reads and server writes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `PORT` | Recommended | Container listen port, default `3000` |
| `HOSTNAME` | Recommended | Bind address, use `0.0.0.0` in containers |

Legacy `VITE_*` variables still work as fallbacks, but new Docker deployments should set `NEXT_PUBLIC_*`.

### AceBase mode

Use these when the app should talk to AceBase instead of Firebase:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_LOCAL_DB` | Yes | Set to `true` |
| `NEXT_PUBLIC_ACEBASE_HOST` | Yes | Hostname reachable from the container |
| `NEXT_PUBLIC_ACEBASE_PORT` | Yes | AceBase port |
| `NEXT_PUBLIC_ACEBASE_USE_SSL` | No | `true` or `false` |
| `NEXT_PUBLIC_DATABASE_NAME` | No | Database name, default `openscoreboard` |

## Runtime Notes

- This app is not a static Vite build anymore. It must run as a Node server.
- The Next server route `/api/database` must be available in cloud mode because Firebase writes are proxied through it.
- Firebase security rules still apply. The server forwards the signed-in user's auth token to the Realtime Database REST API.
- Realtime listeners remain on the same paths and object shapes as the main branch, so scoreboard and client updates continue to work without schema changes.

## Build And Run Without Docker

```bash
npm install
npm run build
npm run start
```

The production server listens on port `3000` by default.

## Coolify

Dockerfile deployment is the recommended path.

If you use a Node/Nixpacks deployment instead of the Dockerfile:
- Build command: `npm run build`
- Run command: `npm run start`
- Port: `3000`

Set the same environment variables shown above for either Firebase cloud mode or AceBase mode.

## Project Structure

```text
openscoreboard/
├── app/                  # Next.js app router entrypoints
├── src/
│   ├── screens/          # Screen components wrapped by app routes
│   ├── components/       # UI components
│   ├── lib/              # Auth, env, Firebase, database compatibility layer
│   ├── server/           # Server-side database proxy driver
│   ├── functions/        # Business logic and data mutations
│   └── classes/          # Data classes
├── .next/                # Production build output
├── next.config.mjs       # Next.js configuration
└── Dockerfile            # Multi-stage production container
```

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Console](https://console.firebase.google.com)
- [Coolify Documentation](https://coolify.io/docs)
