'use client'

import { Box, Text, HStack } from '@/components/ui'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

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

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const getCurrentTab = () => {
    const found = tabs.find(t => pathname === t.path || pathname.startsWith(t.path + '/'))
    return found?.name || 'index'
  }

  return (
    <Box className="flex flex-col min-h-screen bg-white">
      {/* Tab Navigation */}
      <Box className="border-b border-gray-200">
        <HStack className="justify-between">
          {tabs.map((tab) => (
            <Link 
              key={tab.name} 
              href={tab.path}
              className={`px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors ${
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
        {children}
      </Box>
    </Box>
  )
}
