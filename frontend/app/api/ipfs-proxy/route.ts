import { type NextRequest, NextResponse } from 'next/server'

// Pinata's public gateway now requires auth. Try multiple reliable gateways in order.
const GATEWAYS = [
  process.env.IPFS_GATEWAY ?? null,
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
].filter(Boolean) as string[]

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cid = req.nextUrl.searchParams.get('cid')
  if (!cid || !/^[a-zA-Z0-9]+$/.test(cid)) {
    return NextResponse.json({ error: 'invalid cid' }, { status: 400 })
  }

  for (const gateway of GATEWAYS) {
    try {
      const res = await fetch(`${gateway}/${cid}`, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue
      const body = await res.text()
      return new NextResponse(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } catch {
      // gateway timed out or errored — try next
      continue
    }
  }

  return NextResponse.json(
    { error: 'content unavailable — all IPFS gateways failed' },
    { status: 502 },
  )
}
