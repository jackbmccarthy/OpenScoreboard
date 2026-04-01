# OpenScoreboard v3 - Deployment Guide

## Overview

OpenScoreboard v3 is a Next.js 15 application with:
- **Auth**: Firebase Authentication (NextAuth.js)
- **Database**: AceBase (real-time database)
- **UI**: GlueStack UI v3 with Tailwind CSS
- **Server**: Node.js/Express with AceBase Server

---

## Environment Variables

### Required

```env
# Firebase (get from Firebase Console)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# AceBase Database
ACEBASE_DATABASE_NAME=openscoreboard
ACEBASE_PATH=/path/to/database  # Local path for AceBase storage
USE_LOCAL_DB=false  # true for local-only builds

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_random_secret_here

# Server
PORT=8080
```

---

## Coolify Deployment

### 1. Create Application in Coolify

1. Go to **https://coolify.jackmccarthy.dev**
2. **New Resource** → **Application**
3. Select GitHub repository: `jackbmccarthy/OpenScoreboard`
4. Select branch: `v3`

### 2. Configure Build

- **Build Pack**: `Nixpacks` (for Node.js)
- **Build Command**: `npm run build`
- **Run Command**: `npm start`

### 3. Set Environment Variables

Add these in Coolify UI:

```env
NODE_ENV=production
PORT=8080
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
NEXTAUTH_URL=https://openscoreboard.your-domain.com
NEXTAUTH_SECRET=generate_random_string
ACEBASE_DATABASE_NAME=openscoreboard
USE_LOCAL_DB=false
```

### 4. Set Port

- **Port**: `8080`

### 5. Custom Domain (optional)

- Add domain: `openscoreboard.your-domain.com`
- Point to Coolify's generated domain

### 6. Deploy

Click **Deploy** or push to `v3` branch for auto-deploy.

---

## Local Development

```bash
cd openscoreboard-app
npm install
npm run dev
```

---

## Database Setup

### AceBase (Cloud)

The app connects to your AceBase server. Ensure:

1. **Server URL** is set correctly in environment
2. **CORS** is configured on AceBase server
3. **Authentication** is enabled if using remote DB

### AceBase (Local)

For local-only builds:

```env
USE_LOCAL_DB=true
ACEBASE_PATH=./data
```

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Start production
npm start
```

---

## Architecture

```
OpenScoreboard v3/
├── app/                    # Next.js App Router
│   ├── (tabs)/           # Tab navigation
│   │   ├── index.tsx     # Home/Dashboard
│   │   ├── players/      # Player management
│   │   ├── teams/        # Team management
│   │   └── settings/     # App settings
│   ├── editor/           # Scoreboard editor
│   ├── scoreboard/        # Live scoreboard overlay
│   ├── login/            # Auth pages
│   └── match/[id]/       # Match scoring
├── components/
│   └── ui/               # GlueStack UI v3 components
├── lib/
│   ├── acebase.ts        # AceBase client
│   ├── auth.ts           # NextAuth config
│   └── firebase.ts       # Firebase config
└── server/               # AceBase server (if running separately)
```

---

## Troubleshooting

### "Firebase auth not working"

1. Check environment variables are set correctly
2. Verify Firebase project settings in console
3. Check CORS settings if using remote Firebase

### "AceBase connection failed"

1. Verify `USE_LOCAL_DB` is set correctly
2. Check AceBase server is running
3. Verify CORS settings on AceBase server

### "Build failed"

1. Check `npm install` completed successfully
2. Verify all environment variables are set
3. Check build logs for specific errors

---

## Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [GlueStack UI v3](https://gluestack.io/ui)
- [Firebase Console](https://console.firebase.google.com)
- [AceBase Documentation](https://acebase.com)
- [Coolify Documentation](https://coolify.io/docs)
