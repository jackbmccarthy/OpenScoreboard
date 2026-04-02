// UI Components for OpenScoreboard - Using Tailwind + Radix primitives
// This replaces GlueStack UI for the Next.js web version
// Adapted for Vite

import React from 'react'

// Box - container component
export function Box({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// Text component
export function Text({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

// Heading component
export function Heading({ 
  children, 
  className = '',
  size = 'lg',
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement> & { 
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
  }
  return (
    <h2 className={`font-bold ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </h2>
  )
}

// HStack - horizontal stack
export function HStack({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div className={`flex flex-row ${className}`} {...props}>
      {children}
    </div>
  )
}

// VStack - vertical stack
export function VStack({ 
  children, 
  className = '',
  space,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  children?: React.ReactNode
  space?: string 
}) {
  const spaceClass = space ? `space-y-${space}` : '';
  return (
    <div className={`flex flex-col ${spaceClass} ${className}`} {...props}>
      {children}
    </div>
  )
}

// Button component
export function Button({ 
  children, 
  className = '',
  variant = 'solid',
  action = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  children?: React.ReactNode
  variant?: 'solid' | 'outline' | 'ghost'
  action?: 'primary' | 'secondary' | 'negative'
  size?: 'sm' | 'md' | 'lg'
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const variantClasses = {
    solid: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      negative: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    },
    outline: {
      primary: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      secondary: 'border-2 border-gray-600 text-gray-600 hover:bg-gray-50 focus:ring-gray-500',
      negative: 'border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
    },
    ghost: {
      primary: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
      secondary: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
      negative: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    },
  }
  
  const disabledClasses = 'opacity-50 cursor-not-allowed'
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant][action]} ${disabled ? disabledClasses : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Input component
export function Input({
  className = '',
  type = 'text',
  placeholder,
  value,
  onChangeText,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  type?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
}) {
  return (
    <input
      type={type}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChangeText?.(e.target.value)}
      {...props}
    />
  )
}

// Card component
export function Card({ 
  children, 
  className = '',
  variant = 'elevated',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  children?: React.ReactNode
  variant?: 'elevated' | 'outline'
}) {
  const variantClasses = {
    elevated: 'shadow-md bg-white',
    outline: 'border border-gray-200 bg-white',
  }
  
  return (
    <div className={`rounded-lg ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}

// CardBody component
export function CardBody({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

// Pressable component (touchable for web)
export function Pressable({ 
  children, 
  className = '',
  onPress,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  children?: React.ReactNode
  onPress?: () => void
}) {
  return (
    <div 
      className={`cursor-pointer transition-colors ${className}`}
      onClick={onPress}
      {...props}
    >
      {children}
    </div>
  )
}

// Badge component
export function Badge({ 
  children, 
  className = '',
  variant = 'subtle',
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & { 
  children?: React.ReactNode
  variant?: 'subtle' | 'solid' | 'outline'
}) {
  const variantClasses = {
    subtle: 'bg-blue-100 text-blue-800',
    solid: 'bg-blue-600 text-white',
    outline: 'border border-blue-600 text-blue-600',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}

// Tabs components (simplified)
export function Tabs({ 
  children, 
  value,
  onValueChange,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <div {...props}>
      {children}
    </div>
  )
}

export function TabsList({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function TabsTab({ 
  children, 
  className = '',
  value,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  children?: React.ReactNode
  value?: string
}) {
  return (
    <button className={`px-4 py-2 font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent -mb-px ${className}`} {...props}>
      {children}
    </button>
  )
}

export function TabsPanels({ 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div {...props}>{children}</div>
}

export function TabsPanel({ 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div {...props}>{children}</div>
}

// Spinner component
export function Spinner({ 
  className = '',
  size = 'md',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}

// Modal component
export function Modal({ 
  children, 
  isOpen,
  onClose,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { 
  children?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
}) {
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className="text-xl font-bold mb-4" {...props}>{children}</div>
}

export function ModalBody({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className="mb-4" {...props}>{children}</div>
}

export function ModalFooter({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className="flex justify-end gap-2" {...props}>{children}</div>
}

// Select component
export function Select({ 
  children, 
  className = '',
  value,
  onValueChange,
  ...props 
}: React.HTMLAttributes<HTMLSelectElement> & { 
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {children}
    </select>
  )
}

export function SelectTrigger({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white" {...props}>{children}</div>
}

export function SelectContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg" {...props}>{children}</div>
}

export function SelectItem({ children, value, onSelect, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; value?: string; onSelect?: () => void }) {
  return <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={onSelect} {...props}>{children}</div>
}

export function SelectValue({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) {
  return <span {...props}>{children}</span>
}
