'use client'

export type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'

const APP_NAME = 'Tella'

/** True when running on a mobile/tablet device. */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

/**
 * True when a Polkadot-compatible wallet extension has already injected
 * itself into the page (e.g. inside SubWallet / Nova in-app browser).
 */
export function hasInjectedExtension(): boolean {
  if (typeof window === 'undefined') return false
  const injected = (window as unknown as Record<string, unknown>).injectedWeb3
  return typeof injected === 'object' && injected !== null && Object.keys(injected).length > 0
}

export async function connectWallet() {
  if (typeof window === 'undefined') throw new Error('Browser only')
  const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
  const extensions = await web3Enable(APP_NAME)
  if (extensions.length === 0) {
    throw new Error('NO_EXTENSION')
  }
  const accounts = await web3Accounts()
  if (accounts.length === 0) {
    throw new Error('No accounts found. Create an account in your wallet first.')
  }
  return accounts
}

export async function getSigner(address: string) {
  if (typeof window === 'undefined') throw new Error('Browser only')
  const { web3FromAddress } = await import('@polkadot/extension-dapp')
  const injected = await web3FromAddress(address)
  return injected.signer
}
