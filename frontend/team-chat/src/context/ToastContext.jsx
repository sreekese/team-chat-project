/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Toaster } from '../components/Toaster'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (type, message) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, type, message }])
      timers.current[id] = setTimeout(() => dismiss(id), 4000)
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toast: {
        success: (message) => push('success', message),
        error: (message) => push('error', message || 'Something went wrong'),
        info: (message) => push('info', message),
      },
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}