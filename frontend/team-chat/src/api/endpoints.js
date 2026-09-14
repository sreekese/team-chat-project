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
}

export const channelApi = {
  list: (workspaceId) => request(`/workspaces/${workspaceId}/channels`),
  create: (workspaceId, data) =>
    request(`/workspaces/${workspaceId}/channels`, { method: 'POST', body: data }),
  get: (workspaceId, channelId) =>
    request(`/workspaces/${workspaceId}/channels/${channelId}`),
}

export const messageApi = {
  list: (workspaceId, channelId, page) =>
    requestRaw(`/workspaces/${workspaceId}/channels/${channelId}/messages`, {
      query: page && page > 1 ? { page } : undefined,
    }),
  send: (workspaceId, channelId, { body, type, parentId, attachment } = {}) => {
    const formData = new FormData()
    if (body) formData.append('body', body)
    if (type && !attachment) formData.append('type', type)
    if (parentId) formData.append('parent_id', parentId)
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