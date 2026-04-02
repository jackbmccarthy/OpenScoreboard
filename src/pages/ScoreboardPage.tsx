// Scoreboard Page - lists available scoreboard overlays
// Migrated from app/scoreboard/page.tsx

import { Box, Text, VStack, HStack, Button, Heading, Card, CardBody, Pressable } from '@/components/ui'
import { ScoreboardIcon, ExternalLinkIcon } from '@/components/icons'
import { useNavigate } from 'react-router-dom'

interface ScoreboardItemProps {
  name: string
  description: string
  port: number
}

function ScoreboardItem({ name, description, port }: ScoreboardItemProps) {
  return (
    <Pressable className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <HStack className="justify-between items-center">
        <VStack className="flex-1">
          <Text fontWeight="medium">{name}</Text>
          <Text className="text-xs text-gray-500">{description}</Text>
        </VStack>
        <HStack space="xs">
          <Button size="xs" variant="ghost" onClick={() => window.open(`http://localhost:${port}`, '_blank')}>
            <Text>Dev</Text>
          </Button>
          <Button size="xs" variant="ghost" onClick={() => window.open(`/scoreboard/dist/index.html`, '_blank')}>
            <ExternalLinkIcon size={14} />
          </Button>
        </HStack>
      </HStack>
    </Pressable>
  )
}

export default function ScoreboardPage() {
  const navigate = useNavigate()

  return (
    <Box className="flex-1 bg-white">
      <VStack space="lg" className="p-4">
        <Heading size="lg">Scoreboard Overlay</Heading>
        
        <Card variant="elevated">
          <CardBody>
            <VStack space="md">
              <HStack className="items-center space-x-3">
                <ScoreboardIcon size={32} className="text-blue-600" />
                <VStack className="flex-1">
                  <Text fontWeight="bold" fontSize="lg">Live Scoreboard Overlay</Text>
                  <Text className="text-gray-500 text-sm">
                    Display scores on stream or in front of cameras
                  </Text>
                </VStack>
              </HStack>
              
              <Box className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Text className="text-sm text-gray-600 mb-2">
                  <Text fontWeight="bold">Standalone App:</Text> This is a separate Vite-based vanilla JS app.
                </Text>
                <Text className="text-sm text-gray-600 mb-4">
                  It connects to the same AceBase database for real-time score updates.
                </Text>
                
                <VStack space="sm">
                  <Text className="text-sm font-medium">Quick Links:</Text>
                  <HStack space="sm">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('/scoreboard/dist/index.html', '_blank')}
                    >
                      <Text>Open Built Version</Text>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('http://localhost:3002', '_blank')}
                    >
                      <Text>Dev Server (port 3002)</Text>
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        <Card variant="outline">
          <CardBody>
            <VStack space="md">
              <Text fontWeight="bold">Available Scoreboards</Text>
              <VStack space="sm">
                <ScoreboardItem 
                  name="Standard Scoreboard" 
                  description="Basic scoreboard for any sport"
                  port={3002}
                />
                <ScoreboardItem 
                  name="Table Tennis" 
                  description="Scoreboard with game tracking"
                  port={3003}
                />
                <ScoreboardItem 
                  name="Pickleball" 
                  description="Pickleball-specific scoring"
                  port={3004}
                />
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Button 
          variant="solid" 
          action="primary"
          onClick={() => navigate('/')}
        >
          <Text className="text-white">← Back to Home</Text>
        </Button>
      </VStack>
    </Box>
  )
}
