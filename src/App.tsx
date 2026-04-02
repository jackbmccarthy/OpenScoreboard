import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Pages
import HomePage from './pages/HomePage'
import PlayersPage from './pages/PlayersPage'
import TeamsPage from './pages/TeamsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import MyAccountPage from './pages/MyAccountPage'
import TablesPage from './pages/TablesPage'
import ScoreboardPage from './pages/ScoreboardPage'
import ScoreboardViewPage from './pages/ScoreboardViewPage'
import EditorPage from './pages/EditorPage'
import TableScoringPage from './pages/TableScoringPage'
import TeamsScoringPage from './pages/TeamsScoringPage'
import MatchPage from './pages/MatchPage'
import ArchivedMatchesPage from './pages/ArchivedMatchesPage'
import ScheduledTableMatchesPage from './pages/ScheduledTableMatchesPage'
import ScoreboardsPage from './pages/ScoreboardsPage'
import TeamMatchesPage from './pages/TeamMatchesPage'
import PlayerListsPage from './pages/PlayerListsPage'
import PlayerRegistrationPage from './pages/PlayerRegistrationPage'
import BulkPlayerPage from './pages/BulkPlayerPage'
import AddPlayersPage from './pages/AddPlayersPage'
import QRCodePage from './pages/QRCodePage'
import MyTeamsPage from './pages/MyTeamsPage'
import MyScoreboardsPage from './pages/MyScoreboardsPage'

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

        {/* Scoreboard viewer (fullscreen overlay) */}
        <Route path="/scoreboard/:id" element={<ScoreboardViewPage />} />

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
