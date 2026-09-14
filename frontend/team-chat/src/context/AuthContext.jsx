/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { authApi } from '../api/endpoints'
import { getToken, setToken } from '../api/client'
import { destroyPusher, initPusher } from '../lib/pusher'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setAuthToken] = useState(() => getToken())
  const [initializing, setInitializing] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (token) {
      initPusher(token)
    } else {
      destroyPusher()
    }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    let active = true
    authApi
      .me()
      .then((me) => {
        if (active) {
          setUser(me)
          setInitializing(false)
        }
      })
      .catch(() => {
        if (active) {
          setToken(null)
          setAuthToken(null)
          setUser(null)
          setInitializing(false)
        }
      })
    return () => {
      active = false
    }
  }, [token])

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials)
    setToken(res.token)
    setAuthToken(res.token)
    setUser(res.data)
    return res.data
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    setToken(res.token)
    setAuthToken(res.token)
    setUser(res.data)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore network errors during logout
    }
    destroyPusher()
    setToken(null)
    setAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [user, token, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}