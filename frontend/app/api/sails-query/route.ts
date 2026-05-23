import { execFile } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { promisify } from 'util'
import { patchEncodedPayload } from '@/lib/sails-payload'
import { parseU128FromReply } from '@/lib/amount'

const exec = promisify(execFile)

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ?? ''
const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? 'testnet'
const IDL_PATH = path.join(process.cwd(), 'lib/content_agent.idl')

export async function POST(req: Request) {
  if (!PROGRAM_ID) {
    return Response.json({ error: 'NEXT_PUBLIC_PROGRAM_ID is not set' }, { status: 500 })
  }
  if (!existsSync(IDL_PATH)) {
    return Response.json({ error: 'content_agent.idl missing in frontend/lib' }, { status: 500 })
  }

  let body: { method?: string; args?: unknown[]; origin?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { method, args = [], origin } = body
  const originAddress =
    origin ??
    (typeof args[0] === 'string' ? args[0] : null) ??
    '0x0000000000000000000000000000000000000000000000000000000000000001'
  if (!method || typeof method !== 'string') {
    return Response.json({ error: 'method is required (e.g. Treasury/GetPendingRevenue)' }, { status: 400 })
  }

  try {
    const { stdout: dryStdout } = await exec('vara-wallet', [
      '--network',
      NETWORK,
      '--json',
      'call',
      PROGRAM_ID,
      method,
      '--args',
      JSON.stringify(args),
      '--idl',
      IDL_PATH,
      '--dry-run',
    ])

    const encoded = patchEncodedPayload(
      (JSON.parse(dryStdout) as { encodedPayload: string }).encodedPayload,
    )

    const { stdout: replyStdout } = await exec('vara-wallet', [
      '--network',
      NETWORK,
      '--json',
      'message',
      'calculate-reply',
      PROGRAM_ID,
      '--payload',
      encoded,
      '--origin',
      originAddress,
    ])

    const result = JSON.parse(replyStdout) as { payload?: string }
    const value = parseU128FromReply(result.payload ?? '0x')

    return Response.json({ payload: result.payload, value: value.toString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 502 })
  }
}
