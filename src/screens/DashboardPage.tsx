import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Spinner } from '@/components/ui'
import { ScoreboardIcon, PlayersIcon, TeamsIcon, TablesIcon, SettingsIcon, ChevronRightIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const sections = [
  {
    title: 'Scoring',
    items: [
      {
        route: '/tables',
        title: 'Tables',
        description: 'Create tables, assign matches, and run live scoring.',
        icon: TablesIcon,
      },
      {
        route: '/teammatches',
        title: 'Team Matches',
        description: 'Manage team match lineups and current table assignments.',
        icon: TeamsIcon,
      },
    ],
  },
  {
    title: 'Roster Management',
    items: [
      {
        route: '/players',
        title: 'Players',
        description: 'Manage player lists and imports.',
        icon: PlayersIcon,
      },
      {
        route: '/teams',
        title: 'Teams',
        description: 'Build teams and update team rosters.',
        icon: TeamsIcon,
      },
    ],
  },
  {
    title: 'Broadcast',
    items: [
      {
        route: '/scoreboards',
        title: 'Scoreboards',
        description: 'Create and manage overlays tied to your matches.',
        icon: ScoreboardIcon,
      },
      {
        route: '/editor',
        title: 'Scoreboard Editor',
        description: 'Design layouts in GrapesJS and publish updates live.',
        icon: SettingsIcon,
      },
      {
        route: '/dynamic-urls',
        title: 'Dynamic URLs',
        description: 'Create routing overlays that target tables, team matches, and scoreboard IDs.',
        icon: ScoreboardIcon,
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        route: '/my-scoreboards',
        title: 'My Scoreboards',
        description: 'Review your saved overlays and quick links.',
        icon: ScoreboardIcon,
      },
      {
        route: '/settings',
        title: 'Settings',
        description: 'Manage account and environment preferences.',
        icon: SettingsIcon,
      },
    ],
  },
]

interface DashboardItemProps {
  item: {
    route: string
    title: string
    description: string
    icon: React.ComponentType<{ size?: number; className?: string; color?: string }>
  }
}

function DashboardItem({ item }: DashboardItemProps) {
  const navigate = useNavigate()
  const Icon = item.icon

  return (
    <Pressable
      className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
      onPress={() => navigate(item.route)}
    >
      <HStack className="items-start justify-between gap-4">
        <HStack className="items-start gap-3 flex-1">
          <Box className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={22} className="text-blue-600" />
          </Box>
          <VStack className="gap-1 flex-1">
            <Text className="text-base font-semibold text-slate-900">{item.title}</Text>
            <Text className="text-sm leading-6 text-slate-600">{item.description}</Text>
          </VStack>
        </HStack>
        <ChevronRightIcon size={18} className="mt-1 text-slate-300 transition-colors group-hover:text-blue-500" />
      </HStack>
    </Pressable>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  return (
    <Box className="flex-1">
      <VStack space="lg">
        <Box className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-8 text-white shadow-2xl">
          <VStack className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Dashboard</Text>
            <Heading size="2xl" className="text-white">
              {user?.displayName ? `Welcome back, ${user.displayName}.` : 'Run your event from one control room.'}
            </Heading>
            <Text className="max-w-2xl text-sm leading-7 text-slate-200">
              Create tables, update scores, manage players and teams, and push scoreboard changes live without changing your existing data contract.
            </Text>
          </VStack>
        </Box>

        {sections.map((section) => (
          <Box key={section.title}>
            <Text className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.title}</Text>
            <VStack className="gap-3">
              {section.items.map((item) => (
                <DashboardItem key={item.route} item={item} />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
