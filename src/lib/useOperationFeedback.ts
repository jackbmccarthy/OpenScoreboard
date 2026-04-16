import { useEffect, useRef, useState } from 'react'

import type { OperationToastTone } from '@/components/realtime/OperationToast'

export function useOperationFeedback(timeoutMs = 2200) {
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<OperationToastTone>('info')
  const timeoutRef = useRef<number | null>(null)

  const clear = () => {
    if (timeoutRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setMessage('')
  }

  const show = (nextMessage: string, nextTone: OperationToastTone) => {
    clear()
    setTone(nextTone)
    setMessage(nextMessage)
    if (typeof window !== 'undefined') {
      timeoutRef.current = window.setTimeout(() => {
        setMessage('')
        timeoutRef.current = null
      }, timeoutMs)
    }
  }

  useEffect(() => clear, [])

  return {
    message,
    tone,
    clear,
    showError(messageText: string) {
      show(messageText, 'danger')
    },
    showInfo(messageText: string) {
      show(messageText, 'info')
    },
    showSuccess(messageText: string) {
      show(messageText, 'success')
    },
    showWarning(messageText: string) {
      show(messageText, 'warning')
    },
  }
}
