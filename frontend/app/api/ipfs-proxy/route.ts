import { type NextRequest, NextResponse } from 'next/server'

const GATEWAY = process.env.IPFS_GATEWAY ?? 'https://gateway.pinata.cloud/ipfs'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cid = req.nextUrl.searchParams.get('cid')
  if (!cid || !/^[a-zA-Z0-9]+$/.test(cid)) {
    return NextResponse.json({ error: 'invalid cid' }, { status: 400 })
  }

  const res = await fetch(`${GATEWAY}/${cid}`, {
    headers: { Accept: 'text/plain' },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'upstream fetch failed' },
      { status: res.status },
    )
  }

  const body = await res.text()
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
