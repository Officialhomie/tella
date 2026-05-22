import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { patchEncodedPayload } from './sails-payload.ts'

const exec = promisify(execFile)

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_IDL = join(__dirname, '../content_agent.idl')

const NETWORK = process.env.NETWORK ?? 'testnet'
const ACCOUNT = process.env.VARA_ACCOUNT ?? 'agent-wallet'
const PROGRAM_ID = process.env.PROGRAM_ID ?? ''
const CONTRACT_IDL = process.env.CONTRACT_IDL ?? DEFAULT_IDL
const AGENT_NETWORK_PID =
  process.env.AGENT_NETWORK_PID ??
  '0x19f27f4c906a5ac230be82d907850d44c7a7fff1b4c6903f62e78e09e0b353f3'

function walletArgs(extra: string[]): string[] {
  return ['--account', ACCOUNT, '--network', NETWORK, '--json', ...extra]
}

async function varaWallet(args: string[], timeout = 120_000): Promise<string> {
  const { stdout, stderr } = await exec('vara-wallet', args, { timeout })
  if (stderr) console.error('[vara-wallet stderr]', stderr)
  return stdout.trim()
}

interface WatchEvent {
  event: string
  details?: { replyTo?: string; code?: string }
  payload?: string
}

async function sailsCall(method: string, args: unknown[], opts?: { value?: string }): Promise<unknown> {
  if (!PROGRAM_ID) throw new Error('PROGRAM_ID env var not set')
  if (!existsSync(CONTRACT_IDL)) {
    throw new Error(
      `CONTRACT_IDL not found at ${CONTRACT_IDL}. Deploy the contract and run scripts/fix-idl-for-wallet.sh`,
    )
  }

  const dryRun = await varaWallet(
    walletArgs([
      'call',
      PROGRAM_ID,
      method,
      '--args',
      JSON.stringify(args),
      '--idl',
      CONTRACT_IDL,
      '--dry-run',
      ...(opts?.value ? ['--value', opts.value] : []),
    ]),
  )

  const encoded = patchEncodedPayload(
    (JSON.parse(dryRun) as { encodedPayload: string }).encodedPayload,
  )

  // Start watching for the reply BEFORE sending to avoid the race condition
  // where the program processes the message in the same block as the send.
  const watcher = execFile('vara-wallet', ['--network', NETWORK, 'watch', PROGRAM_ID, '--json'])
  watcher.stderr?.on('data', () => {}) // suppress stderr

  const replyPayload = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.kill()
      reject(new Error('REPLY_TIMEOUT: no reply received within 120s'))
    }, 120_000)

    let messageId = ''
    let lineBuf = ''
    const pending: WatchEvent[] = [] // events buffered before messageId is known
    let settled = false

    const tryResolve = (event: WatchEvent): boolean => {
      if (
        event.event === 'UserMessageSent' &&
        event.details?.replyTo === messageId
      ) {
        if (!settled) {
          settled = true
          clearTimeout(timeout)
          watcher.kill()
          resolve(event.payload ?? '0x')
        }
        return true
      }
      return false
    }

    watcher.stdout?.setEncoding('utf8')
    watcher.stdout?.on('data', (chunk: string) => {
      lineBuf += chunk
      const lines = lineBuf.split('\n')
      lineBuf = lines.pop() ?? '' // keep the trailing incomplete fragment
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line) as WatchEvent
          if (messageId) {
            tryResolve(event)
          } else {
            pending.push(event)
          }
        } catch {
          // incomplete JSON — wait for more
        }
      }
    })

    // Send the message; once we have the messageId, scan the buffered events
    varaWallet(
      walletArgs([
        'message', 'send', PROGRAM_ID,
        '--payload', encoded,
        '--gas-limit', '5000000000',
        ...(opts?.value ? ['--value', opts.value] : []),
      ]),
    )
      .then((sent) => {
        const parsed = JSON.parse(sent) as { messageId: string }
        messageId = parsed.messageId
        console.log(`[vara] message sent: ${messageId}`)
        // Replay buffered events — reply may have arrived before messageId was set
        for (const event of pending) {
          if (tryResolve(event)) return
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        watcher.kill()
        reject(err)
      })
  })

  // Decode u64 reply from payload hex (Sails appends service routing prefix).
  // SCALE encodes u64 as 8 bytes little-endian; reverse before converting to BigInt.
  if (replyPayload.startsWith('0x')) {
    const hex = replyPayload.slice(2)
    const dataHex = hex.slice(-16)
    if (dataHex.length === 16) {
      const leBytes = dataHex.match(/../g)!.reverse().join('')
      return BigInt(`0x${leBytes}`).toString()
    }
  }

  return replyPayload
}

export interface PublishParams {
  title: string
  description: string
  ipfsCid: string
  price: string
  encryptedAesKey: string
  contentType: 'Article' | 'Newsletter'
}

/**
 * Call Content/Publish on-chain. Returns content_id from the contract.
 */
export async function publishContent(params: PublishParams): Promise<string> {
  const reply = await sailsCall('Content/Publish', [
    params.title,
    params.description,
    params.ipfsCid,
    params.price,
    params.encryptedAesKey,
    { [params.contentType]: null },
  ])
  return String(reply)
}

export async function subscribeToEvents(
  onEvent: (event: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  if (!PROGRAM_ID) throw new Error('PROGRAM_ID env var not set')

  console.log(`[vara] Subscribing to events on ${PROGRAM_ID} (${NETWORK})`)

  const child = execFile('vara-wallet', ['--network', NETWORK, 'watch', PROGRAM_ID, '--json'])

  child.stdout?.setEncoding('utf8')
  child.stdout?.on('data', (chunk: string) => {
    for (const line of chunk.split('\n').filter(Boolean)) {
      try {
        const event = JSON.parse(line) as Record<string, unknown>
        onEvent(event).catch((err) => console.error('[vara] event handler error', err))
      } catch {
        // ignore non-JSON lines
      }
    }
  })

  child.on('error', (err) => console.error('[vara] subscription error', err))
  child.on('close', (code) => console.log(`[vara] subscription closed (code ${code})`))
}

export async function postToAgentChat(message: string): Promise<void> {
  const idlPath = process.env.AGENT_NETWORK_IDL ?? ''
  if (!idlPath || !existsSync(idlPath)) {
    console.warn('[vara] AGENT_NETWORK_IDL not set or missing — skipping chat post')
    return
  }

  await varaWallet(
    walletArgs([
      'call',
      AGENT_NETWORK_PID,
      'Chat/Post',
      '--args',
      JSON.stringify([message, null, [], null]),
      '--idl',
      idlPath,
    ]),
  )
}

export async function registerOnAgentNetwork(handle: string, githubUrl: string): Promise<void> {
  const idlPath = process.env.AGENT_NETWORK_IDL ?? ''
  if (!idlPath) throw new Error('AGENT_NETWORK_IDL must be set for registration')

  await varaWallet(
    walletArgs([
      'call',
      AGENT_NETWORK_PID,
      'Registry/RegisterParticipant',
      '--args',
      JSON.stringify([handle, githubUrl]),
      '--idl',
      idlPath,
    ]),
  )
  console.log(`[vara] Registered participant: ${handle}`)
}
