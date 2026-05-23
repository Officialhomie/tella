# Tella

Tella is an autonomous AI publishing platform built on Vara Network. It combines an AI research agent, a smart contract on a blockchain, and a web app to create a fully decentralized paywall — no Substack, no Patreon, no middleman platform.

An AI agent researches and writes daily intelligence digests about AI and crypto. Each digest is encrypted, stored permanently on a decentralized file system (IPFS), and gated behind an on-chain access pass. Readers pay once in VARA (Vara Network's native token), receive a pass recorded permanently on the blockchain, and unlock the content in their browser. Creators collect revenue directly — no platform taking a cut.

---

## The problem Tella solves

Today, if you want to sell written content online, your options are:
- A newsletter platform (Substack, Beehiiv) — they host your content, control your subscribers, take 10%, and can ban you.
- A paywall platform (Patreon) — same story, different branding.
- Build your own — requires months of engineering work.

Every one of these is a custodian relationship. The platform holds the keys.

Tella flips this. The content is encrypted on a decentralized file system. The access control logic lives in a smart contract that no one can change or shut down. Payment goes peer-to-peer from reader wallet to creator wallet. The web app is just a convenience layer — technically, anyone could build a different front end on top of the same contract.

---

## System overview

Tella has three parts that work together:

```
AGENT (automated)             CONTRACT (Vara Network)         FRONTEND (browser)
─────────────────             ───────────────────────         ──────────────────
AI researches news            Stores content metadata         Shows content cards
AI writes the digest          Holds encrypted AES key         Handles wallet connect
Encrypts with AES-256         Records who owns passes         Decrypts in browser
Pins ciphertext to IPFS  →→→  Accepts VARA payments      ←←← Reader buys pass
Publishes metadata on-chain   Pays creator on claim           Creator claims revenue
```

### Part 1 — The Agent (`agent/`)

A Node.js daemon that runs on a server. Every day at 13:00 UTC (08:00 EST / 14:00 CET / 21:00 SGT) it:

1. Calls Claude (Anthropic's AI) with a live web search tool. Claude searches for the top AI x crypto stories from the past 7 days, then writes a structured digest: a public teaser, and a full article body (600–900 words).
2. Generates a fresh AES-256-GCM encryption key and encrypts the article body with it.
3. Uploads the encrypted blob to IPFS via Pinata. This returns a CID (content identifier) — a permanent, tamper-proof address for the ciphertext.
4. Publishes a transaction to the Vara smart contract containing: title, teaser, IPFS CID, price in VARA, and the encrypted AES key.
5. The contract assigns a sequential content ID and emits a `ContentPublished` event.

The encrypted key is stored on-chain. Only the contract can reveal it — and only to a reader who has already paid for a pass. The article body itself is never on-chain; only its encrypted form is on IPFS.

### Part 2 — The Smart Contract (`contracts/tella/`)

Written in Rust, compiled to WebAssembly, deployed on Vara Network using the Sails framework. The contract is a single program (`ContentAgent`) with three logical services:

**Content service**
- `Publish` — stores title, description, IPFS CID, price, and the encrypted AES key. Only the creator (or contract owner) can publish.
- `ListContent` — returns all published content metadata (public).
- `GetContent` — returns a single content item (public).
- `RequestAccessKey` — returns the encrypted AES key, but only if the caller has a valid pass or is the original creator.

**Pass service**
- `MintPass` — reader sends a transaction with VARA attached. Contract verifies the value meets the price, records the pass against the reader's wallet address, and accrues the payment to the creator's pending revenue.
- `CheckAccess` — returns true/false for a wallet + content ID pair.
- `GetUserPasses` — lists all passes owned by a wallet.

**Treasury service**
- `GetPendingRevenue` — returns how much VARA a creator has earned but not yet withdrawn.
- `ClaimRevenue` — sends the accumulated VARA directly to the creator's wallet.

The contract enforces all rules. There is no admin backdoor, no database, no server-side auth. Ownership is a wallet signature.

### Part 3 — The Frontend (`frontend/`)

A Next.js web app. Entirely client-side for anything sensitive (decryption never leaves the browser).

Key routes:

| Route | What it does |
|-------|--------------|
| `/` | Landing page — product overview, CTAs, next-drop countdown |
| `/browse` | Grid of all published content with title, teaser, price, and pass count |
| `/post/[id]` | Article page — teaser is public; full body is locked until a pass is purchased |
| `/my-passes` | All passes owned by the connected wallet |
| `/creator` | Creator dashboard — manual publish, check pending revenue, claim revenue |

The reader flow:
1. Browse → open a post → read the teaser.
2. Connect a Polkadot-compatible wallet (Talisman, SubWallet, Polkadot.js).
3. Click **Buy Access Pass** — wallet prompts to sign and send a transaction.
4. After the transaction confirms, the app calls `RequestAccessKey` from the contract, fetches the encrypted ciphertext from IPFS through a server-side proxy, and decrypts in the browser using the AES key.
5. The article renders. No page reload, no separate step.

---

## How the encryption works

The full article body is never stored anywhere in plaintext:

```
article body (plaintext)
        │
        ▼
AES-256-GCM encrypt with fresh key + IV
        │
        ├── ciphertext ──────────────────► pinned to IPFS (public URL, but unreadable)
        └── key_hex:iv_hex ──────────────► stored in smart contract (only accessible via RequestAccessKey)

To read:
reader sends VARA ──► pass recorded on-chain ──► RequestAccessKey returns key
browser fetches IPFS ciphertext + decrypts with key ──► plaintext renders
```

AES-256-GCM is authenticated encryption — the same standard used to secure HTTPS traffic. The IV (initialization vector) ensures each article uses a unique encryption even if two articles had identical content.

---

## Repository structure

```
tella/
├── agent/                   # Node.js AI agent (TypeScript)
│   ├── src/
│   │   ├── index.ts         # Entry point, cron scheduler
│   │   ├── claude.ts        # Anthropic API calls (research + write)
│   │   ├── encryption.ts    # AES-256-GCM key generation + encrypt/decrypt
│   │   ├── ipfs.ts          # Pinata IPFS pin
│   │   ├── vara.ts          # Vara Network transaction signing
│   │   ├── sails-payload.ts # Sails ABI encoding helpers
│   │   ├── listener.ts      # PassMinted event subscriber
│   │   └── load-env.ts      # .env.local loader
│   └── prompts/
│       └── persona.md       # Claude's voice / persona (SassyOnchain)
│
├── contracts/tella/         # Rust/Sails smart contract
│   ├── app/src/lib.rs       # Contract logic (~500 lines)
│   ├── tella.idl            # Sails interface definition (generated)
│   └── target/              # Build output (WASM, IDL)
│
├── frontend/                # Next.js dApp
│   ├── app/                 # App Router pages
│   ├── components/          # UI components
│   ├── lib/                 # Contract client, IPFS helpers
│   └── public/              # Static assets
│
└── scripts/
    ├── setup-agent.sh       # Create agent wallet + request testnet faucet
    ├── deploy.sh            # Build + deploy contract, copy artifacts
    └── fix-idl-for-wallet.sh # Patch IDL for vara-wallet compatibility
```

---

## Quick start (development)

### Prerequisites

- Node.js 20+
- Rust + `cargo` with `wasm32-gear` target (for contract builds)
- `vara-wallet` CLI
- Anthropic API key
- Pinata account (free tier works)

### 1 — Set up the agent wallet and deploy the contract

```bash
bash scripts/setup-agent.sh   # creates agent-wallet, requests testnet VARA
bash scripts/deploy.sh        # builds contract WASM, deploys to testnet, writes PROGRAM_ID
```

After `deploy.sh` completes, `PROGRAM_ID` is written to `agent/.env.local` and `NEXT_PUBLIC_PROGRAM_ID` to `frontend/.env.local`.

### 2 — Configure the agent

```bash
cp agent/.env.example agent/.env.local
# Fill in:
# ANTHROPIC_API_KEY=sk-ant-...
# PINATA_API_KEY=...
# PINATA_SECRET_KEY=...
# PROGRAM_ID is already set by deploy.sh
```

### 3 — Run the agent

```bash
cd agent

# Dry run — generates content, skips IPFS and chain (no keys required)
npm run dev:dry

# One real digest, then exit (requires all env vars + deployed contract)
npm run run-once

# Production daemon — runs daily at 13:00 UTC (08:00 EST / 14:00 CET / 21:00 SGT)
npm run dev
```

### 4 — Run the frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Environment variables

### `agent/.env.local`

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | yes | — | Claude API access |
| `ANTHROPIC_MODEL` | no | `claude-haiku-4-5` | Model for digest generation |
| `PINATA_API_KEY` | yes (prod) | — | IPFS pinning via Pinata |
| `PINATA_SECRET_KEY` | yes (prod) | — | IPFS pinning via Pinata |
| `PROGRAM_ID` | yes (prod) | — | Deployed contract address |
| `CONTRACT_IDL` | no | `./tella.idl` | Path to Sails IDL |
| `NETWORK` | no | `testnet` | Vara network endpoint |
| `VARA_ACCOUNT` | no | `agent-wallet` | vara-wallet account name |
| `DAILY_DIGEST_PRICE` | no | `1000000000000` | Price in smallest VARA units (1 VARA) |
| `AGENT_NETWORK_PID` | no | — | Vara Agent Network program ID (announcements) |
| `AGENT_NETWORK_IDL` | no | — | IDL for agent network chat |
| `IPFS_GATEWAY` | no | Pinata default | Gateway for fetching ciphertext |

### `frontend/.env.local`

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_PROGRAM_ID` | yes | Contract address (same as agent) |
| `NEXT_PUBLIC_NETWORK` | yes | e.g. `testnet` or `mainnet` |

---

## Customization

### Change the AI persona or topic focus

Edit `agent/prompts/persona.md`. The persona is currently "SassyOnchain" — a curious, educator-voice analyst. You can point the agent at any topic domain (DeFi, gaming, policy) by changing the research instructions. Keep the output JSON shape unchanged (`title`, `description`, `body`).

### Change the price

```bash
# agent/.env.local
DAILY_DIGEST_PRICE=5000000000000  # 5 VARA
```

Applies to the next publish. Existing content retains its original price.

### Change the schedule

In `agent/src/index.ts` at the `cron.schedule` call:

```ts
cron.schedule('0 13 * * *', ...)   // 13:00 UTC daily (default — 08:00 EST / 21:00 SGT)
cron.schedule('0 */6 * * *', ...)  // every 6 hours
cron.schedule('0 13 * * 1', ...)   // Mondays only
```

### Use a more powerful model

```bash
ANTHROPIC_MODEL=claude-sonnet-4-6  # deeper research, better writing
ANTHROPIC_MODEL=claude-haiku-4-5   # faster, cheaper (default)
```

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| AI | Anthropic Claude + `web_search` tool | Live research + structured writing |
| Encryption | AES-256-GCM (Node.js `crypto`) | Industry-standard authenticated encryption |
| Decentralized storage | IPFS via Pinata | Permanent, censorship-resistant content storage |
| Blockchain | Vara Network (Substrate-based) | Fast finality, low fees, WASM smart contracts |
| Smart contract | Rust + Sails framework | Type-safe, auditable access control |
| Frontend | Next.js (App Router) + TypeScript | Full-stack React with server components |
| Wallet | Polkadot-compatible extensions | Non-custodial, user-controlled |

---

## Deployment

The frontend is deployed to Vercel. From the repo root:

```bash
vercel deploy --prod --archive=tgz
```

Set `NEXT_PUBLIC_PROGRAM_ID` and `NEXT_PUBLIC_NETWORK` in the Vercel project environment variable settings.

---

## Contract

Build and test the contract locally:

```bash
cd contracts/tella
cargo test -p tella-app --release
```

Build WASM:

```bash
cargo build -p tella-app --release --target wasm32-gear
```

Output: `contracts/tella/target/wasm32-gear/release/tella.opt.wasm`

---

## License

MIT
