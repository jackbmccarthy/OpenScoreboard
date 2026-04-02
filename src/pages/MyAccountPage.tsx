// My Account Page
// Migrated from app/my-account/page.tsx

import { Box, Heading, Text, VStack, Button, Input, Card, CardBody } from '@/components/ui'
import { logOut } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

export default function MyAccountPage() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logOut()
    navigate('/login')
  }

  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">My Account</Heading>
        
        <Card variant="elevated" className="w-full">
          <CardBody>
            <VStack space="md">
              <Box>
                <Text className="text-sm font-medium mb-2">Display Name</Text>
                <Input placeholder="Enter display name" />
              </Box>
              
              <Box>
                <Text className="text-sm font-medium mb-2">Email</Text>
                <Input type="email" placeholder="Enter email" />
              </Box>
              
              <Box>
                <Text className="text-sm font-medium mb-2">Organization</Text>
                <Input placeholder="Enter organization name" />
              </Box>
            </VStack>
          </CardBody>
        </Card>
        
        <Box className="mt-4">
          <Button variant="solid" action="primary" className="w-full">
            Save Changes
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="secondary" className="w-full">
            Change Password
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="negative" className="w-full" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
