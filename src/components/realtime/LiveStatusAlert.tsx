import { Alert, Text } from '@/components/ui'
import { getLiveSyncMessage, type LiveSyncStatus } from '@/lib/liveSync'

function getVariant(status: LiveSyncStatus) {
  if (status === 'error' || status === 'unauthorized') {
    return 'danger'
  }
  if (status === 'stale' || status === 'offline' || status === 'conflict') {
    return 'warning'
  }
  return 'info'
}

export default function LiveStatusAlert({
  status,
  error = '',
  className = '',
}: {
  status: LiveSyncStatus
  error?: string
  className?: string
}) {
  const message = getLiveSyncMessage(status, error)
  if (!message || status === 'idle' || status === 'live') {
    return null
  }

  return (
    <Alert variant={getVariant(status)} className={className}>
      <Text className="text-sm">{message}</Text>
    </Alert>
  )
}
