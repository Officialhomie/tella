/** Parse u128 from a Sails calculate-reply payload (little-endian, last 16 bytes). */
export function parseU128FromReply(payload: unknown): bigint {
  if (payload === null || payload === undefined) return 0n
  if (typeof payload === 'bigint') return payload
  if (typeof payload === 'number' && Number.isFinite(payload)) return BigInt(Math.trunc(payload))
  if (typeof payload === 'string') {
    const s = payload.trim()
    if (!s || s === '0x' || s === '0x0') return 0n
    if (/^\d+$/.test(s)) return BigInt(s)
    if (s.startsWith('0x') && s.length >= 34) {
      const hex = s.slice(2)
      const leHex = hex.slice(-32)
      if (/^[0-9a-fA-F]{32}$/.test(leHex)) {
        const bytes = Buffer.from(leHex, 'hex')
        let v = 0n
        for (let i = 0; i < bytes.length; i++) {
          v += BigInt(bytes[i]!) << BigInt(i * 8)
        }
        return v
      }
    }
  }
  return 0n
}

/** Format smallest VARA units (12 decimals) for display. */
export function formatVaraFromUnits(units: string | bigint): string {
  try {
    const raw = typeof units === 'bigint' ? units : parseU128FromReply(units)
    if (raw === 0n) return '0.0000'
    return (Number(raw) / 1e12).toFixed(4)
  } catch {
    return '0.0000'
  }
}
