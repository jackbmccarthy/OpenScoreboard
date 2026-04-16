import { HStack, Spinner, Text, VStack } from '@/components/ui'
import { getDeleteImpactItems, getDeleteRetentionText } from '@/ownership/deleteReporting.js'

type OwnershipDeleteImpactProps = {
  report: Record<string, any> | null
  loading?: boolean
  error?: string
}

export function OwnershipDeleteImpact({
  report,
  loading = false,
  error = '',
}: OwnershipDeleteImpactProps) {
  if (loading) {
    return (
      <HStack className="mt-4 items-center gap-2">
        <Spinner size="sm" />
        <Text className="text-sm text-slate-500">Running dry-run impact scan...</Text>
      </HStack>
    )
  }

  if (error) {
    return (
      <Text className="mt-4 text-sm leading-6 text-red-600">
        Dry-run impact scan failed: {error}
      </Text>
    )
  }

  if (!report) {
    return null
  }

  const impactItems = getDeleteImpactItems(report)
  const retentionText = getDeleteRetentionText(String(report.entityType || ''))

  return (
    <VStack className="mt-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <Text className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dry-Run Preview</Text>
      {impactItems.map((item) => (
        <Text key={item} className="text-sm leading-6 text-slate-600">
          • {item}
        </Text>
      ))}
      {retentionText ? (
        <Text className="pt-1 text-xs leading-5 text-slate-500">{retentionText}</Text>
      ) : null}
    </VStack>
  )
}

export default OwnershipDeleteImpact
