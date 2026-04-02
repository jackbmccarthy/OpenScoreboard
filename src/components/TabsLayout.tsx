// Tabs Layout component for OpenScoreboard
// Provides tab navigation across the main app
// Adapted for Vite with react-router-dom

import { Box, HStack } from './ui'
import { Link, useLocation, Outlet } from 'react-router-dom'

interface TabItem {
  name: string
  label: string
  path: string
}

const tabs: TabItem[] = [
  { name: 'index', label: 'Home', path: '/' },
  { name: 'players', label: 'Players', path: '/players' },
  { name: 'teams', label: 'Teams', path: '/teams' },
  { name: 'scoreboard', label: 'Scoreboard', path: '/scoreboard' },
  { name: 'editor', label: 'Editor', path: '/editor' },
  { name: 'settings', label: 'Settings', path: '/settings' },
]

export default function TabsLayout() {
  const location = useLocation()

  const getCurrentTab = () => {
    const found = tabs.find(t => location.pathname === t.path || (t.path !== '/' && location.pathname.startsWith(t.path)))
    return found?.name || 'index'
  }

  return (
    <Box className="flex flex-col min-h-screen bg-white">
      {/* Tab Navigation */}
      <Box className="border-b border-gray-200">
        <HStack className="overflow-x-auto">
          {tabs.map((tab) => (
            <Link 
              key={tab.name} 
              to={tab.path}
              className={`px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                getCurrentTab() === tab.name
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
