import React from 'react'

type AnyProps = Record<string, any>

type StackProps = React.HTMLAttributes<HTMLDivElement> & AnyProps & {
  children?: React.ReactNode
  space?: string
}

type BoxProps = React.HTMLAttributes<HTMLDivElement> & AnyProps & {
  children?: React.ReactNode
}

type SpinnerProps = AnyProps & {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

type ModalProps = React.HTMLAttributes<HTMLDivElement> & AnyProps & {
  children?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  AnyProps & {
    onChangeText?: React.Dispatch<React.SetStateAction<any>> | ((value: any) => void)
    className?: string
  }

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  AnyProps & {
    children?: React.ReactNode
    onValueChange?: (value: string) => void
    className?: string
  }

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  AnyProps & {
    children?: React.ReactNode
    variant?: string
    size?: string
    onPress?: () => void
    onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void)
    className?: string
  }

type PressableProps = React.HTMLAttributes<HTMLDivElement> &
  AnyProps & {
    children?: React.ReactNode
    onPress?: () => void
    onClick?: React.MouseEventHandler<HTMLDivElement> | (() => void)
  }

type TextProps = React.HTMLAttributes<HTMLElement> &
  AnyProps & {
    children?: React.ReactNode
    as?: React.ElementType
  }

type HeadingProps = React.HTMLAttributes<HTMLElement> &
  AnyProps & {
    children?: React.ReactNode
    level?: 1 | 2 | 3 | 4 | 5 | 6
    as?: React.ElementType
  }

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  AnyProps & {
    children?: React.ReactNode
    variant?: string
  }

type AvatarProps = React.ImgHTMLAttributes<HTMLImageElement> &
  AnyProps & {
    src?: string
    alt?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
  }

type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  AnyProps & {
    children?: React.ReactNode
    variant?: string
  }

function mergeClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function resolveHandler<T extends (...args: any[]) => any>(
  primary?: T,
  secondary?: T,
) {
  return (...args: Parameters<T>) => {
    primary?.(...args)
    secondary?.(...args)
  }
}

export function VStack({ children, space, className, ...props }: StackProps) {
  const spaceClass = space ? `space-y-${space}` : ''
  return (
    <div className={mergeClasses('flex flex-col', spaceClass, className)} {...props}>
      {children}
    </div>
  )
}

export function HStack({ children, space, className, ...props }: StackProps) {
  const spaceClass = space ? `space-x-${space}` : ''
  return (
    <div className={mergeClasses('flex flex-row', spaceClass, className)} {...props}>
      {children}
    </div>
  )
}

export function Box({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function Spinner({ size = 'md', className = '', children, ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div
      className={mergeClasses(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function Modal({ children, isOpen, onClose, className = '', ...props }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      {...props}
    >
      <div
        className={mergeClasses('premium-panel w-full max-w-md rounded-[1.75rem] border border-white/70 p-6 shadow-2xl', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalBackdrop({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('fixed inset-0 z-50 bg-black/50', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalContent({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalCloseButton({
  children,
  className = '',
  onClick,
  onPress,
  ...props
}: AnyProps & { children?: React.ReactNode; className?: string; onClick?: () => void; onPress?: () => void }) {
  return (
    <button
      type="button"
      className={mergeClasses('absolute top-3 right-3 text-gray-500 hover:text-gray-700', className)}
      onClick={onClick ?? onPress}
      {...props}
    >
      {children ?? '×'}
    </button>
  )
}

export function ModalHeader({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('text-xl font-bold mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalBody({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('flex justify-end gap-2', className)} {...props}>
      {children}
    </div>
  )
}

export function Input({
  className = '',
  onChangeText,
  onChange,
  ...props
}: InputProps) {
  const handleChange = resolveHandler(onChange, (event: React.ChangeEvent<HTMLInputElement>) => {
    onChangeText?.(event.target.value)
  })

  return (
    <input
      className={mergeClasses(
        'w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3 text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100',
        className,
      )}
      onChange={handleChange}
      {...props}
    />
  )
}

export function Select({
  children,
  className = '',
  value,
  onValueChange,
  onChange,
  ...props
}: SelectProps) {
  const handleChange = resolveHandler(onChange, (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(event.target.value)
  })

  return (
    <select
      className={mergeClasses(
        'w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3 text-slate-900 shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100',
        className,
      )}
      value={value}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('w-full px-3 py-2 border border-gray-300 rounded-md bg-white', className)} {...props}>
      {children}
    </div>
  )
}

export function SelectContent({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg', className)} {...props}>
      {children}
    </div>
  )
}

export function SelectItem({ children, onSelect, className = '', ...props }: BoxProps & { value?: string; onSelect?: () => void }) {
  return (
    <div
      className={mergeClasses('px-3 py-2 hover:bg-gray-100 cursor-pointer', className)}
      onClick={onSelect}
      {...props}
    >
      {children}
    </div>
  )
}

export function SelectValue({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement> & AnyProps) {
  return (
    <span className={className} {...props}>
      {children}
    </span>
  )
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  onPress,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-300',
    secondary: 'bg-slate-700 text-white shadow-md shadow-slate-400/15 hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white',
    ghost: 'text-slate-700 hover:bg-slate-100/80',
    danger: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-500 hover:to-red-400',
    solid: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-300',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      type="button"
      className={mergeClasses(
        'rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      )}
      onClick={onClick ?? onPress}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function Pressable({ children, className = '', onPress, onClick, ...props }: PressableProps) {
  return (
    <div className={mergeClasses('cursor-pointer', className)} onClick={onClick ?? onPress} {...props}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('premium-card rounded-[1.5rem] border border-white/70 shadow-lg shadow-slate-200/70', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '', ...props }: BoxProps) {
  return (
    <div className={mergeClasses('p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function Text({ children, className = '', as, ...props }: TextProps) {
  const Tag = (as || 'p') as React.ElementType
  return (
    <Tag className={className} {...(props as AnyProps)}>
      {children}
    </Tag>
  )
}

export function Heading({
  children,
  className = '',
  level = 2,
  as,
  ...props
}: HeadingProps) {
  const Tag = (as || `h${level}`) as React.ElementType
  return (
    <Tag className={mergeClasses('font-bold', className)} {...(props as AnyProps)}>
      {children}
    </Tag>
  )
}

export function Badge({ children, className = '', variant = 'default', ...props }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={mergeClasses(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant] ?? variantClasses.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function Tabs({ children, className = '', ...props }: BoxProps) {
  return <div className={className} {...props}>{children}</div>
}

export function TabsList({ children, className = '', ...props }: BoxProps) {
  return <div className={mergeClasses('flex border-b', className)} {...props}>{children}</div>
}

export function TabsTab({
  children,
  className = '',
  isActive,
  onClick,
  onPress,
  ...props
}: AnyProps & { children?: React.ReactNode; className?: string; isActive?: boolean; onClick?: () => void; onPress?: () => void }) {
  return (
    <button
      type="button"
      className={mergeClasses(
        'px-4 py-2 font-medium border-b-2 -mb-px transition-colors',
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        className,
      )}
      onClick={onClick ?? onPress}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsPanels({ children, className = '', ...props }: BoxProps) {
  return <div className={className} {...props}>{children}</div>
}

export function TabsPanel({ children, className = '', ...props }: BoxProps) {
  return <div className={mergeClasses('py-4', className)} {...props}>{children}</div>
}

export function TabsContent({ children, className = '', ...props }: BoxProps) {
  return <div className={className} {...props}>{children}</div>
}

export function Avatar({
  src,
  alt = 'Avatar',
  className = '',
  size = 'md',
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={mergeClasses('rounded-full object-cover', sizeClasses[size], className)}
        {...props}
      />
    )
  }

  return (
    <div className={mergeClasses('rounded-full bg-gray-300 flex items-center justify-center', sizeClasses[size], className)} {...props}>
      <span className="text-gray-600 font-medium">{alt.charAt(0).toUpperCase()}</span>
    </div>
  )
}

export function Menu({ children, className = '', ...props }: BoxProps) {
  return <div className={mergeClasses('relative inline-block', className)} {...props}>{children}</div>
}

export function MenuTrigger({ children, className = '', ...props }: BoxProps) {
  return <div className={className} {...props}>{children}</div>
}

export function MenuContent({ children, className = '', ...props }: BoxProps) {
  return <div className={mergeClasses('absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50', className)} {...props}>{children}</div>
}

export function MenuItem({ children, onClick, onPress, className = '', ...props }: AnyProps & { children?: React.ReactNode; onClick?: () => void; onPress?: () => void }) {
  return (
    <button
      type="button"
      className={mergeClasses('w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100', className)}
      onClick={onClick ?? onPress}
      {...props}
    >
      {children}
    </button>
  )
}

export function Loading({ children, isLoading, className = '', ...props }: { children?: React.ReactNode; isLoading?: boolean; className?: string; [key: string]: any }) {
  if (isLoading) {
    return (
      <div className={mergeClasses('flex items-center justify-center', className)} {...props}>
        <Spinner />
      </div>
    )
  }
  return <>{children}</>
}

export function EmptyState({
  children,
  className = '',
  icon,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  icon?: React.ReactNode
  [key: string]: any
}) {
  return (
    <div className={mergeClasses('flex flex-col items-center justify-center py-12 text-center', className)} {...props}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      {children}
    </div>
  )
}

export function Alert({ children, className = '', variant = 'info', ...props }: AlertProps) {
  const variantClasses: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className={mergeClasses('p-4 rounded-md border', variantClasses[variant] ?? variantClasses.info, className)} {...props}>
      {children}
    </div>
  )
}

export function Icon({ children, className = '', ...props }: BoxProps) {
  return (
    <span className={mergeClasses('inline-flex items-center justify-center', className)} {...props}>
      {children}
    </span>
  )
}
