// Tabs Layout component for OpenScoreboard
// Provides tab navigation across the main app
// Adapted for Vite with react-router-dom

import { Box, HStack, VStack, Text, Button } from './ui'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, logOut } from '@/lib/auth'
import { useState, useEffect } from 'react'
import { 
  ScoreboardIcon, 
  PlayersIcon, 
  TeamsIcon, 
  SettingsIcon,
  HomeIcon,
  MenuIcon,
  XIcon
} from './icons'

interface TabItem {
  name: string
  label: string
  path: string
  icon: React.ReactNode
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', path: '/', icon: <HomeIcon size={18} /> },
  { name: 'players', label: 'Players', path: '/players', icon: <PlayersIcon size={18} /> },
  { name: 'teams', label: 'Teams', path: '/teams', icon: <TeamsIcon size={18} /> },
  { name: 'tables', label: 'Tables', path: '/tables', icon: <TablesIcon size={18} /> },
  { name: 'settings', label: 'Settings', path: '/settings', icon: <SettingsIcon size={18} /> },
]

// Add tables icon to imports if not present
import { TablesIcon } from './icons'

export default function TabsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Redirect to login if not authenticated (must be in useEffect to avoid React Router warning)
  // useEffect must be called BEFORE any early returns - React hooks rule
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
    navigate('/login')
  }

  // Don't render tabs while loading
  if (loading) {
    return (
      <Box className="flex flex-col min-h-screen bg-gray-50 items-center justify-center">
        <Box className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></Box>
        <Text className="mt-4 text-gray-500">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Modern gradient style */}
      <Box className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <HStack className="max-w-7xl mx-auto justify-between items-center px-4 lg:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 py-3 group">
            <Box className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <ScoreboardIcon size={22} color="white" />
            </Box>
            <VStack className="gap-0 hidden sm:block">
              <Text className="font-bold text-gray-900 text-lg leading-tight">Open Scoreboard</Text>
              <Text className="text-xs text-gray-500 leading-tight">Scorekeeping Made Simple</Text>
            </VStack>
          </Link>

          {/* Desktop Navigation */}
          <HStack className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = getCurrentTab() === tab.name
              return (
                <Link 
                  key={tab.name} 
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
                  {tab.label}
                </Link>
              )
            })}
          </HStack>

          {/* User Section */}
          <HStack className="items-center gap-3">
            <Box className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Box className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <Text className="text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </Box>
                <VStack className="gap-0 hidden md:block text-left">
                  <Text className="text-gray-900 text-sm font-medium max-w-[120px] truncate">
                    {user?.displayName || 'User'}
                  </Text>
                  <Text className="text-gray-500 text-xs truncate max-w-[120px]">
                    {user?.email}
                  </Text>
                </VStack>
              </Button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <Box className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Box className="px-4 py-2 border-b border-gray-100">
                    <Text className="text-xs text-gray-500 uppercase tracking-wide">Signed in as</Text>
                    <Text className="text-sm font-medium text-gray-900 truncate">{user?.email}</Text>
                  </Box>
                  <Link
                    to="/my-account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Box className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Text className="text-gray-500">👤</Text>
                    </Box>
                    My Account
                  </Link>
                  <Link
                    to="/my-scoreboards"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Box className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ScoreboardIcon size={16} color="gray" />
                    </Box>
                    My Scoreboards
                  </Link>
                  <Box className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Box className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                        <Text className="text-red-500">↩</Text>
                      </Box>
                      Sign Out
                    </button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </Button>
          </HStack>
        </HStack>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <Box className="lg:hidden border-t border-gray-100 bg-white">
            <VStack className="p-3 gap-1">
              {tabs.map((tab) => {
                const isActive = getCurrentTab() === tab.name
                return (
                  <Link 
                    key={tab.name} 
                    to={tab.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </Link>
                )
              })}
            </VStack>
          </Box>
        )}
      </Box>
      
      {/* Page Content */}
      <Box className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6">
        <Outlet />
      </Box>

      {/* Footer */}
      <Box className="border-t border-gray-200 bg-white py-4">
        <HStack className="max-w-7xl mx-auto px-4 justify-between items-center text-sm text-gray-500">
          <Text>Open Scoreboard v3.0</Text>
          <HStack className="gap-4">
            <Link to="/settings" className="hover:text-gray-700 transition-colors">Settings</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">GitHub</a>
          </HStack>
        </HStack>
      </Box>
    </Box>
  )
}

// Missing icon imports - adding them
function TablesIcon({ size = 24, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  )
}

function HomeIcon({ size = 24, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function MenuIcon({ size = 24, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon({ size = 24, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface IconProps {
  size?: number
  className?: string
  color?: string
}
