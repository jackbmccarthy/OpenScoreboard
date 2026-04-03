// UI Components for OpenScoreboard v3
// Using Tailwind CSS classes for styling

import React from 'react';

// Flex components
export function VStack({ 
  children, 
  space,
  className,
  ...props 
}: {
  children?: React.ReactNode
  space?: string
  className?: string
  [key: string]: any
}) {
  const spaceClass = space ? `space-y-${space}` : '';
  return (
    <div className={`flex flex-col ${spaceClass} ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

export function HStack({ 
  children, 
  space,
  className,
  ...props 
}: {
  children?: React.ReactNode
  space?: string
  className?: string
  [key: string]: any
}) {
  const spaceClass = space ? `space-x-${space}` : '';
  return (
    <div className={`flex flex-row ${spaceClass} ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

export function Box({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

export function Spinner({ 
  size = 'md',
  className = '',
  ...props 
}: { size?: 'sm' | 'md' | 'lg'; className?: string; [key: string]: any }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

// Modal components
export function Modal({ 
  children, 
  isOpen,
  onClose,
  className = '',
  ...props 
}: { 
  children?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  className?: string
  [key: string]: any
}) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      {...props}
    >
      <div 
        className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`text-xl font-bold mb-4 ${className}`} {...props}>{children}</div>;
}

export function ModalBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`mb-4 ${className}`} {...props}>{children}</div>;
}

export function ModalFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`flex justify-end gap-2 ${className}`} {...props}>{children}</div>;
}

// Form components
export function Input({ 
  className = '',
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

export function Select({ 
  children, 
  className = '',
  value,
  onValueChange,
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  value?: string
  onValueChange?: (value: string) => void
  [key: string]: any
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
  );
}

export function SelectTrigger({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white ${className}`} {...props}>{children}</div>;
}

export function SelectContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg ${className}`} {...props}>{children}</div>;
}

export function SelectItem({ children, value, onSelect, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; value?: string; onSelect?: () => void }) {
  return <div className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${className}`} onClick={onSelect} {...props}>{children}</div>;
}

export function SelectValue({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) {
  return <span className={className} {...props}>{children}</span>;
}

// Button component
export function Button({ 
  children, 
  className = '',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  [key: string]: any
}) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type="button"
      className={`rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

// Pressable (for touch/click)
export function Pressable({ 
  children, 
  className = '',
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; onClick?: () => void }) {
  return (
    <div 
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Card components
export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`bg-white rounded-lg shadow-sm border ${className}`} {...props}>{children}</div>;
}

export function CardBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`p-4 ${className}`} {...props}>{children}</div>;
}

// Text component
export function Text({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) {
  return <p className={className} {...props}>{children}</p>;
}

// Heading component
export function Heading({ 
  children, 
  className = '',
  level = 2,
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  [key: string]: any
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={`font-bold ${className}`} {...props}>{children}</Tag>;
}

// Badge component
export function Badge({ 
  children, 
  className = '',
  variant = 'default',
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  [key: string]: any
}) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// Tabs components
export function Tabs({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`${className}`} {...props}>{children}</div>;
}

export function TabsList({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`flex border-b ${className}`} {...props}>{children}</div>;
}

export function TabsTab({ 
  children, 
  className = '',
  isActive,
  onClick,
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  isActive?: boolean
  onClick?: () => void
  [key: string]: any
}) {
  return (
    <button
      type="button"
      className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
        isActive 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsPanels({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`${className}`} {...props}>{children}</div>;
}

export function TabsPanel({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`py-4 ${className}`} {...props}>{children}</div>;
}

export function TabsContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`${className}`} {...props}>{children}</div>;
}

// Avatar component
export function Avatar({ 
  src, 
  alt = 'Avatar',
  className = '',
  size = 'md',
  ...props 
}: { 
  src?: string
  alt?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  [key: string]: any
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
        {...props} 
      />
    );
  }

  return (
    <div className={`rounded-full bg-gray-300 flex items-center justify-center ${sizeClasses[size]} ${className}`} {...props}>
      <span className="text-gray-600 font-medium">{alt.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// Menu components
export function Menu({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`relative inline-block ${className}`} {...props}>{children}</div>;
}

export function MenuTrigger({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`${className}`} {...props}>{children}</div>;
}

export function MenuContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return <div className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50 ${className}`} {...props}>{children}</div>;
}

export function MenuItem({ children, onClick, className = '', ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

// Loading/Spinner wrapper
export function Loading({ children, isLoading, className = '', ...props }: { children?: React.ReactNode; isLoading?: boolean; className?: string; [key: string]: any }) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} {...props}>
        <Spinner />
      </div>
    );
  }
  return <>{children}</>;
}

// Empty state
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
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`} {...props}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      {children}
    </div>
  );
}

// Error/Alert component
export function Alert({ 
  children, 
  className = '',
  variant = 'info',
  ...props 
}: { 
  children?: React.ReactNode
  className?: string
  variant?: 'info' | 'success' | 'warning' | 'danger'
  [key: string]: any
}) {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`p-4 rounded-md border ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

// Icon wrapper (for simple icon handling)
export function Icon({ 
  children, 
  className = '',
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} {...props}>
      {children}
    </span>
  );
}
