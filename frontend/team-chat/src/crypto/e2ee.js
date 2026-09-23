const STORE_KEY = 'team-chat-e2ee'
const HKDF_INFO = 'team-chat:e2ee:v1'
const ECDSA = { name: 'ECDSA', namedCurve: 'P-256' }
const ECDH = { name: 'ECDH', namedCurve: 'P-256' }
const AES_GCM = { name: 'AES-GCM' }

export class E2eeError extends Error {
  constructor(message) {
    super(message)
    this.name = 'E2eeError'
  }
}

function randomBytes(length) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

function bytesToB64(bytes) {
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function b64ToBytes(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function generateMyKeys() {
  const encPair = await crypto.subtle.generateKey(ECDH, true, ['deriveBits'])
  const encPublic = await crypto.subtle.exportKey('spki', encPair.publicKey)
  const idPair = await crypto.subtle.generateKey(ECDSA, true, ['sign', 'verify'])
  const idPublic = await crypto.subtle.exportKey('spki', idPair.publicKey)
  const idPrivate = await crypto.subtle.exportKey('jwk', idPair.privateKey)
  const encPrivate = await crypto.subtle.exportKey('jwk', encPair.privateKey)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    idPair.privateKey,
    encPublic,
  )

  return {
    identity_public_key: bytesToB64(new Uint8Array(idPublic)),
    encryption_public_key: bytesToB64(new Uint8Array(encPublic)),
    encryption_key_signature: bytesToB64(new Uint8Array(signature)),
    identity_private_key: idPrivate,
    encryption_private_key: encPrivate,
  }
}

export async function ensureMyKeys() {
  const raw = localStorage.getItem(STORE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.encryption_public_key && parsed?.encryption_private_key) {
        return parsed
      }
    } catch {
      // fall through and regenerate
    }
  }

  const keys = await generateMyKeys()
  localStorage.setItem(STORE_KEY, JSON.stringify(keys))
  return keys
}

export async function getMyPublicKeys() {
  const keys = await ensureMyKeys()
  return {
    identity_public_key: keys.identity_public_key,
    encryption_public_key: keys.encryption_public_key,
    encryption_key_signature: keys.encryption_key_signature,
  }
}

const cachedKeys = new Map()

export function hydrateUserKeys(users) {
  ;(Array.isArray(users) ? users : []).forEach((user) => {
    if (user?.id && user.encryption_public_key) {
      cachedKeys.set(Number(user.id), {
        id: Number(user.id),
        encryption_public_key: user.encryption_public_key,
        identity_public_key: user.identity_public_key,
        encryption_key_signature: user.encryption_key_signature,
      })
    }
  })
}

export function clearUserKeys() {
  cachedKeys.clear()
}

async function verifyEncryptionKey(peer) {
  if (!peer.identity_public_key || !peer.encryption_key_signature) return null
  try {
    const identityPub = await crypto.subtle.importKey(
      'spki',
      b64ToBytes(peer.identity_public_key),
      ECDSA,
      false,
      ['verify'],
    )
    return crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      identityPub,
      b64ToBytes(peer.encryption_key_signature),
      b64ToBytes(peer.encryption_public_key),
    )
  } catch {
    return false
  }
}

function importEcdhPublic(b64) {
  return crypto.subtle.importKey('spki', b64ToBytes(b64), ECDH, false, [])
}

function importEcdhPrivate(jwk) {
  return crypto.subtle.importKey('jwk', jwk, ECDH, false, ['deriveBits'])
}

function deriveShared(privateKey, publicKey) {
  return crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256)
}

async function hkdf(sharedBytes, info) {
  const base = await crypto.subtle.importKey('raw', sharedBytes, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info },
    base,
    256,
  )
  return new Uint8Array(bits)
}

function aesKey(raw) {
  return crypto.subtle.importKey('raw', raw, AES_GCM, false, ['encrypt', 'decrypt'])
}

async function gcmEncrypt(key, iv, data) {
  return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
}

async function gcmDecrypt(key, iv, data) {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data))
}

export async function encryptMessageBody({ text, recipients = [], selfId }) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new E2eeError('Nothing to encrypt')
  }

  const my = await ensureMyKeys()
  const peers = []
  const ids = new Set()

  for (const recipient of recipients) {
    const rid = Number(recipient?.id ?? recipient?.user_id)
    if (!rid || ids.has(rid)) continue
    if (!recipient?.encryption_public_key) {
      throw new E2eeError('A member has not set up encryption yet')
    }
    const verified = await verifyEncryptionKey(recipient)
    if (verified === false) {
      throw new E2eeError(`Could not verify the encryption key for ${recipient.name || 'a member'}`)
    }
    ids.add(rid)
    peers.push(recipient)
  }

  if (selfId != null) {
    const selfNum = Number(selfId)
    if (!ids.has(selfNum)) {
      ids.add(selfNum)
      cachedKeys.set(selfNum, {
        id: selfNum,
        encryption_public_key: my.encryption_public_key,
        identity_public_key: my.identity_public_key,
        encryption_key_signature: my.encryption_key_signature,
      })
      peers.push({
        id: selfNum,
        encryption_public_key: my.encryption_public_key,
        identity_public_key: my.identity_public_key,
        encryption_key_signature: my.encryption_key_signature,
      })
    }
  }

  if (peers.length === 0) {
    throw new E2eeError('No recipients with encryption keys')
  }

  const selfOnly =
    selfId != null &&
    peers.every((peer) => Number(peer.id ?? peer.user_id) === Number(selfId))
  if (selfOnly) {
    throw new E2eeError('No other members have set up encryption yet')
  }

  const messageKey = randomBytes(32)
  const messageIv = randomBytes(12)
  const gcm = await aesKey(messageKey)
  const ciphertext = await gcmEncrypt(gcm, messageIv, new TextEncoder().encode(text))
  const info = new TextEncoder().encode(HKDF_INFO)
  const wraps = []

  for (const peer of peers) {
    const ephemeral = await crypto.subtle.generateKey(ECDH, true, ['deriveBits'])
    const ephemeralPublic = new Uint8Array(
      await crypto.subtle.exportKey('spki', ephemeral.publicKey),
    )
    const peerPublic = await importEcdhPublic(peer.encryption_public_key)
    const shared = new Uint8Array(await deriveShared(ephemeral.privateKey, peerPublic))
    const wrapKey = await aesKey(await hkdf(shared, info))
    const wrapIv = randomBytes(12)
    const wrapped = await gcmEncrypt(wrapKey, wrapIv, messageKey)

    wraps.push({
      user_id: Number(peer.id ?? peer.user_id),
      ephemeral_public_key: bytesToB64(ephemeralPublic),
      wrapped_key: bytesToB64(wrapped),
      wrap_iv: bytesToB64(wrapIv),
    })
  }

  return {
    encryptedBody: bytesToB64(ciphertext),
    bodyIv: bytesToB64(messageIv),
    keyWraps: wraps,
  }
}

export async function decryptMessageEnvelope({
  encryptedBody,
  bodyIv,
  keyWraps = [],
  userId,
}) {
  if (!encryptedBody || !bodyIv || userId == null) return null

  const wrap = keyWraps?.find((w) => Number(w.user_id) === Number(userId))
  if (!wrap) return null

  const my = await ensureMyKeys()
  const myPrivate = await importEcdhPrivate(my.encryption_private_key)
  const ephemeralPublic = await importEcdhPublic(wrap.ephemeral_public_key)
  const shared = new Uint8Array(await deriveShared(myPrivate, ephemeralPublic))
  const wrapKey = await aesKey(await hkdf(shared, new TextEncoder().encode(HKDF_INFO)))
  const messageKey = await gcmDecrypt(
    wrapKey,
    b64ToBytes(wrap.wrap_iv),
    b64ToBytes(wrap.wrapped_key),
  )
  const gcm = await aesKey(messageKey)
  const plaintext = await gcmDecrypt(gcm, b64ToBytes(bodyIv), b64ToBytes(encryptedBody))

  return new TextDecoder().decode(plaintext)
}

const plainCache = new Map()

export function decryptMessageCached(message, userId) {
  if (!message?.encrypted_body) {
    return Promise.resolve(message?.body || '')
  }

  const cacheKey = `${userId}:${message.id}`
  if (!plainCache.has(cacheKey)) {
    plainCache.set(
      cacheKey,
      decryptMessageEnvelope({
        encryptedBody: message.encrypted_body,
        bodyIv: message.body_iv,
        keyWraps: message.key_wraps || [],
        userId,
      }).catch(() => null),
    )
  }
  return plainCache.get(cacheKey)
}

export function clearMessageCache() {
  plainCache.clear()
}

export function clearAllCaches() {
  plainCache.clear()
  cachedKeys.clear()
}
