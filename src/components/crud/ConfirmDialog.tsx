import { Button, Text } from '@/components/ui'
import type { ReactNode } from 'react'
import OverlayDialog from './OverlayDialog'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  description?: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  confirmDisabled?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  confirmDisabled = false,
  children,
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
          <Button variant={tone === 'danger' ? 'danger' : 'solid'} onClick={onConfirm} disabled={confirmDisabled}>
            <Text className="text-white">{confirmLabel}</Text>
          </Button>
        </>
      )}
    >
      <Text className="text-sm leading-6 text-slate-600">{message}</Text>
      {description && (
        <Text className="text-sm leading-6 text-slate-500 mt-2">{description}</Text>
      )}
      {children}
    </OverlayDialog>
  )
}

export default ConfirmDialog
