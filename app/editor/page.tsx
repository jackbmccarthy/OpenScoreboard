'use client'

import { Box, Text, VStack, HStack, Button, Heading, Card, CardBody } from '@/components/ui'
import { SettingsIcon, ExternalLinkIcon } from '@/components/icons'
import { useRouter } from 'next/navigation'

// GrapesJS Editor page
// This is a standalone Vite app - provides links to open it

export default function EditorPage() {
  const router = useRouter()

  return (
    <Box className="flex-1 bg-white">
      <VStack space="lg" className="p-4">
        <Heading size="lg">Scoreboard Editor</Heading>
        
        <Card variant="elevated">
          <CardBody>
            <VStack space="md">
              <HStack className="items-center space-x-3">
                <SettingsIcon size={32} className="text-blue-600" />
                <VStack className="flex-1">
                  <Text fontWeight="bold" fontSize="lg">GrapesJS Visual Editor</Text>
                  <Text className="text-gray-500 text-sm">
                    Create custom scoreboard layouts with drag-and-drop
                  </Text>
                </VStack>
              </HStack>
              
              <Box className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Text className="text-sm text-gray-600 mb-2">
                  <Text fontWeight="bold">Standalone App:</Text> This is a separate Vite-based GrapesJS editor.
                </Text>
                <Text className="text-sm text-gray-600 mb-4">
                  Use it to design custom scoreboard overlays, then export for use with the scoreboard app.
                </Text>
                
                <VStack space="sm">
                  <Text className="text-sm font-medium">Quick Links:</Text>
                  <HStack space="sm">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onPress={() => window.open('/editor/dist/index.html', '_blank')}
                    >
                      <Text>Open Built Version</Text>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onPress={() => window.open('http://localhost:3005', '_blank')}
                    >
                      <Text>Dev Server (port 3005)</Text>
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
              <Text fontWeight="bold">Editor Features</Text>
              <VStack space="sm">
                <FeatureItem text="Drag-and-drop scoreboard components" />
                <FeatureItem text="Custom fonts, colors, and backgrounds" />
                <FeatureItem text="Export to HTML/CSS/JS" />
                <FeatureItem text="Live preview mode" />
                <FeatureItem text="Template library" />
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Button 
          variant="solid" 
          action="primary"
          onPress={() => router.push('/')}
        >
          <Text className="text-white">← Back to Home</Text>
        </Button>
      </VStack>
    </Box>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <HStack className="items-center space-x-2">
      <Box className="w-2 h-2 bg-blue-500 rounded-full" />
      <Text className="text-sm text-gray-700">{text}</Text>
    </HStack>
  )
}
