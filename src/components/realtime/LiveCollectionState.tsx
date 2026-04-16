import type { ReactNode } from 'react'

import { Box, Spinner, Text, VStack } from '@/components/ui'

export default function LiveCollectionState({
  icon,
  title,
  description,
  loadingLabel = 'Connecting to live updates…',
  loading = false,
}: {
  icon?: ReactNode
  title?: string
  description?: string
  loadingLabel?: string
  loading?: boolean
}) {
  return (
    <Box className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
      <VStack className="items-center gap-3">
        {loading ? <Spinner size="lg" /> : icon ? <Box className="text-slate-300">{icon}</Box> : null}
        <VStack className="gap-1">
          <Text className="font-semibold text-slate-900">{loading ? loadingLabel : (title || 'Nothing here yet')}</Text>
          {description ? <Text className="text-sm text-slate-500">{description}</Text> : null}
        </VStack>
      </VStack>
    </Box>
  )
}
