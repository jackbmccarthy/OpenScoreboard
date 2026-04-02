// QR Code Page
// Migrated from app/qrcode/page.tsx

import { Box, Heading, Text, VStack } from '@/components/ui'

export default function QRCodePage() {
  return (
    <Box className="flex-1 bg-white p-4">
      <VStack space="lg">
        <Heading size="lg">QR Code</Heading>
        <Text className="text-gray-600">Generate QR codes for scoreboards</Text>
      </VStack>
    </Box>
  )
}
