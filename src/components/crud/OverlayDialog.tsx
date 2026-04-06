import type React from 'react'
import { Modal, ModalBody, ModalCloseButton, ModalFooter, ModalHeader, Text, VStack } from '@/components/ui'

interface OverlayDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function OverlayDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: OverlayDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl`}>
      <ModalCloseButton
        className="right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-800"
        onClick={onClose}
        aria-label="Close dialog"
      >
        ×
      </ModalCloseButton>
      <ModalHeader className="mb-1">{title}</ModalHeader>
      <ModalBody className="mb-0">
        <VStack className="gap-4">
          {description ? <Text className="text-sm leading-6 text-slate-500">{description}</Text> : null}
          {children}
        </VStack>
      </ModalBody>
      {footer ? <ModalFooter className="mt-6">{footer}</ModalFooter> : null}
    </Modal>
  )
}
