import type { ReactNode } from 'react'
import { Text } from '@/components/ui'

type LabeledFieldProps = {
  label: string
  children: ReactNode
  className?: string
  labelClassName?: string
  hint?: string
}

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function FieldLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Text as="span" className={joinClasses('text-xs font-semibold uppercase tracking-[0.16em] text-slate-500', className)}>
      {children}
    </Text>
  )
}

export default function LabeledField({
  label,
  children,
  className,
  labelClassName,
  hint,
}: LabeledFieldProps) {
  return (
    <label className={joinClasses('flex flex-col gap-2', className)}>
      <FieldLabel className={labelClassName}>{label}</FieldLabel>
      {children}
      {hint ? <Text className="text-xs text-slate-500">{hint}</Text> : null}
    </label>
  )
}
