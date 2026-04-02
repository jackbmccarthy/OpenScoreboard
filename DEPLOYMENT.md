# OpenScoreboard v3 - Deployment Guide

## Overview

OpenScoreboard v3 is a **Vite + React** static web app:
- **Auth**: Firebase Authentication (Firebase v8 SDK)
- **Database**: Firebase Realtime Database (cloud) or AceBase (local)
- **UI**: React with Tailwind CSS
- **Deployment**: Static files served by nginx

---

## Quick Deploy

### 1. Build

```bash
npm install
npm run build
```

Output is in `dist/` - ready to deploy anywhere.

### 2. Deploy Options

**Option A: Static Hosting (Vercel, Netlify, S3, Cloudflare Pages)**
- Upload `dist/` contents
- Done!

**Option B: Docker + Coolify**
```bash
docker build -t openscoreboard .
docker run -p 8080:80 openscoreboard
```

**Option C: Coolify (Nixpacks)**
- Build Command: `npm run build`
- Run Command: `npm run preview`
- Or use the Dockerfile

---

## Environment Variables

### Firebase (Cloud - VITE_USE_LOCAL_DB=false)

| Variable | Value |
|----------|-------|
| `VITE_USE_LOCAL_DB` | `false` |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://your-project.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123` |

### Local (VITE_USE_LOCAL_DB=true)

| Variable | Value |
|----------|-------|
| `VITE_USE_LOCAL_DB` | `true` |
| `VITE_ACEBASE_HOST` | `localhost` |
| `VITE_ACEBASE_PORT` | `3434` |

---

## Coolify Deployment

### 1. Create Application in Coolify

1. Go to your Coolify instance
2. **New Resource** → **Application**
3. Select GitHub repository: `jackbmccarthy/OpenScoreboard`
4. Select branch: `v3`

### 2. Configure Build

- **Build Pack**: `Nixpacks` (for Node.js)
- **Build Command**: `npm run build`
- **Run Command**: `npm run preview -- --port $PORT --host`

### 3. Set Environment Variables

Add these in Coolify UI:

```
VITE_USE_LOCAL_DB=false
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Deploy

Click **Deploy** or push to `v3` branch for auto-deploy.

---

## Docker Deployment

### Build Image

```bash
docker build -t openscoreboard .
```

### Run Container

```bash
docker run -p 8080:80 openscoreboard
```

### Environment Variables (Docker)

```bash
docker run -p 8080:80 \
  -e VITE_USE_LOCAL_DB=false \
  -e VITE_FIREBASE_API_KEY=your_key \
  -e VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com \
  -e VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com \
  -e VITE_FIREBASE_PROJECT_ID=your_project_id \
  -e VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com \
  -e VITE_FIREBASE_MESSAGING_SENDER_ID=123456789 \
  -e VITE_FIREBASE_APP_ID=1:123456789:web:abc123 \
  openscoreboard
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start with local database
npm run dev:local

# Preview production build
npm run preview
```

---

## Project Structure

```
openscoreboard/
├── src/
│   ├── pages/           # Route pages
│   ├── components/       # UI components
│   ├── lib/              # Firebase, database, auth
│   ├── functions/        # Business logic
│   └── classes/          # Data classes
├── dist/                 # Built output (deploy this)
├── index.html            # Entry HTML
├── vite.config.ts        # Vite config
└── Dockerfile            # Docker deployment
```

---

## Useful Links

- [Vite Documentation](https://vitejs.dev/)
- [Firebase Console](https://console.firebase.google.com)
- [Coolify Documentation](https://coolify.io/docs)
