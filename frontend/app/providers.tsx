'use client'

import { createContext, useContext, useState } from 'react'
import type { InjectedAccountWithMeta } from '@/lib/wallet'

type WalletCtx = {
  wallet: InjectedAccountWithMeta | null
  setWallet: (w: InjectedAccountWithMeta | null) => void
}

const WalletContext = createContext<WalletCtx>({ wallet: null, setWallet: () => {} })

export function useWallet() {
  return useContext(WalletContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<InjectedAccountWithMeta | null>(null)
  return (
    <WalletContext.Provider value={{ wallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  )
}
