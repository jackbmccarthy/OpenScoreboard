import { Box, Text, VStack, HStack, Pressable, Heading, Spinner, Badge } from '@/components/ui'
import { ScoreboardIcon, PlayersIcon, TeamsIcon, TablesIcon, SettingsIcon, ChevronRightIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const sections = [
  {
    title: 'Scoring',
    items: [
      {
        route: '/tournaments',
        title: 'Tournaments',
        description: 'Create tournament shells, event schedules, and bracket entry points.',
        icon: TablesIcon,
      },
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
        route: '/my-scoreboards',
        title: 'My Scoreboards',
        description: 'Manage overlays, previews, templates, and editor entrypoints from one place.',
        icon: ScoreboardIcon,
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
      className="premium-card group min-h-[11rem] rounded-[1.75rem] border border-white/70 p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl"
      onPress={() => navigate(item.route)}
    >
      <HStack className="items-center justify-between gap-3">
        <HStack className="flex-1 items-start gap-3">
          <Box className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-400/10 text-blue-600">
            <Icon size={22} className="text-blue-600" />
          </Box>
          <VStack className="gap-1 flex-1 min-w-0">
            <Text className="text-base font-semibold text-slate-900 truncate">{item.title}</Text>
            <Text className="text-sm leading-relaxed text-slate-600 line-clamp-2">{item.description}</Text>
          </VStack>
        </HStack>
        <Box className="shrink-0">
          <ChevronRightIcon size={20} className="text-slate-300 transition-colors group-hover:text-blue-500" />
        </Box>
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
        <Box className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-8 text-white shadow-2xl shadow-slate-900/10 lg:px-8 lg:py-10">
          <Box className="premium-orb -right-10 top-6 h-40 w-40 bg-cyan-300/20" />
          <Box className="premium-orb bottom-0 left-1/3 h-52 w-52 bg-blue-400/20 premium-delay-2" />
          <VStack className="relative z-10 gap-6">
            <VStack className="gap-3">
              <Text className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Dashboard</Text>
              <Heading size="2xl" className="max-w-3xl text-white">
              {user?.displayName ? `Welcome back, ${user.displayName}.` : 'Run your event from one control room.'}
              </Heading>
              <Text className="max-w-2xl text-sm leading-7 text-slate-200">
                Create tables, update scores, manage players and teams, and push scoreboard changes live without changing your existing data contract.
              </Text>
            </VStack>

            <HStack className="flex-wrap gap-3">
              <Badge className="rounded-full bg-white/10 px-3 py-1.5 text-blue-100">High-contrast scoring UI</Badge>
              <Badge className="rounded-full bg-white/10 px-3 py-1.5 text-blue-100">Realtime overlay control</Badge>
              <Badge className="rounded-full bg-white/10 px-3 py-1.5 text-blue-100">Fast operator workflows</Badge>
            </HStack>
          </VStack>
        </Box>

        {sections.map((section) => (
          <Box key={section.title}>
            <Text className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.title}</Text>
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {section.items.map((item) => (
                <DashboardItem key={item.route} item={item} />
              ))}
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  )
}
