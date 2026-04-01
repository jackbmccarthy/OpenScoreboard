'use client'

import { Box, Text, VStack, HStack, Card, CardBody, Pressable, Heading, Button } from '@/components/ui'
import { SettingsIcon } from '@/components/icons'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="md">
        <Heading size="lg">Settings</Heading>

        {/* Account Section */}
        <Card variant="elevated">
          <CardBody>
            <VStack space="md">
              <Text fontWeight="bold" fontSize="lg">Account</Text>
              
              {status === 'loading' ? (
                <Text className="text-gray-500">Loading...</Text>
              ) : session ? (
                <VStack space="sm">
                  <HStack>
                    <Text className="text-gray-500 w-24">Name:</Text>
                    <Text>{session.user?.name || 'N/A'}</Text>
                  </HStack>
                  <HStack>
                    <Text className="text-gray-500 w-24">Email:</Text>
                    <Text>{session.user?.email || 'N/A'}</Text>
                  </HStack>
                  <Button 
                    size="sm" 
                    variant="solid" 
                    action="negative"
                    className="mt-2"
                    onPress={handleSignOut}
                  >
                    <Text className="text-white">Sign Out</Text>
                  </Button>
                </VStack>
              ) : (
                <VStack space="sm">
                  <Text className="text-gray-500">Not signed in</Text>
                  <Button 
                    size="sm" 
                    variant="solid" 
                    action="primary"
                    onPress={() => router.push('/login')}
                  >
                    <Text className="text-white">Sign In</Text>
                  </Button>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* App Info */}
        <Card variant="elevated">
          <CardBody>
            <VStack space="md">
              <Text fontWeight="bold" fontSize="lg">About</Text>
              <VStack space="sm">
                <HStack>
                  <Text className="text-gray-500 w-24">App:</Text>
                  <Text>Open Scoreboard</Text>
                </HStack>
                <HStack>
                  <Text className="text-gray-500 w-24">Version:</Text>
                  <Text>3.0.0 (Next.js)</Text>
                </HStack>
                <HStack>
                  <Text className="text-gray-500 w-24">UI:</Text>
                  <Text>GlueStack UI v3</Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Database Info */}
        <Card variant="elevated">
          <CardBody>
            <VStack space="md">
              <Text fontWeight="bold" fontSize="lg">Database</Text>
              <VStack space="sm">
                <HStack>
                  <Text className="text-gray-500 w-24">Mode:</Text>
                  <Text>Firebase / AceBase</Text>
                </HStack>
                <HStack>
                  <Text className="text-gray-500 w-24">Path:</Text>
                  <Text className="text-sm">/{session?.user ? 'user' : 'public'}</Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
