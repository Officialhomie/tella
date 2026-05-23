/**
 * vara-wallet / sails-js compute different interface_id hashes than sails-rs embeds
 * in the WASM IDL. Encode with wallet-patched IDL, then swap IDs to on-chain values.
 */
const INTERFACE_ID_ON_CHAIN: Record<string, string> = {
  '7d0d4dfb0f73a29c': '9aa74b14277a5770', // Content
  '7a087345765a3790': '1017ab3b5a2c733c', // Pass
  '47a8dd7c5aa52256': '5e3679ba33d6775f', // Treasury
}

export function patchEncodedPayload(hex: string): string {
  let out = hex.startsWith('0x') ? hex : `0x${hex}`
  const body = out.slice(2)
  for (const [from, to] of Object.entries(INTERFACE_ID_ON_CHAIN)) {
    if (!body.includes(from)) continue
    out = `0x${body.replaceAll(from, to)}`
  }
  return out
}
