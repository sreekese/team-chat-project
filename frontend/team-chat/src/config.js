export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const isSameOrigin =
  !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.startsWith('/')

export const BROADCAST_AUTH_URL = isSameOrigin
  ? '/broadcasting/auth'
  : (import.meta.env.VITE_BROADCAST_AUTH_URL ||
    'http://localhost:8000/broadcasting/auth')

export const REVERB_KEY = 'efdeee58360a75febad4c98fdf926e17'
export const REVERB_WS_HOST = 'localhost'
export const REVERB_WS_PORT = 8080
export const REVERB_WS_PATH = ''