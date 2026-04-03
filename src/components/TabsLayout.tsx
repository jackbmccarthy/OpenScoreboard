// Tabs Layout component for OpenScoreboard
// Provides tab navigation across the main app
// Adapted for Vite with react-router-dom

import { Box, HStack, VStack, Text, Button } from './ui'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, logOut } from '@/lib/auth'
import { useState } from 'react'

interface TabItem {
  name: string
  label: string
  path: string
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', path: '/' },
  { name: 'players', label: 'Players', path: '/players' },
  { name: 'teams', label: 'Teams', path: '/teams' },
  { name: 'settings', label: 'Settings', path: '/settings' },
]

export default function TabsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

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
      <Box className="flex flex-col min-h-screen bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </Box>
    )
  }

  return (
    <Box className="flex flex-col min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <Box className="border-b border-gray-200 bg-white">
        <HStack className="justify-between items-center px-4 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Box className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-sm">OS</Text>
            </Box>
            <Text className="font-semibold text-gray-900 hidden sm:block">Open Scoreboard</Text>
          </Link>

          {/* Desktop Tabs */}
          <HStack className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Link 
                key={tab.name} 
                to={tab.path}
                className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
                  getCurrentTab() === tab.name
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </HStack>

          {/* User Section */}
          <HStack className="items-center gap-2">
            {user ? (
              <Box className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2"
                >
                  <Box className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <Text className="text-gray-600 text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    )}
                  </Box>
                  <Text className="text-gray-700 text-sm hidden sm:block max-w-[150px] truncate">
                    {user.displayName || user.email}
                  </Text>
                </Button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <Box className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/my-account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      My Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </Box>
                )}
              </Box>
            ) : (
              <Link to="/login">
                <Button variant="solid" action="primary" className="bg-blue-600 hover:bg-blue-700">
                  <Text className="text-white text-sm font-medium">Sign In</Text>
                </Button>
              </Link>
            )}
          </HStack>
        </HStack>

        {/* Mobile Tabs - Horizontal scroll */}
        <HStack className="md:hidden overflow-x-auto px-2 pb-2 gap-1">
          {tabs.map((tab) => (
            <Link 
              key={tab.name} 
              to={tab.path}
              className={`px-3 py-2 font-medium text-sm rounded-md whitespace-nowrap transition-colors ${
                getCurrentTab() === tab.name
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </HStack>
      </Box>
      
      {/* Page Content */}
      <Box className="flex-1 p-4">
        <Outlet />
      </Box>
    </Box>
  )
}
