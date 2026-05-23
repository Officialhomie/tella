'use client'

/**
 * SCALE codec for Vara/Gear Sails v1.0.0 protocol.
 *
 * Request payload format:
 *   [header: 4B 47 4d 01 10]
 *   [service IDL route: 8B]  ← patched to on-chain ID before sending
 *   [method prefix: 4B = fnIndex(u16 LE) + svcIndex(u16 LE)]
 *   [SCALE-encoded args]
 *
 * Response payload format (from calculateReply / program reply):
 *   [on-chain service ID: 8B]
 *   [method prefix: 4B]
 *   [SCALE-encoded result]
 *
 * Method indices (IDL declaration order within each service):
 *   Content: GetContent=0, ListContent=1, Publish=2, RequestAccessKey=3
 *   Pass:    CheckAccess=0, GetUserPasses=1, MintPass=2
 *   Treasury: ClaimRevenue=0, GetPendingRevenue=1
 *
 * Service indices: Content=1, Pass=2, Treasury=3
 */

import { decodeAddress } from '@polkadot/util-crypto'

// ─── Byte helpers ─────────────────────────────────────────────────────────────

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// ─── SCALE encoders ───────────────────────────────────────────────────────────

export function scaleU32(n: number): Uint8Array {
  const buf = new Uint8Array(4)
  new DataView(buf.buffer).setUint32(0, n >>> 0, true)
  return buf
}

export function scaleU64(n: bigint): Uint8Array {
  const buf = new Uint8Array(8)
  new DataView(buf.buffer).setBigUint64(0, BigInt.asUintN(64, n), true)
  return buf
}

export function scaleU128(n: bigint): Uint8Array {
  const buf = new Uint8Array(16)
  const dv = new DataView(buf.buffer)
  dv.setBigUint64(0, BigInt.asUintN(64, n), true)
  dv.setBigUint64(8, BigInt.asUintN(64, n >> 64n), true)
  return buf
}

export function scaleCompact(n: number): Uint8Array {
  if (n < 64) return new Uint8Array([(n << 2) & 0xff])
  if (n < 16384) {
    const v = (n << 2) | 1
    return new Uint8Array([v & 0xff, (v >> 8) & 0xff])
  }
  if (n < 1073741824) {
    const v = (n << 2) | 2
    return new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff])
  }
  throw new Error(`SCALE compact encoding not supported for n=${n}`)
}

export function scaleString(s: string): Uint8Array {
  const bytes = new TextEncoder().encode(s)
  return concatBytes(scaleCompact(bytes.length), bytes)
}

export function scaleActorId(address: string): Uint8Array {
  return decodeAddress(address)
}

// ─── Routing constants ────────────────────────────────────────────────────────

// Sails v1.0.0 magic header, prepended to all request payloads
const HEADER = new Uint8Array([0x47, 0x4d, 0x01, 0x10])

// IDL-computed service IDs (as produced by vara-wallet / sails-js from the IDL)
const SERVICE_IDL_IDS: Record<string, string> = {
  Content: '7d0d4dfb0f73a29c',
  Pass: '7a087345765a3790',
  Treasury: '47a8dd7c5aa52256',
}

// On-chain IDs baked into the deployed WASM (from agent/src/sails-payload.ts)
const ON_CHAIN_IDS: Record<string, string> = {
  Content: '9aa74b14277a5770',
  Pass: '1017ab3b5a2c733c',
  Treasury: '5e3679ba33d6775f',
}

const SERVICE_INDEX: Record<string, number> = { Content: 1, Pass: 2, Treasury: 3 }

// Function index = position in IDL service function block (0-based)
const FN_INDEX: Record<string, number> = {
  'Content/GetContent': 0,
  'Content/ListContent': 1,
  'Content/Publish': 2,
  'Content/RequestAccessKey': 3,
  'Pass/CheckAccess': 0,
  'Pass/GetUserPasses': 1,
  'Pass/MintPass': 2,
  'Treasury/ClaimRevenue': 0,
  'Treasury/GetPendingRevenue': 1,
}

// ─── Payload builder ──────────────────────────────────────────────────────────

function patchServiceIds(hex: string): string {
  let out = hex.startsWith('0x') ? hex.slice(2) : hex
  for (const [svc, idlId] of Object.entries(SERVICE_IDL_IDS)) {
    if (out.includes(idlId)) {
      out = out.replaceAll(idlId, ON_CHAIN_IDS[svc])
    }
  }
  return '0x' + out
}

export function buildPayload(
  service: 'Content' | 'Pass' | 'Treasury',
  method: string,
  args: Uint8Array,
): string {
  const key = `${service}/${method}`
  const fnIdx = FN_INDEX[key]
  if (fnIdx === undefined) throw new Error(`Unknown Sails method: ${key}`)

  const methodPrefix = new Uint8Array(4)
  const dv = new DataView(methodPrefix.buffer)
  dv.setUint16(0, fnIdx, true)
  dv.setUint16(2, SERVICE_INDEX[service], true)

  const serviceBytes = hexToBytes(SERVICE_IDL_IDS[service])
  const raw = concatBytes(HEADER, serviceBytes, methodPrefix, args)
  const hex = '0x' + Array.from(raw).map((b) => b.toString(16).padStart(2, '0')).join('')
  return patchServiceIds(hex)
}

// ─── SCALE decoder ────────────────────────────────────────────────────────────

export class ScaleDecoder {
  private buf: Uint8Array
  pos: number

  constructor(payload: string | Uint8Array) {
    this.buf = typeof payload === 'string' ? hexToBytes(payload) : payload
    this.pos = 0
  }

  /**
   * Find and skip past the response routing prefix that the Sails WASM prepends:
   *   [on-chain service ID: 8B] [method prefix: 4B]
   *
   * Checks positions 0 and 4 (with/without a 4-byte header) to avoid false-positive
   * matches against data bytes.
   */
  skipRouting(service: 'Content' | 'Pass' | 'Treasury'): void {
    const hex = Array.from(this.buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const id = ON_CHAIN_IDS[service]

    if (hex.startsWith(id)) {
      // Response starts directly with service ID (no extra header)
      this.pos = 8 + 4
    } else if (hex.slice(8).startsWith(id)) {
      // Response has a 4-byte prefix before the service ID
      this.pos = 4 + 8 + 4
    }
    // If neither matches, leave pos at 0 (best-effort fallback)
  }

  skip(n: number): this {
    this.pos += n
    return this
  }

  readU8(): number {
    return this.buf[this.pos++]
  }

  readU32(): number {
    const v = new DataView(this.buf.buffer, this.buf.byteOffset).getUint32(this.pos, true)
    this.pos += 4
    return v
  }

  readU64(): bigint {
    const v = new DataView(this.buf.buffer, this.buf.byteOffset).getBigUint64(this.pos, true)
    this.pos += 8
    return v
  }

  readU128(): bigint {
    const dv = new DataView(this.buf.buffer, this.buf.byteOffset)
    const lo = dv.getBigUint64(this.pos, true)
    const hi = dv.getBigUint64(this.pos + 8, true)
    this.pos += 16
    return (hi << 64n) | lo
  }

  readBytes(n: number): Uint8Array {
    const slice = this.buf.slice(this.pos, this.pos + n)
    this.pos += n
    return slice
  }

  readCompact(): number {
    const first = this.buf[this.pos]
    const mode = first & 0b11
    if (mode === 0) {
      this.pos += 1
      return first >> 2
    }
    if (mode === 1) {
      const v = this.buf[this.pos] | (this.buf[this.pos + 1] << 8)
      this.pos += 2
      return v >> 2
    }
    if (mode === 2) {
      const v = new DataView(this.buf.buffer, this.buf.byteOffset).getUint32(this.pos, true)
      this.pos += 4
      return v >> 2
    }
    throw new Error('Big-integer SCALE compact not supported')
  }

  readString(): string {
    const len = this.readCompact()
    return new TextDecoder().decode(this.readBytes(len))
  }

  readActorId(): string {
    return (
      '0x' +
      Array.from(this.readBytes(32))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    )
  }

  readBool(): boolean {
    return this.readU8() !== 0
  }

  readOption<T>(inner: () => T): T | null {
    return this.readU8() === 0 ? null : inner()
  }

  readResult<T>(ok: () => T): { value: T } | { error: string } {
    if (this.readU8() === 0) return { value: ok() }
    return { error: this.readString() }
  }

  readVec<T>(item: () => T): T[] {
    const len = this.readCompact()
    return Array.from({ length: len }, item)
  }
}
