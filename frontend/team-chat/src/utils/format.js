export function formatMessageTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) {
    return time
  }
  const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${day} ${time}`
}

export function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = Number(bytes)
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function displayName(user) {
  return user?.name || user?.username || 'Unknown'
}

export function initials(user) {
  const name = displayName(user)
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || '?'
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
]

export function avatarColor(user) {
  const key = user?.username || user?.email || user?.name || 'unknown'
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function sortedMessages(list) {
  return [...list].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0),
  )
}

export function appendMessage(list, message) {
  if (list.some((m) => m.id === message.id)) return list
  return sortedMessages([...list, message])
}