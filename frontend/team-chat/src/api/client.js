import { API_URL } from '../config'

const TOKEN_KEY = 'team-chat-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

async function core(path, { method = 'GET', body, formData, query } = {}) {
  const headers = { Accept: 'application/json' }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let payload = undefined
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const queryString = query ? `?${new URLSearchParams(query).toString()}` : ''

  let res
  try {
    res = await fetch(`${API_URL}${path}${queryString}`, {
      method,
      headers,
      body: payload,
    })
  } catch {
    throw new ApiError('Network error. Is the API server running?', 0)
  }

  if (res.status === 401) {
    setToken(null)
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    throw new ApiError('Session expired. Please log in again.', 401)
  }

  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, json?.errors || null)
  }

  return json
}

export async function request(path, options = {}) {
  const json = await core(path, options)
  return json && 'data' in json ? json.data : json
}

export async function requestRaw(path, options = {}) {
  return core(path, options)
}