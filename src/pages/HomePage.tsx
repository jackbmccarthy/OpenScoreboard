// Home Page for OpenScoreboard
// Migrated from app/(tabs)/index.tsx

import { useEffect } from 'react'
import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Spinner } from '@/components/ui'
import { ScoreboardIcon, PlayersIcon, TeamsIcon, TablesIcon, SettingsIcon, ExternalLinkIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const scoringScreens = [
  {
    route: "tables",
    title: "Tables",
    description: "Manage your scoring tables",
    icon: TablesIcon,
  },
  {
    route: "team-matches",
    title: "Team Matches",
    description: "Manage team matches",
    icon: ScoreboardIcon,
  },
]

const importables = [
  {
    route: "players",
    title: "Players",
    description: "Manage your players and player lists",
    icon: PlayersIcon,
  },
  {
    route: "teams",
    title: "Teams",
    description: "Manage your teams",
    icon: TeamsIcon,
  },
]

const scoreboards = [
  {
    route: "scoreboard",
    title: "Scoreboard Overlays",
    description: "View live scoreboard overlays",
    icon: ScoreboardIcon,
  },
  {
    route: "editor",
    title: "Scoreboard Editor",
    description: "Design custom scoreboard layouts",
    icon: SettingsIcon,
  },
  {
    route: "dynamic-urls",
    title: "Dynamic URLs",
    description: "Generate dynamic scoreboard URLs",
    icon: ExternalLinkIcon,
  },
]

const account = [
  {
    route: "settings",
    title: "Account Settings",
    description: "Manage your account",
    icon: SettingsIcon,
  },
]

interface HomeItemProps {
  item: {
    route: string
    title: string
    description: string
    icon: React.ComponentType<{ size?: number; className?: string }>
  }
}

function HomeItem({ item }: HomeItemProps) {
  const navigate = useNavigate()
  const Icon = item.icon

  return (
    <Pressable
      className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
      onPress={() => navigate(`/${item.route}`)}
    >
      <HStack className="flex-1 items-center space-x-3">
        {Icon && <Icon size={24} className="text-gray-400" />}
        <Box className="flex-1">
          <Text className="text-base font-medium">{item.title}</Text>
          <Text className="text-xs text-gray-500">{item.description}</Text>
        </Box>
      </HStack>
    </Pressable>
  )
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="lg">
        {/* Scoring Section */}
        <Box>
          <Text className="text-xl font-bold text-center underline mb-2">Scoring</Text>
          <Card variant="elevated" className="overflow-hidden">
            <CardBody className="p-0">
              <VStack space="0">
                {scoringScreens.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Importable Section */}
        <Box>
          <Text className="text-xl font-bold text-center underline mb-2">Importable Players & Teams</Text>
          <Card variant="elevated" className="overflow-hidden">
            <CardBody className="p-0">
              <VStack space="0">
                {importables.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Scoreboards Section */}
        <Box>
          <Text className="text-xl font-bold text-center underline mb-2">Scoreboards & Overlays</Text>
          <Card variant="elevated" className="overflow-hidden">
            <CardBody className="p-0">
              <VStack space="0">
                {scoreboards.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Account Section */}
        <Box>
          <Text className="text-xl font-bold text-center underline mb-2">Account</Text>
          <Card variant="elevated" className="overflow-hidden">
            <CardBody className="p-0">
              <VStack space="0">
                {account.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </VStack>
    </Box>
  )
}
