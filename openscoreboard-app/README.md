# Open Scoreboard v3 - Next.js

This is the **Next.js rewrite** of the OpenScoreboard scoring app using:
- **Next.js 15** (App Router)
- **GlueStack UI v3** components (styled with Tailwind CSS)
- **Firebase Auth** (NextAuth.js)
- **AceBase** for local development database

## Overview

OpenScoreboard is a sports scoring and management app with:
- `openscoreboard-app/` - Expo/React Native scoring app (original)
- `openscoreboard-scoreboard/` - Vanilla JS scoreboard overlay
- `openscoreboard-editor/` - GrapesJS editor
- Server: Node.js/Express/AceBase

## v3 Architecture

```
openscoreboard-app/
├── app/                    # Next.js App Router
│   ├── (tabs)/           # Tab navigation
│   │   ├── index.tsx     # Home/Dashboard
│   │   ├── players/
│   │   ├── teams/
│   │   └── settings/
│   ├── login/
│   ├── match/[id]/        # Match scoring interface
│   └── layout.tsx
├── components/
│   └── ui/               # UI components (GlueStack-like)
├── lib/
│   ├── acebase.ts        # AceBase DB client
│   ├── firebase.ts        # Firebase config
│   └── auth.ts           # NextAuth.js config
└── ...
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTHDOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Database
EXPO_PUBLIC_USE_LOCAL_DB=true  # Use AceBase instead of Firebase
EXPO_PUBLIC_DATABASE_NAME=mydb

# Auth (optional - for Google sign in)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Features

- **Scoring**: Real-time score tracking for table tennis, pickleball, and more
- **Teams**: Manage teams and team matches
- **Players**: Player lists and player management
- **Multi-sport**: Support for different scoring types (normal, rally, etc.)
- **Responsive**: Mobile-first design that works on all devices

## Notes

- This v3 is a rewrite from the ground up using Next.js
- The original Expo/React Native app remains available in the `main` branch
- GlueStack UI v3 components are implemented as Tailwind-based components for web compatibility
- Firebase authentication is preserved but integrated with NextAuth.js
