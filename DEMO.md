# Tella — Demo Playbook

## What is Tella?

Tella is an autonomous AI agent that writes and sells encrypted news digests on a blockchain. No middleman. No platform. The agent earns crypto every time someone buys access to its content.

There are three parts:

| Part | What it is |
|---|---|
| **Agent** | Node.js daemon — runs Claude, encrypts content, publishes on-chain |
| **Contract** | Rust WASM on Vara Network — handles payments, access control, revenue |
| **Frontend** | Next.js dApp — browse content, buy passes, decrypt and read |

---

## What the Agent Does (Step by Step)

Every day at **09:00 UTC**, the agent runs this pipeline automatically:

### Step 1 — Research (Claude + web search)
The agent calls Claude Haiku with the `web_search` tool. It searches for the latest AI x Crypto news from the past 7 days, finds the top 3 stories, and writes a 600–900 word analyst digest. No human involved.

The persona is locked in `agent/prompts/persona.md`:
- Tone: confident, direct, no hype — like a seasoned analyst briefing a client
- Format: TL;DR → 3 story sections → "This Week's Signal" (one actionable takeaway)
- Output: JSON with `title`, `description` (paywall teaser), and `body` (full article)

### Step 2 — Encrypt
The agent generates a fresh **AES-256-GCM** key + IV pair. It encrypts the full article body. The ciphertext (not the key) goes to IPFS. The key stays with the agent temporarily.

### Step 3 — Pin to IPFS (Pinata)
The encrypted ciphertext is pinned to IPFS via Pinata. The returned CID is a permanent, decentralised address for the encrypted blob. Anyone can fetch it, but without the key it's unreadable.

### Step 4 — Publish On-Chain
The agent calls `Content/Publish` on the Vara smart contract with:
- `title` — the headline
- `description` — the teaser (visible to everyone, no paywall)
- `ipfs_cid` — where the encrypted content lives
- `price` — in VARA (default: 1 VARA = 1,000,000,000,000 units)
- `encrypted_aes_key` — `"key_hex:iv_hex"` stored on-chain, gated by the contract
- `content_type` — `Newsletter` or `Article`

The contract assigns it a sequential ID (1, 2, 3...) and emits a `ContentPublished` event.

### Step 5 — Announce (Vara Agent Network)
If configured, the agent posts a message to the Vara Agent Network chat:
> "New digest live! #1: 'AI x Crypto Weekly #21...' — available now on the content platform."

### Step 6 — Watch for New Subscribers
Concurrently, the agent listens for `PassMinted` events. Every time someone buys a pass, it posts a welcome message:
> "New subscriber! 0x1234...abcd just unlocked content #1. Stay sharp — new digest drops every day at 09:00 UTC."

---

## The Money Flow

```
Reader pays price in VARA
        |
        v
Contract: MintPass(content_id, value=price)
        |
        |-- Verifies value >= price
        |-- Records pass: (content_id, reader_address) -> PassInfo
        |-- Accrues price to creator's pending revenue
        |
        v
Creator calls Treasury/ClaimRevenue()
        |
        v
Revenue cleared, creator receives VARA
```

### For the reader:
1. Browse `/browse` — see all digests (title, description, price, reader count)
2. Click a digest — see the paywall
3. Connect Polkadot.js / Talisman wallet
4. Click "Mint Pass" — sends VARA to the contract
5. Contract verifies payment and records the pass
6. Reader can now call `Content/RequestAccessKey` — contract checks the pass and returns the AES key
7. Browser decrypts the IPFS ciphertext client-side — full article appears

### For the creator (you):
- Revenue accumulates in the contract as each pass is minted
- Call `Treasury/ClaimRevenue()` any time to sweep all pending VARA to your wallet
- No per-transaction fees to you — the contract handles everything

### Pricing:
- Default price: **1 VARA** per digest (`DAILY_DIGEST_PRICE=1000000000000` in `agent/.env.local`)
- Set any price you want — 0.1 VARA, 5 VARA, 100 VARA
- Price is set per piece of content at publish time and cannot be changed after

---

## Why It's Useful

**For creators:**
- Fully autonomous — write and publish daily without lifting a finger
- No platform risk — content lives on IPFS, revenue logic lives on-chain
- No subscription management — the contract handles who has access
- Instant global payments — any Vara wallet can buy, no KYC, no geography restrictions
- Creator always has free access to their own content

**For readers:**
- Pay once per piece — no recurring subscription to cancel
- Content is verifiably on-chain — you can always check the pass exists
- Decryption happens in the browser — the key never leaves the contract without a valid pass
- Passes are permanent — your access doesn't expire

**For the demo:**
- The agent is live on Vara testnet right now with content already published
- Full end-to-end flow works: browse → buy → decrypt
- Contract is open source, auditable, 300 lines of Rust

---

## How to Tweak It

### Change the topic / persona
Edit `agent/prompts/persona.md`. This is the Claude system prompt. You can make the agent write about:
- DeFi protocols only
- Solana ecosystem news
- AI infrastructure funding rounds
- Regulatory developments
- Any niche you want

The output format (JSON with title/description/body) must stay the same, but everything else is fair game.

### Change the price
In `agent/.env.local`:
```
DAILY_DIGEST_PRICE=5000000000000   # 5 VARA
```
Restart the agent. New digests will use the new price. Old digests keep their original price.

### Change the schedule
In `agent/src/index.ts`, line 89:
```ts
cron.schedule('0 9 * * *', ...)   // currently: 09:00 UTC daily
cron.schedule('0 */6 * * *', ...) // every 6 hours
cron.schedule('0 9 * * 1', ...)   // every Monday
```

### Change the AI model
In `agent/.env.local`:
```
ANTHROPIC_MODEL=claude-opus-4-6    # deepest research, higher cost
ANTHROPIC_MODEL=claude-haiku-4-5   # default — fast, cheap
ANTHROPIC_MODEL=claude-sonnet-4-6  # middle ground
```

### Publish manually (one-shot)
```bash
cd agent
RUN_NOW=true RUN_ONCE=true npm run run-once:now
```

### Dry run (generate content, skip chain + IPFS)
```bash
cd agent
DRY_RUN=true npm run dev:dry
```
Useful for testing the Claude output without spending VARA or Pinata credits.

### Add a deep-dive article
The agent has a `generateDeepDive(topic)` function in `agent/src/claude.ts`. You can call it from a script to publish a long-form (1000–1500 word) article on any specific topic, then call `publishContent()` with `contentType: 'Article'`.

---

## Running the Full Demo

### Prerequisites
- Vara testnet wallet with VARA for gas
- `vara-wallet` CLI installed and `agent-wallet` account configured
- Pinata account with API keys
- Anthropic API key
- Contract deployed (`scripts/deploy.sh`)

### Live contract (already deployed)
```
Program ID: 0x3e5d05290802f0139f9f04b71fe3ba975a758c4e09ea2c7de75d258a5a63fafb
Network:    Vara testnet
Content #1: AI x Crypto Weekly #21 — Infrastructure Wars
IPFS:       bafkreiehww5jxo57vwjyzsovegqak4sjw5kv5u4i5oskq746ikbcjkcxm4
```

### Start the frontend
```bash
cd frontend
npm run dev
# open http://localhost:3000
```

### Demo script (show to audience)
1. Open `/browse` — show content #1 in the list with title, price, reader count
2. Click the card — show the paywall page with title, description visible but body locked
3. Connect wallet (Polkadot.js or Talisman)
4. Click "Mint Pass" — confirm transaction in wallet
5. After confirmation, click "Read" — browser fetches the IPFS ciphertext, calls `RequestAccessKey`, decrypts in browser
6. Full article appears

### Show the agent running
```bash
cd agent
npm run dev        # starts the daemon, waits for 09:00 UTC
# or force-run now:
RUN_NOW=true npm run dev
```
Watch the logs:
```
[agent] Starting digest generation...
[agent] Generated: "AI x Crypto Weekly #21 — ..."
[agent] Pinned to IPFS: bafkrei...
[vara] message sent: 0xca4c...
[agent] Published on-chain: content #2
```

---

## Architecture in One Diagram

```
                         AGENT (runs 09:00 UTC daily)
                                |
                    Claude Haiku + web_search
                                |
                         writes digest JSON
                                |
                    AES-256-GCM encrypt body
                                |
              +-----------------+------------------+
              |                                    |
         encrypted blob                    key_hex:iv_hex
              |                                    |
         Pinata IPFS                       Vara Contract
         (public CID)                  Content/Publish(...)
                                               |
                                     emits ContentPublished


                         READER (browser)
                                |
               browses /browse  ->  listContent() query
               clicks digest    ->  getContent() query
               connects wallet  ->  Polkadot.js / Talisman
               mints pass       ->  Pass/MintPass(content_id, value=price)
                                       |
                                   creator revenue += price
                                |
               requests key     ->  Content/RequestAccessKey(content_id)
                                       |
                                   contract checks: has pass OR is creator
                                   returns: "key_hex:iv_hex"
                                |
               browser decrypts ->  AES-256-GCM decrypt(IPFS blob, key, iv)
               reads article    ->  full markdown rendered


                         CREATOR (you)
                                |
               checks revenue   ->  Treasury/GetPendingRevenue(address)
               claims revenue   ->  Treasury/ClaimRevenue()
                                       |
                                   VARA sent to wallet
```
