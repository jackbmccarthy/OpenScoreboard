# OpenScoreboard v3 — User Guide

## What is OpenScoreboard?

OpenScoreboard is a **live scoring and tournament management platform** for table sports (ping pong, pool, darts, etc.). It lets you run real-time scoreboards, manage tournaments with brackets, track players and teams, and display scores on big screens.

---

## Getting Started

### First Login
1. Open the app → you'll land on the **Home Page**
2. Tap **Log In** to sign in with your account
3. After login, you're taken to the **Dashboard**

### Navigation
The main nav is a **tab bar at the bottom** on mobile, or a **left sidebar** on desktop:
- 🏠 Home / Dashboard
- 🏓 Players
- 👥 Teams
- 📋 Tournaments
- 🪑 Tables
- 🎯 Scoreboards
- ⚙️ Settings

---

## Core Concepts

### Tables
A **Table** is a physical playing surface (Table 1, Table 2, etc.). Each table can host one active match at a time. Tables are the central unit of the scoreboard system.

### Matches
A **Match** is a single game between players or teams. Matches can be:
- **Individual** — one vs one
- **Team** — team vs team (multiple individual matches combined)

### Players & Player Lists
- **Players** are individual people who compete
- **Player Lists** are groups of players (e.g., "Men's Singles", "Women's Doubles")
- Players can be imported in bulk or added one at a time

### Scoreboards
A **Scoreboard** is the visual display shown on a TV or monitor. Each scoreboard is a customizable layout that pulls live data from active matches.

### Tournaments
A **Tournament** contains events, brackets, rounds, and a schedule. It organizes multiple matches into a structured competition.

---

## Features & How to Use Them

---

### 1. Tables & Live Scoring

**Where:** `/tables`

This is the **operations hub** — the main screen for day-of match management.

#### View Table Status
Every table card shows:
- Current match (if any) — player/team names and live score
- Table status: 🟢 Active | 🟡 Idle | ⏸️ Paused
- Scheduled match count for this table
- Next scheduled match

Tables update in **real-time** — no page refresh needed.

#### Score a Match
1. From `/tables`, tap **"Score"** on any table
2. The **Scoring Station** opens (`/scoring/table/:id`)
3. Use the big +1 / +N buttons to add points
4. The score updates live on any connected scoreboard display
5. Tap **Complete** to finish the match

#### Scoring Features
- **Undo** — tap the undo button to revert the last point scored
- **Point History** — a scrollable timeline of all points in the current game
- **Sync Indicator** — shows connection status (🟢 connected / 🔴 offline)
- **Timeout** — request a timeout (if supported by the sport rules)
- **Manual Correction** — scorers can manually adjust score with confirmation

#### Pause / Resume
- Tap **Pause** to suspend a match
- Tap **Resume** to continue

---

### 2. Players

**Where:** `/players` or `/player-lists`

#### Add a Player
1. Go to `/players` → tap **+ Add Player**
2. Enter: First name, Last name, Country, Club/School (optional)
3. Tap **Save**

#### Bulk Import Players
1. Go to `/bulkplayer`
2. Paste a list (CSV format: name, email, country)
3. Preview the import — duplicates are highlighted
4. Confirm to import

#### Player Lists
- Group players into lists for different events (e.g., "Singles", "Doubles")
- From `/player-lists`, create a new list, then add players to it
- Player lists are used when generating tournaments and scheduling matches

---

### 3. Teams

**Where:** `/teams`

#### Create a Team
1. Go to `/teams` → tap **+ New Team**
2. Enter: Team name, Logo URL (optional)
3. Add players to the team (from your player lists)
4. Save

#### Team Match Scoring
1. Go to `/teammatches`
2. Select two teams
3. The system creates a **best-of-N** match series
4. Each individual match is scored from the team match screen
5. Scores aggregate — the team with the most individual match wins takes the team match

#### Quick Jump to Scoring
From `/teammatches`, each team match card has a **"Score"** button that jumps directly to that team match's scoring station.

---

### 4. Scoreboards (TV Display)

**Where:** `/scoreboards` and `/scoreboards/templates`

#### Create a Scoreboard
1. Go to `/scoreboards` → **+ New Scoreboard**
2. Choose a template or start blank
3. Customize: team names, logos, colors, font sizes
4. Save

#### Edit a Scoreboard Layout
1. Go to `/editor`
2. Open an existing scoreboard
3. Drag-and-drop blocks:
   - **Score blocks** — player names, current score, game score
   - **Service icon** — shows who is serving
   - **Flag blocks** — for yellow/red cards, warnings
   - **Timer blocks** — match time, shot clock
   - **Text blocks** — tournament name, round, event info
4. Bind blocks to live data (player names, scores, etc.)
5. Preview in real-time

#### Display a Scoreboard
1. Open a scoreboard from `/scoreboards`
2. Tap **"View"** to open the public scoreboard URL
3. Connect to a TV or projector — the scoreboard auto-updates live

#### Share a Scoreboard
- Each scoreboard has a **public URL** (`/scoreboard/view?id=...`)
- Share this URL with anyone — no login needed to view
- Optional: require a password for private scoreboards

---

### 5. Tournaments

**Where:** `/tournaments`

#### Create a Tournament
1. Go to `/tournaments` → **+ New Tournament**
2. Enter: Name, Short Code, Venue, Timezone, Start/End Dates
3. Set **Visibility**: Private (invite only), Unlisted, or Public
4. Save

#### Tournament Tabs

Once inside a tournament (`/tournaments/:id`), you have 8 tabs:

##### Overview Tab
- Edit tournament details (name, venue, description)
- See overall status and your access role

##### Events Tab
- **Events** are sub-competitions within a tournament (e.g., "Men's Singles", "Women's Doubles")
- Create events, assign a format (single elimination, double elimination, round robin)
- Events contain brackets and rounds

##### Brackets Tab
- Generate brackets for each event
- Enter seed labels (one per line) to name bracket positions
- Brackets update live as matches complete

##### Rounds Tab
- **Rounds** organize matches within an event
- Create rounds, set format (standard, playoff, tiebreaker)
- Assign tables to rounds
- Lock rounds to prevent accidental edits
- **Auto-advance**: when a round completes, automatically unlock the next round

##### Schedule Tab
- **Event scheduling** is separate from table scheduling
- Add schedule blocks: warm-up, matches, breaks
- **Conflict detection**: prevents double-booking the same player/team
- Auto-generate schedule from bracket format
- Publish schedule to make it visible to participants

##### Staff Tab
- Add staff members (admins, scorers, viewers)
- Assign roles with different permissions
- Invite people by email
- Revoke access at any time

##### Registration Tab
- Manage who can register for the tournament
- Set registration open/closed

##### Public Tab
- Control what non-participants can see
- Toggle visibility of: brackets, schedule, results

---

### 6. Scheduled Matches & Queue Management

**Where:** `/scheduledtablematches`

#### How the Queue Works
When matches are scheduled for specific tables, they appear in the queue for each table in order.

#### Promote a Match
1. From `/scheduledtablematches`, find the table's queue
2. Tap **"Promote"** on the next scheduled match
3. The match moves to active scoring — no manual data entry needed

#### Reorder the Queue
- Drag-and-drop to reorder scheduled matches
- Select multiple matches → bulk operations: reschedule, remove, copy

#### Auto-Advance
Enable **auto-advance** on a table's queue:
- When a match ends, the next match auto-promotes after a countdown
- Modes: Manual (prompt before promoting), Automatic (no prompt)

---

### 7. QR Codes & Phone Operator Tools

**Where:** `/qrcode`

#### Generate QR Codes for:
- **Table scoring** — scan to open the scoring station for that table
- **Team match scoring** — scan to open team match scoring
- **Public score view** — scan to see live scores on a phone
- **Player registration** — scan to open the pre-filled registration form

#### Phone-First Scoring (Operator Mode)
1. Scan the QR code for a table
2. The simplified scoring UI opens on your phone
3. Large buttons, portrait-friendly, minimal chrome
4. All scoring syncs live to the scoreboard display

#### Floor Judge Mode
- Judges can mark point faults, warnings, and timeouts from their phone
- Actions sync immediately to the scoring station and scoreboard

---

### 8. Archived Matches

**Where:** `/archivedmatches`

- View history of all completed matches
- Filter by: table, player, team, date range, round
- See final scores and match metadata

---

### 9. Bulk Import & Export

**Where:** `/bulkplayer` and `/bulkteams`

#### Bulk Import Players
- Paste CSV data
- Preview before confirming
- **Duplicate detection**: flags players with the same name/email
- **Country validation**: validates country codes
- Import can be undone

#### Bulk Import Teams
- Same workflow as players
- Team names are deduplicated automatically

---

### 10. Real-Time Collaboration

All screens with live data use **Firebase realtime subscriptions** — multiple operators can score from different devices simultaneously, and all connected scoreboard displays update instantly.

**Best Practices:**
- Use **scorer role** for operators who only score
- Use **admin role** for those who configure the tournament
- Keep **owner role** limited to tournament directors

---

## User Roles & Permissions

| Role | What they can do |
|------|-----------------|
| **Owner** | Full control — manage, delete, transfer ownership |
| **Admin** | Configure tournament, manage staff, edit brackets |
| **Scorer** | Score matches, use operator tools |
| **Viewer** | Read-only access to public information |

Roles are set per-tournament, not globally.

---

## Access & Sharing

### Public Scoreboards
Share the scoreboard view URL with anyone. No account needed to view live scores.

### Capability-Based Access
Instead of usernames/passwords, access to private scoreboards and tournaments is controlled by **capability tokens** — secure, time-limited links that grant specific permissions (read, write, admin).

### QR Code Access
QR codes on tables can encode capability tokens, so scanning a QR automatically grants the right level of access.

---

## Mobile Tips

- All pages are **responsive** and work on phones and tablets
- Scoring buttons are **large and touch-friendly** (48x48px minimum)
- **Full-screen scoring mode** hides all chrome for distraction-free operation
- Tables and tournament cards **stack properly** on narrow screens

---

## Troubleshooting

### Scoreboard not updating?
1. Check the sync indicator (🟢 = connected)
2. If 🔴, check internet connection
3. Try refreshing the scoreboard page

### Can't edit a tournament?
- You may only have **viewer** role — ask an admin to upgrade your access

### Match won't promote to active?
- The table may already have an active match
- Complete or archive the current match first

### Import showing duplicates?
- The preview highlights duplicates in yellow
- You can skip duplicates or merge them

---

## URL Reference

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/dashboard` | Main dashboard |
| `/tables` | Table management hub |
| `/scoring/table/:id` | Scoring station for a table |
| `/players` | Player list |
| `/player-lists` | Player list management |
| `/bulkplayer` | Bulk player import |
| `/teams` | Team list |
| `/teammatches` | Team match management |
| `/teammatches/:id` | Team match scoring |
| `/scoreboards` | Scoreboard management |
| `/scoreboards/templates` | Scoreboard template library |
| `/editor` | Scoreboard layout editor |
| `/tournaments` | Tournament list |
| `/tournaments/:id` | Tournament detail |
| `/tournaments/:id/brackets` | Tournament bracket view |
| `/tournaments/:id/schedule` | Tournament schedule |
| `/archivedmatches` | Match history |
| `/scheduledtablematches` | Scheduled match queue |
| `/qrcode` | QR code generator |
| `/settings` | App settings |
| `/my-account` | Account management |
