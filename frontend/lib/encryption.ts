'use client'

// Browser-side AES-256-GCM via the Web Crypto API.

const AUTH_TAG_BYTES = 16

export function splitKeyString(encoded: string): { key: string; iv: string } {
  const [key, iv] = encoded.split(':')
  if (!key || !iv) throw new Error('invalid key string format')
  return { key, iv }
}

function hexToBuffer(hex: string): ArrayBuffer {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return arr.buffer as ArrayBuffer
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i)
  }
  return arr.buffer as ArrayBuffer
}

/**
 * Decrypt base64(ciphertext + authTag) using AES-256-GCM in the browser.
 */
export async function decrypt(
  ciphertextBase64: string,
  keyHex: string,
  ivHex: string,
): Promise<string> {
  const data = base64ToBuffer(ciphertextBase64)
  const keyBuffer = hexToBuffer(keyHex)
  const ivBuffer = hexToBuffer(ivHex)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, tagLength: AUTH_TAG_BYTES * 8 },
    cryptoKey,
    data,
  )

  return new TextDecoder().decode(plaintext)
}
