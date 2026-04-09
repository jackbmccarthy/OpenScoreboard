// QR Code Page
// Displays QR code for table scoring URL

import { useParams } from 'react-router-dom'
import { Box, Text, VStack } from '@/components/ui'

export default function QRCodePage() {
  const params = useParams<{ tableName?: string; url?: string }>()

  // For now, display the URL - QR code generation would require a library
  return (
    <Box className="p-4">
      <VStack space="lg" className="items-center">
        <Text className="text-3xl font-bold text-center">{params.tableName || 'Table'} - Scoring URL</Text>
        
        <Box className="bg-white rounded-lg p-8 shadow-lg">
          <VStack space="md" className="items-center">
            <Text className="text-gray-600 text-center">
              Scan this URL to keep score for this table
            </Text>
            <Text className="font-mono text-sm bg-gray-100 p-4 rounded break-all">
              {params.url || window.location.origin}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}
