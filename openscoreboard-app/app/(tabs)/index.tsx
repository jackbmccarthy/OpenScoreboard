'use client'

import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading } from '@/components/ui'
import { useSession, signIn, signOut } from 'next-auth/react'
import { ScoreboardIcon, PlayersIcon, TeamsIcon, TablesIcon } from '@/components/icons'

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
    route: "scoreboards",
    title: "Scoreboards",
    description: "View and manage scoreboards",
    icon: ScoreboardIcon,
  },
  {
    route: "dynamic-urls",
    title: "Dynamic URLs",
    description: "Generate dynamic scoreboard URLs",
    icon: ScoreboardIcon,
  },
]

const account = [
  {
    route: "settings",
    title: "Account Settings",
    description: "Manage your account",
    icon: ScoreboardIcon,
  },
]

function HomeItem({ item }: { item: any }) {
  const router = useRouter()
  const Icon = item.icon

  return (
    <Pressable
      className="flex-row items-center justify-between p-4 border-b border-gray-200 active:bg-gray-100"
      onPress={() => router.push(`/${item.route}`)}
    >
      <Box className="flex-1">
        <Text className="text-lg font-bold">{item.title}</Text>
        <Text className="text-xs text-gray-500">{item.description}</Text>
      </Box>
      {Icon && <Icon size={24} className="text-gray-400" />}
    </Pressable>
  )
}

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md">
        {/* Scoring Section */}
        <Box>
          <Text className="text-2xl font-bold text-center underline">Scoring</Text>
          <Card variant="elevated" className="mt-2">
            <CardBody>
              <VStack space="sm">
                {scoringScreens.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Importable Section */}
        <Box>
          <Text className="text-2xl font-bold text-center underline">Importable Players & Teams</Text>
          <Card variant="elevated" className="mt-2">
            <CardBody>
              <VStack space="sm">
                {importables.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Scoreboards Section */}
        <Box>
          <Text className="text-2xl font-bold text-center underline">Scoreboards & Overlays</Text>
          <Card variant="elevated" className="mt-2">
            <CardBody>
              <VStack space="sm">
                {scoreboards.map((item) => (
                  <HomeItem key={item.route} item={item} />
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Box>

        {/* Account Section */}
        <Box>
          <Text className="text-2xl font-bold text-center underline">Account</Text>
          <Card variant="elevated" className="mt-2">
            <CardBody>
              <VStack space="sm">
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
