'use client'

export type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'

const APP_NAME = 'Tella'

export async function connectWallet() {
  if (typeof window === 'undefined') throw new Error('Browser only')
  const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
  const extensions = await web3Enable(APP_NAME)
  if (extensions.length === 0) {
    throw new Error('No Polkadot wallet extension found. Install Talisman or SubWallet.')
  }
  const accounts = await web3Accounts()
  if (accounts.length === 0) {
    throw new Error('No accounts found. Create an account in your wallet.')
  }
  return accounts
}

export async function getSigner(address: string) {
  if (typeof window === 'undefined') throw new Error('Browser only')
  const { web3FromAddress } = await import('@polkadot/extension-dapp')
  const injected = await web3FromAddress(address)
  return injected.signer
}
