'use client'

const TESTNET_RPC = 'wss://testnet.vara.network'
const MAINNET_RPC = 'wss://rpc.vara.network'

const rpc =
  process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? MAINNET_RPC : TESTNET_RPC

// Lazy singleton — only initialised in the browser
let apiInstance: unknown = null

export async function getGearApi() {
  // Guard: server environment has no WebSocket
  if (typeof window === 'undefined') {
    throw new Error('GearApi is only available in the browser')
  }
  if (apiInstance) return apiInstance as Awaited<ReturnType<typeof createApi>>
  apiInstance = await createApi()
  return apiInstance as Awaited<ReturnType<typeof createApi>>
}

async function createApi() {
  const { GearApi } = await import('@gear-js/api')
  return GearApi.create({ providerAddress: rpc })
}

export async function disconnectApi(): Promise<void> {
  if (apiInstance) {
    const api = apiInstance as { disconnect: () => Promise<void> }
    await api.disconnect()
    apiInstance = null
  }
}
