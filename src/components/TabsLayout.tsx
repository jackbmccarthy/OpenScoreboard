// Tabs Layout component for OpenScoreboard
// Provides tab navigation across the main app

import { Box, HStack, VStack, Text, Button } from './ui'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, logOut } from '@/lib/auth'
import { useState, useEffect } from 'react'
import { 
  ScoreboardIcon, 
  PlayersIcon, 
  TeamsIcon, 
  TablesIcon,
  SettingsIcon,
  HomeIcon,
  MenuIcon,
  XIcon,
  LogoutIcon,
  UserIcon
} from './icons'

interface TabItem {
  name: string
  label: string
  path: string
  icon: React.ReactNode
}

const tabs: TabItem[] = [
  { name: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <HomeIcon size={18} /> },
  { name: 'players', label: 'Players', path: '/players', icon: <PlayersIcon size={18} /> },
  { name: 'teams', label: 'Teams', path: '/teams', icon: <TeamsIcon size={18} /> },
  { name: 'tables', label: 'Tables', path: '/tables', icon: <TablesIcon size={18} /> },
  { name: 'settings', label: 'Settings', path: '/settings', icon: <SettingsIcon size={18} /> },
]

export default function TabsLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated (must be in useEffect to avoid React Router warning)
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const getCurrentTab = () => {
    const found = tabs.find(t => location.pathname === t.path || (t.path !== '/' && location.pathname.startsWith(t.path)))
    return found?.name || 'index'
  }

  const handleLogout = async () => {
    await logOut()
    setShowUserMenu(false)
    navigate('/')
  }

  // Don't render tabs while loading
  if (loading) {
    return (
      <Box className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Box className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></Box>
        <Text className="mt-4 text-gray-500">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box className="app-shell-bg flex min-h-screen flex-col overflow-x-hidden">
      {/* ── Header ── ONE ROW on mobile, compact padding ── */}
      <Box className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
        <HStack className="app-glass mx-auto max-w-7xl items-center justify-between rounded-[1.75rem] border border-white/70 px-3 py-2 lg:flex-nowrap lg:gap-3 lg:px-5 lg:py-3">

          {/* Mobile: Hamburger + Logo + Avatar — ALL ONE ROW */}
          <HStack className="flex items-center gap-1 lg:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-2xl p-2 hover:bg-white"
            >
              {mobileMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-md">
                <ScoreboardIcon size={16} color="white" />
              </Box>
            </Link>
            <Box className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-md">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="h-9 w-9 rounded-xl object-cover" />
              ) : (
                <Text className="text-sm font-semibold text-white">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              )}
            </Box>
          </HStack>

          {/* Desktop: Logo + full nav */}
          <HStack className="hidden items-center gap-4 lg:flex">
            <Link to="/dashboard" className="group flex items-center gap-3">
              <Box className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-[1.03]">
                <ScoreboardIcon size={22} color="white" />
              </Box>
              <VStack className="gap-0">
                <Text className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Open Scoreboard</Text>
                <Text className="text-xs text-slate-500">Built for stream desks and tournament ops</Text>
              </VStack>
            </Link>
            <HStack className="items-center gap-2">
              {tabs.map((tab) => {
                const isActive = getCurrentTab() === tab.name
                return (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    className={`nav-pill flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{tab.icon}</span>
                    {tab.label}
                  </Link>
                )
              })}
            </HStack>
          </HStack>

          {/* Desktop user name — hidden on mobile */}
          <Text className="hidden text-sm font-semibold text-slate-900 lg:block">
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
        </HStack>

        {/* Mobile Navigation — hamburger dropdown */}
        {mobileMenuOpen && (
          <Box className="mobile-sheet-enter app-glass mt-2 rounded-[1.75rem] border border-white/70 p-3 lg:hidden">
            <VStack className="gap-2">
              <Text className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigate</Text>
              {tabs.map((tab) => {
                const isActive = getCurrentTab() === tab.name
                return (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-pill flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-all ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </Link>
                )
              })}
              <Box className="premium-divider my-2" />
              <Link to="/my-account" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white">
                My Account
              </Link>
              <Link to="/my-scoreboards" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-white">
                My Scoreboards
              </Link>
            </VStack>
          </Box>
        )}
      </Box>

      {/* ── Page Content ── */}
      <Box className="mx-auto flex-1 w-full max-w-7xl overflow-x-hidden px-4 pb-24 pt-4 lg:px-6 lg:pt-6">
        {children ?? <Outlet />}
      </Box>

      {/* ── Bottom Tab Bar — mobile only ── */}
      <Box className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <HStack className="app-glass items-center justify-around border-t border-white/70 bg-white/80 backdrop-blur-lg px-1 pt-1">
          {tabs.map((tab) => {
            const isActive = getCurrentTab() === tab.name
            const isScoringRoute = location.pathname.startsWith('/scoring/table') || 
                                   location.pathname.startsWith('/teamscoring/') ||
                                   location.pathname.startsWith('/match/')
            return (
              <Link
                key={tab.name}
                to={isScoringRoute ? '#' : tab.path}
                onClick={(e) => isScoringRoute && e.preventDefault()}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 ${isScoringRoute ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Box className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                  {tab.icon}
                </Box>
                <Text className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {tab.label}
                </Text>
              </Link>
            )
          })}
        </HStack>
      </Box>

      {/* ── Footer — hidden on mobile (bottom bar replaces it) ── */}
      <Box className="hidden px-3 pb-3 sm:px-4 lg:block">
        <HStack className="app-glass mx-auto max-w-7xl flex-col items-start justify-between gap-3 rounded-[1.5rem] border border-white/70 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center">
          <Text>Open Scoreboard v3.0</Text>
          <HStack className="flex-wrap gap-4">
            <Link to="/settings" className="transition-colors hover:text-slate-900">Settings</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">GitHub</a>
          </HStack>
        </HStack>
      </Box>
    </Box>
  )
}
