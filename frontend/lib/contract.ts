'use client'

/**
 * Contract interaction layer for the ContentAgent Sails program.
 *
 * NOTE: Payload encoding here uses raw JSON hex as a placeholder.
 * After deployment, replace with the sails-js generated client for
 * proper SCALE encoding via the program IDL.
 */

import type { HexString } from '@gear-js/api'
import { getGearApi } from './gear-api'
import { getSigner } from './wallet'

const PROGRAM_ID = (process.env.NEXT_PUBLIC_PROGRAM_ID ?? '') as HexString

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface ContentMeta {
  id: string
  creator: string
  title: string
  description: string
  price: string
  pass_count: number
  content_type: 'Article' | 'Newsletter'
  published_at: number
  ipfs_cid?: string
}

export interface PassInfo {
  content_id: string
  holder: string
  minted_at: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function encodePayloadHex(service: string, method: string, args: unknown[]): string {
  const json = JSON.stringify({ [service]: { [method]: args } })
  return '0x' + Buffer.from(json, 'utf8').toString('hex')
}

function decodeReplyPayload(payload: unknown): unknown {
  if (typeof payload === 'string' && payload.startsWith('0x')) {
    try {
      return JSON.parse(Buffer.from(payload.slice(2), 'hex').toString('utf8'))
    } catch {
      return payload
    }
  }
  return payload
}

async function calculateReply<T>(service: string, method: string, args: unknown[]): Promise<T> {
  const api = await getGearApi()
  const payload = encodePayloadHex(service, method, args)
  // origin can be any valid address for read-only simulation
  const origin = '0x0000000000000000000000000000000000000000000000000000000000000001'
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
  return decodeReplyPayload(result.payload) as T
}

async function sendTx(
  senderAddress: string,
  service: string,
  method: string,
  args: unknown[],
  value = 0n,
): Promise<void> {
  const api = await getGearApi()
  const signer = await getSigner(senderAddress)
  const payload = encodePayloadHex(service, method, args)

  const extrinsic = await api.message.send(
    {
      destination: PROGRAM_ID,
      payload,
      gasLimit: 100_000_000_000,
      value: value.toString(),
    },
  )

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

// ---------------------------------------------------------------------------
// Read queries
// ---------------------------------------------------------------------------

export async function listContent(offset = 0, limit = 20): Promise<ContentMeta[]> {
  return calculateReply<ContentMeta[]>('Content', 'ListContent', [offset, limit])
}

export async function getContent(id: string): Promise<ContentMeta | null> {
  return calculateReply<ContentMeta | null>('Content', 'GetContent', [id])
}

export async function checkAccess(contentId: string, holder: string): Promise<boolean> {
  return calculateReply<boolean>('Pass', 'CheckAccess', [contentId, holder])
}

export async function getCreatorRevenue(creator: string): Promise<string> {
  return calculateReply<string>('Treasury', 'GetPendingRevenue', [creator])
}

export async function getUserPasses(holder: string): Promise<PassInfo[]> {
  return calculateReply<PassInfo[]>('Pass', 'GetUserPasses', [holder])
}

// ---------------------------------------------------------------------------
// Write commands
// ---------------------------------------------------------------------------

export async function mintPass(
  senderAddress: string,
  contentId: string,
  price: bigint,
): Promise<void> {
  return sendTx(senderAddress, 'Pass', 'MintPass', [contentId], price)
}

export async function requestAccessKey(
  senderAddress: string,
  contentId: string,
): Promise<string> {
  await sendTx(senderAddress, 'Content', 'RequestAccessKey', [contentId])
  return calculateReply<string>('Content', 'RequestAccessKey', [contentId])
}

export async function claimRevenue(senderAddress: string): Promise<void> {
  return sendTx(senderAddress, 'Treasury', 'ClaimRevenue', [])
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
  return sendTx(senderAddress, 'Content', 'Publish', [
    params.title,
    params.description,
    params.ipfsCid,
    params.price.toString(),
    params.encryptedAesKey,
    { [params.contentType]: null },
  ])
}
