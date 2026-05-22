'use client'

// Re-exports only the key-generation helpers (no Node.js crypto).
// Used client-side in the creator dashboard.

export interface AesKey {
  key: string
  iv: string
}

export function generateKey(): AesKey {
  const keyBytes = crypto.getRandomValues(new Uint8Array(32))
  const ivBytes = crypto.getRandomValues(new Uint8Array(12))
  return {
    key: Array.from(keyBytes).map((b) => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(ivBytes).map((b) => b.toString(16).padStart(2, '0')).join(''),
  }
}

export function encodeKeyString(aesKey: AesKey): string {
  return `${aesKey.key}:${aesKey.iv}`
}
