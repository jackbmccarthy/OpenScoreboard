# OpenScoreboard

**Open-source sports scoreboard and tournament management for table tennis, pickleball, tennis, badminton, and more.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20+-green.svg)
![Vite](https://img.shields.io/badge/vite-5.0-yellow.svg)
![React](https://img.shields.io/badge/react-19-cyan.svg)

---

## 🎯 What is OpenScoreboard?

OpenScoreboard is a free, open-source scoreboard and tournament management system. Create beautiful overlays for live streaming, manage tournaments, track players, and run league seasons.

**Built for:** Table Tennis • Pickleball • Tennis • Badminton • Squash • Racquetball • Paddle Tennis

---

## ✨ What's New in v3

### Architecture Refactor (March 2025)

| Before | After |
|--------|--------|
| Separate Expo + React Native apps | Single Vite + React web app |
| Multiple builds (app, editor, scoreboard) | One static build |
| AceBase-only database | Firebase + AceBase support |
| Complex Express server | Static files deploy anywhere |
| Monorepo with 3 separate apps | Unified single-page application |

### UI Improvements

- **GlueStack UI v3** - Modern, accessible component library
- **Orange brand accent** (#ff7800) - Matches LA Ping Pong branding
- **Responsive design** - Works on mobile, tablet, and desktop
- **Dark theme default** - Easy on the eyes for long scoring sessions

### Features

- 🎨 **Scoreboard Editor** - Drag-and-drop scoreboard designer with GrapesJS
- 📺 **Live Overlays** - Beautiful scoreboard overlays for OBS streaming
- 🏆 **Tournament Management** - Brackets, divisions, seeding
- 👥 **Player/Team Tracking** - Full roster management
- 📊 **League Seasons** - standings, schedules, stats
- 🔄 **Real-time Updates** - Live scoring with instant sync

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project (for cloud) OR AceBase (for local)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/openscoreboard.git
cd openscoreboard
npm install
```

### Development (Firebase Cloud)

```bash
npm run dev
```

### Development (Local with AceBase)

```bash
# Start AceBase server first
npx acebase-server

# Then run the app
npm run dev:local
```

### Build for Production

```bash
npm run build
```

Output is in `dist/` - static files ready to deploy anywhere.

---

## 📦 Deployment

### Cloud Deployment (Firebase)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firebase Authentication** (Google, Email/Password, Apple)
3. Create a **Realtime Database**
4. Copy your config to `.env`:

```env
VITE_USE_LOCAL_DB=false
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

5. Build and deploy:

```bash
npm run build
# Upload dist/ to Vercel, Netlify, S3, or any static host
```

### Local Deployment (AceBase)

```env
VITE_USE_LOCAL_DB=true
VITE_ACEBASE_HOST=localhost
VITE_ACEBASE_PORT=3434
```

Run AceBase server:
```bash
npx acebase-server
```

---

## 🏓 Supported Sports

| Sport | Games/Sets | Scoring | Notes |
|-------|-------------|---------|-------|
| **Table Tennis** | Best of 5-9 games | 11 points, 2-point margin | ITTF rules |
| **Pickleball** | Best of 1-3 games | 11/15/21 points | Side-out scoring option |
| **Tennis** | Best of 3-5 sets | Standard tennis | Tiebreaks supported |
| **Badminton** | Best of 3 games | 21 points | Rally scoring |
| **Squash** | Best of 5 games | 11 points | Hand-out scoring |
| **Racquetball** | Best of 3 games | 15 points | Hand-out scoring |
| **Paddle Tennis** | Best of 3 sets | 11 points, no-advantage | Modified tennis |

**Custom sports** can be configured by editing scoring rules in the app.

---

## 🎨 Scoreboard Editor

The GrapesJS-based editor lets you create custom scoreboard designs:

1. Navigate to `/editor`
2. Drag-and-drop components
3. Set player/team name positions
4. Set score display positions
5. Save and use in matches

### Default Elements

- Player/Team names
- Score displays
- Point/game counters
- Timer displays
- Logo placement
- Custom text

---

## 📱 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Home dashboard |
| `/login` | Sign in with Firebase |
| `/tables` | Manage tables/courts |
| `/teams` | Team roster management |
| `/players` | Player database |
| `/scoring/table/:id` | Live table scoring |
| `/teamscoring/teammatch/:id` | Team match scoring |
| `/editor` | Scoreboard designer |
| `/scoreboard/:id` | Public scoreboard overlay |
| `/settings` | App settings |
| `/archivedmatches` | Match history |
| `/scheduledtablematches` | Schedule view |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite 5 + React 19 |
| **Routing** | React Router DOM v7 |
| **UI Components** | GlueStack UI v3 |
| **Styling** | Tailwind CSS |
| **Auth** | Firebase Authentication |
| **Database** | Firebase Realtime Database (cloud) or AceBase (local) |
| **Scoreboard Editor** | GrapesJS |
| **TypeScript** | Strict mode |

---

## 📁 Project Structure

```
openscoreboard/
├── src/
│   ├── main.tsx           # React entry
│   ├── App.tsx            # Routing config
│   ├── pages/             # Route pages
│   │   ├── editor/       # GrapesJS scoreboard editor
│   │   ├── scoreboard/    # Live scoreboard overlay
│   │   └── ...            # Other pages
│   ├── components/        # Shared UI components
│   └── lib/               # Firebase, AceBase, utilities
├── dist/                  # Build output (deploy this)
├── index.html             # HTML entry
├── vite.config.ts         # Vite configuration
└── package.json
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- [GlueStack](https://gluestack.io/) - UI component library
- [GrapesJS](https://grapesjs.com/) - Web builder framework
- [Firebase](https://firebase.google.com/) - Authentication and database
- [AceBase](https://acebase.com/) - Local real-time database

---

**OpenScoreboard** - Free sports scoring for everyone.
