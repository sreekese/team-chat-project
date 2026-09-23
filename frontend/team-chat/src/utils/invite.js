const PENDING_KEY = 'team-chat-pending-invite'

export function getPendingInvite() {
  return sessionStorage.getItem(PENDING_KEY)
}

export function setPendingInvite(code) {
  if (code) {
    sessionStorage.setItem(PENDING_KEY, code)
  }
}

export function clearPendingInvite() {
  sessionStorage.removeItem(PENDING_KEY)
}

export function buildInviteLink(code) {
  if (!code) return ''
  return `${window.location.origin}/workspaces?invite=${encodeURIComponent(code)}`
}

export function buildInviteMessage(workspaceName, code) {
  const link = buildInviteLink(code)
  if (!link) return ''
  const label = workspaceName ? `"${workspaceName}"` : 'on Team Chat'
  return `Join my workspace ${label} ${link}`
}