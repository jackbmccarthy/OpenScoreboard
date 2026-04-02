'use client'

import { Box, Heading, Text, VStack, Button, Card, CardBody, Input } from '@/components/ui'

export default function QRCodePage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg" className="items-center">
        <Heading size="lg">QR Code</Heading>
        <Text className="text-gray-600 text-center">Generate a QR code for player registration</Text>
        
        <Card variant="elevated" className="w-full max-w-sm mt-4">
          <CardBody className="items-center">
            <Box className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
              <Text className="text-gray-500 text-sm text-center">QR Code Placeholder</Text>
            </Box>
          </CardBody>
        </Card>
        
        <Box className="w-full max-w-sm mt-4">
          <Text className="text-sm font-medium mb-2">URL or Event ID</Text>
          <Input placeholder="Enter URL or event ID" />
        </Box>
        
        <Box className="mt-6">
          <Button variant="solid" action="primary">
            Generate QR Code
          </Button>
        </Box>
        
        <Box className="mt-4">
          <Button variant="outline" action="secondary">
            Share QR Code
          </Button>
        </Box>
      </VStack>
    </Box>
  )
}
