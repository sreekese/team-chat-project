/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { keyApi } from '../api/endpoints'
import {
  clearAllCaches,
  decryptMessageCached,
  encryptMessageBody,
  getMyPublicKeys,
  hydrateUserKeys,
} from '../crypto/e2ee'
import { useAuth } from './AuthContext'

const E2EEContext = createContext(null)

export function E2EEProvider({ children }) {
  const { token, user } = useAuth()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      clearAllCaches()
      queueMicrotask(() => {
        setReady(false)
        setError(null)
      })
      return undefined
    }

    let active = true
    queueMicrotask(() => {
      if (active) {
        setReady(false)
        setError(null)
      }
    })

    ;(async () => {
      try {
        const publicKeys = await getMyPublicKeys()
        await keyApi.register(publicKeys)
        if (active) setReady(true)
      } catch (err) {
        if (active) {
          setReady(false)
          setError(err.message || 'Could not set up end-to-end encryption')
        }
      }
    })()

    return () => {
      active = false
    }
  }, [token])

  const encrypt = useCallback(
    ({ text, recipients, selfId }) => encryptMessageBody({ text, recipients, selfId }),
    [],
  )

  const decrypt = useCallback(
    (message) => decryptMessageCached(message, user?.id),
    [user?.id],
  )

  const hydrate = useCallback((users) => {
    hydrateUserKeys(users)
  }, [])

  const value = useMemo(
    () => ({ ready, error, encrypt, decrypt, hydrate }),
    [ready, error, encrypt, decrypt, hydrate],
  )

  return <E2EEContext.Provider value={value}>{children}</E2EEContext.Provider>
}

export function useE2EE() {
  const ctx = useContext(E2EEContext)
  if (!ctx) {
    throw new Error('useE2EE must be used within an E2EEProvider')
  }
  return ctx
}

export function useDecryptedMessage(message) {
  const { decrypt } = useE2EE()
  const [state, setState] = useState({ plain: null, failed: false })

  useEffect(() => {
    let active = true

    Promise.resolve().then(async () => {
      if (!active) return
      setState({ plain: null, failed: false })

      if (!message) {
        return
      }

      if (!message.encrypted_body) {
        setState({ plain: message.body || '', failed: false })
        return
      }

      const text = await decrypt(message)
      if (active) {
        setState({ plain: text, failed: text === null })
      }
    })

    return () => {
      active = false
    }
  }, [message, decrypt])

  return state
}
