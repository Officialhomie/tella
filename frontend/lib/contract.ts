'use client'

/**
 * Contract interaction layer for the Tella (ContentAgent) Sails program.
 * Uses proper SCALE encoding via lib/scale.ts.
 */

import type { HexString } from '@gear-js/api'
import { decodeAddress } from '@polkadot/util-crypto'
import { getGearApi } from './gear-api'
import { getSigner } from './wallet'
import {
  buildPayload,
  ScaleDecoder,
  concatBytes,
  scaleU32,
  scaleU64,
  scaleU128,
  scaleString,
  scaleActorId,
} from './scale'

const PROGRAM_ID = (process.env.NEXT_PUBLIC_PROGRAM_ID ?? '') as HexString

// Dummy origin for queries that don't depend on msg::source()
const DUMMY_ORIGIN = '0x0000000000000000000000000000000000000000000000000000000000000001'

function addressToHex(address: string): string {
  const bytes = decodeAddress(address)
  return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toPayloadHex(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof (raw as { toHex?: () => string }).toHex === 'function') {
    return (raw as { toHex: () => string }).toHex()
  }
  return String(raw)
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ContentMeta {
  id: string
  creator: string
  title: string
  description: string
  ipfs_cid: string
  price: string
  pass_count: number
  content_type: 'Article' | 'Newsletter'
  published_at: number
}

export interface PassInfo {
  content_id: string
  holder: string
  minted_at: number
}

// ─── SCALE struct decoders ────────────────────────────────────────────────────

function decodeContentMeta(d: ScaleDecoder): ContentMeta {
  return {
    id: d.readU64().toString(),
    creator: d.readActorId(),
    title: d.readString(),
    description: d.readString(),
    ipfs_cid: d.readString(),
    price: d.readU128().toString(),
    pass_count: d.readU32(),
    content_type: d.readU8() === 0 ? 'Article' : 'Newsletter',
    published_at: d.readU32(),
  }
}

function decodePassInfo(d: ScaleDecoder): PassInfo {
  return {
    content_id: d.readU64().toString(),
    holder: d.readActorId(),
    minted_at: d.readU32(),
  }
}

// ─── Query helper ─────────────────────────────────────────────────────────────

async function query<T>(
  service: 'Content' | 'Pass' | 'Treasury',
  method: string,
  args: Uint8Array,
  decode: (d: ScaleDecoder) => T,
  origin = DUMMY_ORIGIN,
): Promise<T> {
  const api = await getGearApi()
  const payload = buildPayload(service, method, args)

  const result = await api.message.calculateReply({
    origin,
    destination: PROGRAM_ID,
    payload,
    gasLimit: 50_000_000_000,
    value: 0,
  })

  if (!result.code.isSuccess) {
    throw new Error(`Query failed: ${result.code.toString()}`)
  }

  const hex = toPayloadHex(result.payload)
  const d = new ScaleDecoder(hex)
  d.skipRouting(service)
  return decode(d)
}

// ─── Write helper ─────────────────────────────────────────────────────────────

async function sendTx(
  senderAddress: string,
  service: 'Content' | 'Pass' | 'Treasury',
  method: string,
  args: Uint8Array,
  value = 0n,
): Promise<void> {
  const api = await getGearApi()
  const signer = await getSigner(senderAddress)
  const payload = buildPayload(service, method, args)

  const extrinsic = await api.message.send({
    destination: PROGRAM_ID,
    payload,
    gasLimit: 100_000_000_000,
    value: value.toString(),
  })

  await new Promise<void>((resolve, reject) => {
    extrinsic
      .signAndSend(senderAddress, { signer }, ({ status, events }) => {
        if (status.isFinalized) resolve()
        events.forEach(({ event }) => {
          if (api.events.system.ExtrinsicFailed.is(event)) {
            reject(new Error('Transaction failed on-chain'))
          }
        })
      })
      .catch(reject)
  })
}

// ─── Read queries ─────────────────────────────────────────────────────────────

export async function listContent(offset = 0, limit = 20): Promise<ContentMeta[]> {
  const args = concatBytes(scaleU32(offset), scaleU32(limit))
  return query('Content', 'ListContent', args, (d) => d.readVec(() => decodeContentMeta(d)))
}

export async function getContent(id: string): Promise<ContentMeta | null> {
  const args = scaleU64(BigInt(id))
  return query('Content', 'GetContent', args, (d) => d.readOption(() => decodeContentMeta(d)))
}

export async function checkAccess(contentId: string, holder: string): Promise<boolean> {
  const args = concatBytes(scaleU64(BigInt(contentId)), scaleActorId(holder))
  return query('Pass', 'CheckAccess', args, (d) => d.readBool())
}

export async function getCreatorRevenue(creator: string): Promise<string> {
  const args = scaleActorId(creator)
  return query('Treasury', 'GetPendingRevenue', args, (d) => d.readU128().toString())
}

export async function getUserPasses(holder: string): Promise<PassInfo[]> {
  const args = scaleActorId(holder)
  return query('Pass', 'GetUserPasses', args, (d) => d.readVec(() => decodePassInfo(d)))
}

// ─── Write commands ───────────────────────────────────────────────────────────

export async function mintPass(
  senderAddress: string,
  contentId: string,
  price: bigint,
): Promise<void> {
  const args = scaleU64(BigInt(contentId))
  return sendTx(senderAddress, 'Pass', 'MintPass', args, price)
}

export async function requestAccessKey(
  senderAddress: string,
  contentId: string,
): Promise<string> {
  // Use the wallet address as origin so the contract can verify pass ownership.
  const origin = addressToHex(senderAddress)
  const args = scaleU64(BigInt(contentId))
  const res = await query(
    'Content',
    'RequestAccessKey',
    args,
    (d) => d.readResult(() => d.readString()),
    origin,
  )
  if ('error' in res) throw new Error(res.error)
  return res.value
}

export async function claimRevenue(senderAddress: string): Promise<void> {
  return sendTx(senderAddress, 'Treasury', 'ClaimRevenue', new Uint8Array(0))
}

export async function publishContent(
  senderAddress: string,
  params: {
    title: string
    description: string
    ipfsCid: string
    price: bigint
    encryptedAesKey: string
    contentType: 'Article' | 'Newsletter'
  },
): Promise<void> {
  const contentTypeBytes = new Uint8Array([params.contentType === 'Article' ? 0 : 1])
  const args = concatBytes(
    scaleString(params.title),
    scaleString(params.description),
    scaleString(params.ipfsCid),
    scaleU128(params.price),
    scaleString(params.encryptedAesKey),
    contentTypeBytes,
  )
  return sendTx(senderAddress, 'Content', 'Publish', args)
}
