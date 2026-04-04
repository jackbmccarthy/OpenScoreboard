// @ts-nocheck
import { BrowserRouter, Routes, Route } from '@/lib/router'

// Pages
import HomePage from './screens/HomePage'
import PlayersPage from './screens/PlayersPage'
import TeamsPage from './screens/TeamsPage'
import SettingsPage from './screens/SettingsPage'
import LoginPage from './screens/LoginPage'
import MyAccountPage from './screens/MyAccountPage'
import TablesPage from './screens/TablesPage'
import ScoreboardPage from './screens/ScoreboardPage'
import ScoreboardViewPage from './screens/ScoreboardViewPage'
import EditorPage from './screens/EditorPage'
import TableScoringPage from './screens/TableScoringPage'
import TeamsScoringPage from './screens/TeamsScoringPage'
import MatchPage from './screens/MatchPage'
import ArchivedMatchesPage from './screens/ArchivedMatchesPage'
import ScheduledTableMatchesPage from './screens/ScheduledTableMatchesPage'
import ScoreboardsPage from './screens/ScoreboardsPage'
import TeamMatchesPage from './screens/TeamMatchesPage'
import PlayerListsPage from './screens/PlayerListsPage'
import PlayerRegistrationPage from './screens/PlayerRegistrationPage'
import BulkPlayerPage from './screens/BulkPlayerPage'
import AddPlayersPage from './screens/AddPlayersPage'
import QRCodePage from './screens/QRCodePage'
import MyTeamsPage from './screens/MyTeamsPage'
import MyScoreboardsPage from './screens/MyScoreboardsPage'

// Layout component (tab navigation)
import TabsLayout from './components/TabsLayout'

// Auth provider
import { AuthProvider } from './lib/auth'

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Login - no layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Scoreboard viewer (fullscreen overlay) - requires query params sid + (tid or tmid) */}
        <Route path="/scoreboard/view" element={<ScoreboardViewPage />} />

        {/* Editor (fullscreen) */}
        <Route path="/editor" element={<EditorPage />} />

        {/* Main app with tab navigation */}
        <Route element={<TabsLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/my-account" element={<MyAccountPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route path="/scoring/table/:id" element={<TableScoringPage />} />
          <Route path="/teamscoring/teammatch/:id" element={<TeamsScoringPage />} />
          <Route path="/match/:id" element={<MatchPage />} />
          <Route path="/archivedmatches" element={<ArchivedMatchesPage />} />
          <Route path="/scheduledtablematches" element={<ScheduledTableMatchesPage />} />
          <Route path="/scoreboards" element={<ScoreboardsPage />} />
          <Route path="/teammatches" element={<TeamMatchesPage />} />
          <Route path="/player-lists" element={<PlayerListsPage />} />
          <Route path="/playerregistration/:id" element={<PlayerRegistrationPage />} />
          <Route path="/bulkplayer" element={<BulkPlayerPage />} />
          <Route path="/addplayers" element={<AddPlayersPage />} />
          <Route path="/qrcode" element={<QRCodePage />} />
          <Route path="/my-teams" element={<MyTeamsPage />} />
          <Route path="/my-scoreboards" element={<MyScoreboardsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
