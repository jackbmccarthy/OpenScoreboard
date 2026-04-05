import { Box, Button, Input, Modal, ModalBody, ModalFooter, ModalHeader, Text, VStack } from '@/components/ui'

interface FormDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  isSubmitDisabled?: boolean
  children: React.ReactNode
}

export function FormDialog({
  title,
  isOpen,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isSubmitDisabled = false,
  children,
}: FormDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        <VStack space="md">{children}</VStack>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          <Text>{cancelLabel}</Text>
        </Button>
        <Button action="primary" onClick={onSubmit} disabled={isSubmitting || isSubmitDisabled}>
          <Text className="text-white">{isSubmitting ? 'Saving...' : submitLabel}</Text>
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      {children}
    </Box>
  )
}

export function TextInputField({
  label,
  value,
  onChangeText,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <FormField label={label}>
      <Input type={type} value={value} onChangeText={onChangeText} placeholder={placeholder} />
    </FormField>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <FormField label={label}>
      <textarea
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </FormField>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <FormField label={label}>
      <select
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
