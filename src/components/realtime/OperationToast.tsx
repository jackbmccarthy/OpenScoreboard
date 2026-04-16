import { Alert, Text } from '@/components/ui'

export type OperationToastTone = 'info' | 'success' | 'warning' | 'danger'

export default function OperationToast({
  tone,
  message,
}: {
  tone: OperationToastTone
  message: string
}) {
  if (!message) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert variant={tone} className="shadow-lg">
        <Text className="text-sm">{message}</Text>
      </Alert>
    </div>
  )
}
