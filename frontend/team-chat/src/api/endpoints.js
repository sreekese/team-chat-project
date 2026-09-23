import { request, requestRaw } from './client'

export const authApi = {
  login: (data) => requestRaw('/login', { method: 'POST', body: data }),
  register: (data) => requestRaw('/register', { method: 'POST', body: data }),
  logout: () => request('/logout', { method: 'POST' }),
  me: () => request('/me'),
}

export const workspaceApi = {
  list: () => request('/workspaces'),
  create: (data) => request('/workspaces', { method: 'POST', body: data }),
  get: (id) => request(`/workspaces/${id}`),
  delete: (id) => request(`/workspaces/${id}`, { method: 'DELETE' }),
  members: (id) => request(`/workspaces/${id}/members`),
  addMember: (id, data) =>
    request(`/workspaces/${id}/members`, { method: 'POST', body: data }),
  removeMember: (id, userId) =>
    request(`/workspaces/${id}/members/${userId}`, { method: 'DELETE' }),
  invite: (id) => request(`/workspaces/${id}/invite`, { method: 'POST' }),
  join: (inviteCode) =>
    request('/workspaces/join', {
      method: 'POST',
      body: { invite_code: inviteCode },
    }),
}

export const userApi = {
  search: (q) =>
    request(`/users/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
}

export const keyApi = {
  register: (keys) => request('/keys', { method: 'POST', body: keys }),
  me: () => request('/keys'),
}

export const channelApi = {
  list: (workspaceId) => request(`/workspaces/${workspaceId}/channels`),
  create: (workspaceId, data) =>
    request(`/workspaces/${workspaceId}/channels`, { method: 'POST', body: data }),
  get: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}`),
  accept: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}/accept`, { method: 'POST' }),
  decline: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}/decline`, { method: 'DELETE' }),
  remove: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}`, { method: 'DELETE' }),
  leave: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}/leave`, { method: 'DELETE' }),
  createDm: (workspaceId, userId) =>
    request(`/workspaces/${workspaceId}/dms`, {
      method: 'POST',
      body: { user_id: userId },
    }),
}

export const dmApi = {
  list: () => request('/dms'),
  create: (userId) =>
    request('/dms', { method: 'POST', body: { user_id: userId } }),
  leave: (channelId) =>
    request(`/dms/${channelId}`, { method: 'DELETE' }),
}

export const messageApi = {
  list: (workspaceId, channelId, page) =>
    requestRaw(`/workspaces/${workspaceId}/channels/${channelId}/messages`, {
      query: page && page > 1 ? { page } : undefined,
    }),
  send: (workspaceId, channelId, { body, type, parentId, attachment, encryptedBody, bodyIv, keyWraps } = {}) => {
    const formData = new FormData()
    if (body) formData.append('body', body)
    if (type && !attachment) formData.append('type', type)
    if (parentId) formData.append('parent_id', parentId)
    if (encryptedBody) {
      formData.append('encrypted_body', encryptedBody)
      formData.append('body_iv', bodyIv)
      formData.append('key_wraps', JSON.stringify(keyWraps))
    }
    if (attachment) formData.append('attachment', attachment)
    return request(`/workspaces/${workspaceId}/channels/${channelId}/messages`, {
      method: 'POST',
      formData,
    })
  },
  get: (workspaceId, channelId, messageId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`),
  react: (workspaceId, channelId, messageId, emoji) =>
    request(
      `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/react`,
      { method: 'POST', body: { emoji } },
    ),
  remove: (workspaceId, channelId, messageId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
    }),
}
