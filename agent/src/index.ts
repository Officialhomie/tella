/**
 * Vara Content Agent — AI x Crypto News Analyst
 *
 * Runs two concurrent loops:
 * 1. Cron: generates + publishes a new digest daily at 09:00 UTC
 * 2. Event listener: watches PassMinted events and sends welcome messages
 *
 * Set DRY_RUN=true to generate content without touching the chain or IPFS.
 * Set RUN_ONCE=true to run one production pipeline and exit (demo / smoke test).
 */

import './load-env.ts' // loads agent/.env.local
import cron from 'node-cron'
import { generateNewsDigest } from './claude.ts'
import { encrypt, generateKey, encodeKeyString } from './encryption.ts'
import { pinContent } from './ipfs.ts'
import { publishContent, postToAgentChat } from './vara.ts'
import { startEventListener } from './listener.ts'

const DRY_RUN = process.env.DRY_RUN === 'true'
const RUN_ONCE = process.env.RUN_ONCE === 'true'
const DAILY_DIGEST_PRICE = process.env.DAILY_DIGEST_PRICE ?? '1000000000000' // 1 VARA

function assertProductionEnv(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required')
  }
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    throw new Error('PINATA_API_KEY and PINATA_SECRET_KEY are required for production runs')
  }
  if (!process.env.PROGRAM_ID) {
    throw new Error('PROGRAM_ID is required — deploy the contract first (see scripts/deploy.sh)')
  }
}

async function runDigestPipeline(): Promise<void> {
  console.log('[agent] Starting digest generation...')

  const article = await generateNewsDigest()
  console.log(`[agent] Generated: "${article.title}"`)

  const aesKey = generateKey()
  const ciphertext = encrypt(article.body, aesKey.key, aesKey.iv)
  const keyString = encodeKeyString(aesKey)

  if (DRY_RUN) {
    console.log('[agent] DRY_RUN — skipping IPFS pin and chain publish')
    console.log('[agent] Article preview:', article.description)
    return
  }

  const cid = await pinContent(ciphertext, {
    name: article.title,
    keyvalues: { type: 'newsletter', agent: 'ai-crypto-analyst' },
  })
  console.log(`[agent] Pinned to IPFS: ${cid}`)

  const contentId = await publishContent({
    title: article.title,
    description: article.description,
    ipfsCid: cid,
    price: DAILY_DIGEST_PRICE,
    encryptedAesKey: keyString,
    contentType: 'Newsletter',
  })
  console.log(`[agent] Published on-chain: content #${contentId}`)

  await postToAgentChat(
    `New digest live! #${contentId}: "${article.title}" — ` +
    `available now on the content platform.`,
  ).catch((err) => console.error('[agent] chat post failed:', err))
}

async function main(): Promise<void> {
  console.log('[agent] Vara Content Agent starting...')
  console.log(`[agent] Network: ${process.env.NETWORK ?? 'testnet'}`)
  console.log(`[agent] Dry run: ${DRY_RUN}`)
  console.log(`[agent] Run once: ${RUN_ONCE}`)

  if (RUN_ONCE) {
    if (DRY_RUN) throw new Error('RUN_ONCE is for production — unset DRY_RUN')
    assertProductionEnv()
    await runDigestPipeline()
    console.log('[agent] RUN_ONCE complete — exiting')
    return
  }

  // Daily digest at 09:00 UTC
  cron.schedule('0 9 * * *', async () => {
    try {
      await runDigestPipeline()
    } catch (err) {
      console.error('[agent] Digest pipeline failed:', err)
    }
  })

  // Start event listener (non-blocking)
  if (!DRY_RUN) {
    startEventListener().catch((err) =>
      console.error('[agent] Event listener failed:', err),
    )
  }

  // Run immediately on startup for testing
  if (process.env.RUN_NOW === 'true') {
    await runDigestPipeline()
  }

  console.log('[agent] Scheduled. Waiting for 09:00 UTC...')
}

main().catch((err) => {
  console.error('[agent] Fatal error:', err)
  process.exit(1)
})
