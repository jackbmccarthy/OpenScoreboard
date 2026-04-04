import { Box, Text, VStack, HStack, Button, Heading } from '@/components/ui'
import { ArrowRightIcon, PlayersIcon, ScoreboardIcon, TablesIcon, TeamsIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const featureCards = [
  {
    title: 'Live scoring that stays in sync',
    description: 'Run matches, tables, and team scoring while overlays update in realtime through the same data paths your existing clients already use.',
    icon: TablesIcon,
  },
  {
    title: 'Broadcast-ready overlays',
    description: 'Design, save, and publish scoreboard graphics with the built-in editor and overlay runtime.',
    icon: ScoreboardIcon,
  },
  {
    title: 'Players and teams in one place',
    description: 'Keep your rosters, player lists, and event operations connected from registration through live scoring.',
    icon: PlayersIcon,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,#eff6ff_0%,#ffffff_34%,#f8fafc_100%)]">
      <Box className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <HStack className="items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <HStack className="items-center gap-3">
            <Box className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
              <ScoreboardIcon size={22} color="white" />
            </Box>
            <VStack className="gap-0">
              <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Open Scoreboard</Text>
              <Text className="text-xs text-slate-500">Live scoring and overlays for modern events</Text>
            </VStack>
          </HStack>

          <HStack className="items-center gap-2">
            <Button variant="outline" onClick={() => navigate(user ? '/dashboard' : '/login')}>
              <Text>{user ? 'Open Dashboard' : 'Sign In'}</Text>
            </Button>
            <Button action="primary" onClick={() => navigate(user ? '/dashboard' : '/login')}>
              <Text className="text-white">{user ? 'Manage Event' : 'Start Free'}</Text>
            </Button>
          </HStack>
        </HStack>

        <Box className="flex flex-1 items-center py-12 sm:py-16">
          <VStack className="w-full gap-10">
            <VStack className="max-w-3xl gap-5">
              <Text className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Tournament operations without the spreadsheet chaos</Text>
              <Heading size="4xl" className="text-5xl font-black leading-[1.02] text-slate-950 sm:text-6xl">
                Score matches, manage teams, and push overlays live from one control room.
              </Heading>
              <Text className="max-w-2xl text-lg leading-8 text-slate-600">
                OpenScoreboard gives clubs and tournament desks one place to run tables, team matches, player lists, and stream graphics while keeping realtime scoreboard updates flowing to every connected client.
              </Text>
              <HStack className="flex-wrap items-center gap-3">
                <Button action="primary" onClick={() => navigate(user ? '/dashboard' : '/login')}>
                  <HStack className="items-center gap-2">
                    <Text className="text-white">{user ? 'Go To Dashboard' : 'Sign In To Continue'}</Text>
                    <ArrowRightIcon size={16} color="white" />
                  </HStack>
                </Button>
                <Button variant="outline" onClick={() => navigate('/scoreboard')}>
                  <Text>See Overlay Tools</Text>
                </Button>
              </HStack>
            </VStack>

            <Box className="grid gap-4 md:grid-cols-3">
              {featureCards.map((card) => {
                const Icon = card.icon

                return (
                  <Box key={card.title} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg shadow-slate-200/70 backdrop-blur">
                    <Box className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon size={24} className="text-blue-600" />
                    </Box>
                    <Text className="mb-2 text-lg font-semibold text-slate-900">{card.title}</Text>
                    <Text className="text-sm leading-7 text-slate-600">{card.description}</Text>
                  </Box>
                )
              })}
            </Box>

            <Box className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-7 text-white shadow-2xl shadow-slate-900/10">
              <HStack className="flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <VStack className="gap-2">
                  <Text className="text-xl font-semibold">Designed for tournament desks, club operators, and stream producers.</Text>
                  <Text className="max-w-3xl text-sm leading-7 text-slate-300">
                    Run local events, regional tournaments, and livestream overlays with the same scoreboard objects and live update pipeline your existing event tooling already expects.
                  </Text>
                </VStack>
                <HStack className="gap-3">
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    <Text>Login</Text>
                  </Button>
                  <Button action="primary" onClick={() => navigate(user ? '/dashboard' : '/login')}>
                    <Text className="text-white">{user ? 'Open Dashboard' : 'Launch Console'}</Text>
                  </Button>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  )
}
