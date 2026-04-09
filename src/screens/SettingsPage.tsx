// Settings Page
// Migrated from app/(tabs)/settings/index.tsx

import { Box, Text, VStack, Heading, Card, CardBody, Button, Spinner } from '@/components/ui'
import { logOut, useAuth } from '@/lib/auth'
import { isLocalDatabase } from '@/lib/firebase'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </Box>
    )
  }

  const handleSignOut = async () => {
    await logOut()
    navigate('/login')
  }

  return (
    <Box className="flex-1 bg-white">
      <VStack space="lg">
        <Heading size="lg">Settings</Heading>
        
        <Card variant="elevated" className="w-full">
          <CardBody>
            <VStack space="md">
              <Box>
                <Text className="text-sm font-medium mb-2">App Version</Text>
                <Text className="text-gray-500">OpenScoreboard v3.0.0</Text>
              </Box>
              
              <Box>
                <Text className="text-sm font-medium mb-2">Database</Text>
                <Text className="text-gray-500">
                  Using {isLocalDatabase ? "Local (AceBase)" : "Cloud (Firebase)"}
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        <Button 
          variant="outline" 
          action="negative" 
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </VStack>
    </Box>
  )
}
