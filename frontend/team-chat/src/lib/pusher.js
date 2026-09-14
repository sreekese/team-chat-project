import Pusher from 'pusher-js'
import {
  BROADCAST_AUTH_URL,
  REVERB_KEY,
  REVERB_WS_HOST,
  REVERB_WS_PATH,
  REVERB_WS_PORT,
} from '../config'

let client = null

export function initPusher(token) {
  if (client) {
    client.disconnect()
  }
  client = new Pusher(REVERB_KEY, {
    wsHost: REVERB_WS_HOST,
    wsPort: REVERB_WS_PORT,
    wsPath: REVERB_WS_PATH,
    forceTLS: false,
    cluster: 'mt1',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: BROADCAST_AUTH_URL,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
  return client
}

export function getPusher() {
  return client
}

export function destroyPusher() {
  if (client) {
    client.disconnect()
    client = null
  }
}