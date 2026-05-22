import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 12
const AUTH_TAG_BYTES = 16

export interface AesKey {
  key: string // 32-byte hex
  iv: string  // 12-byte hex
}

/** Generate a fresh AES-256-GCM key + IV pair. */
export function generateKey(): AesKey {
  return {
    key: randomBytes(KEY_BYTES).toString('hex'),
    iv: randomBytes(IV_BYTES).toString('hex'),
  }
}

/**
 * Encode as "key_hex:iv_hex" — the single string stored on-chain.
 * Split with splitKeyString() on the read path.
 */
export function encodeKeyString(aesKey: AesKey): string {
  return `${aesKey.key}:${aesKey.iv}`
}

export function splitKeyString(encoded: string): AesKey {
  const [key, iv] = encoded.split(':')
  if (!key || !iv) throw new Error('invalid key string format')
  return { key, iv }
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns base64(ciphertext + authTag).
 */
export function encrypt(plaintext: string, keyHex: string, ivHex: string): string {
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.from(keyHex, 'hex'),
    Buffer.from(ivHex, 'hex'),
  )
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([encrypted, authTag]).toString('base64')
}

/**
 * Decrypt base64(ciphertext + authTag) with AES-256-GCM.
 * Returns UTF-8 plaintext.
 */
export function decrypt(ciphertextBase64: string, keyHex: string, ivHex: string): string {
  const data = Buffer.from(ciphertextBase64, 'base64')
  const authTag = data.subarray(data.length - AUTH_TAG_BYTES)
  const ciphertext = data.subarray(0, data.length - AUTH_TAG_BYTES)

  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(keyHex, 'hex'),
    Buffer.from(ivHex, 'hex'),
  )
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
