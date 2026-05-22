import PinataSDK from '@pinata/sdk'
import { Readable } from 'stream'

let pinata: InstanceType<typeof PinataSDK> | null = null

function getClient(): InstanceType<typeof PinataSDK> {
  if (!pinata) {
    const apiKey = process.env.PINATA_API_KEY
    const secretKey = process.env.PINATA_SECRET_KEY
    if (!apiKey || !secretKey) {
      throw new Error('PINATA_API_KEY and PINATA_SECRET_KEY must be set')
    }
    pinata = new PinataSDK(apiKey, secretKey)
  }
  return pinata
}

export interface PinMetadata {
  name: string
  keyvalues?: Record<string, string>
}

/**
 * Pin content (already-encrypted ciphertext string) to IPFS via Pinata.
 * Returns the IPFS CID.
 */
export async function pinContent(content: string, metadata: PinMetadata): Promise<string> {
  const client = getClient()
  const stream = Readable.from([content])

  const result = await client.pinFileToIPFS(stream, {
    pinataMetadata: {
      name: metadata.name,
      keyvalues: metadata.keyvalues ?? {},
    },
    pinataOptions: { cidVersion: 1 },
  })

  return result.IpfsHash
}

/**
 * Fetch raw content from IPFS via Pinata gateway.
 * Returns the raw string (still encrypted — caller must decrypt).
 */
export async function fetchContent(cid: string): Promise<string> {
  const gateway = process.env.IPFS_GATEWAY ?? 'https://gateway.pinata.cloud/ipfs'
  const url = `${gateway}/${cid}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.status} ${response.statusText}`)
  }
  return response.text()
}
