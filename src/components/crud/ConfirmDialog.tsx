import { Button, Text } from '@/components/ui'
import OverlayDialog from './OverlayDialog'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
}: ConfirmDialogProps) {
  return (
    <OverlayDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>
            <Text>Cancel</Text>
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'solid'} onClick={onConfirm}>
            <Text className="text-white">{confirmLabel}</Text>
          </Button>
        </>
      )}
    >
      <Text className="text-sm leading-6 text-slate-600">{message}</Text>
    </OverlayDialog>
  )
}

export default ConfirmDialog
