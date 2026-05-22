# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vara Content Agent is a three-part system:
1. **`agent/`** — TypeScript Node.js daemon that generates AI x Crypto news digests daily using Claude, encrypts them, and publishes them on-chain
2. **`contracts/content-agent/`** — Rust/Sails smart contract (no_std WASM) deployed on Vara Network
3. **`frontend/`** — Next.js 16 + React 19 dApp for browsing and purchasing content

## Commands

### Agent (`agent/`)

```bash
npm run dev           # Run with live reload (loads agent/.env.local)
npm run dev:dry       # Dry run — generates content but skips IPFS + chain
npm run run-once      # One-shot production pipeline then exit
npm run run-once:now  # Same but also runs immediately (RUN_NOW=true)
npm run build         # Compile TypeScript → dist/
npm start             # Run compiled dist/index.js
```

### Frontend (`frontend/`)

```bash
npm run dev    # Next.js dev server on :3000
npm run build  # Production build
npm start      # Serve production build
```

### Contract (`contracts/content-agent/`)

```bash
# Build WASM binary (from contracts/content-agent/)
cargo build --release

# Run unit tests (from contracts/content-agent/app/)
cargo test

# Full deploy pipeline (from repo root)
./scripts/deploy.sh

# Register agent wallet on Vara Agent Network
./scripts/setup-agent.sh
```

## Architecture

### Data Flow

```
Claude API (web_search) → AES-256-GCM encrypt → Pinata IPFS pin
                                                         ↓
                    Smart contract: publish(title, description, cid, price, key)
                                                         ↓
User: mintPass(contentId, value=price) → contract returns AES key → browser decrypts IPFS content
```

### Agent (`agent/src/`)

- **`index.ts`** — Entry point. Runs two concurrent loops: `node-cron` at 09:00 UTC and an event listener for `PassMinted` events. Environment flags: `DRY_RUN`, `RUN_ONCE`, `RUN_NOW`.
- **`claude.ts`** — Calls Anthropic API with `web_search_20250305` tool. Default model is `claude-haiku-4-5`; override with `ANTHROPIC_MODEL`. Persona loaded from `prompts/persona.md`. Exports `generateNewsDigest()` and `generateDeepDive(topic)`.
- **`vara.ts`** — Wraps the `vara-wallet` CLI via `execFile`. All on-chain calls go through `sailsCall()`: dry-run → patch payload → send → wait for reply. Also handles `subscribeToEvents()` and `postToAgentChat()`.
- **`sails-payload.ts`** — Critical: `vara-wallet` computes different Sails interface_id hashes than `sails-rs` embeds in the WASM. `patchEncodedPayload()` swaps the IDs before sending. The same mapping is patched into the IDL by `scripts/fix-idl-for-wallet.sh`.
- **`encryption.ts`** — Node.js `crypto` AES-256-GCM. Key stored on-chain as `"key_hex:iv_hex"`. Ciphertext stored as `base64(ciphertext + authTag)`.
- **`ipfs.ts`** — Pinata SDK wrapper. Pins already-encrypted ciphertext strings.
- **`listener.ts`** — Subscribes to contract events; on `PassMinted` posts a welcome message to the Vara Agent Network chat.

### Smart Contract (`contracts/content-agent/app/src/lib.rs`)

Three Sails services on one program:
- **`ContentService`** — `publish`, `list_content`, `get_content`, `request_access_key` (returns AES key only if caller holds a pass or is creator)
- **`PassService`** — `mint_pass` (payable, accrues revenue to creator), `check_access`, `get_user_passes`
- **`TreasuryService`** — `claim_revenue`, `get_pending_revenue`

State is `static mut ContentAgentState` (no_std BTreeMap). 1 VARA = `1_000_000_000_000` smallest units.

### Frontend (`frontend/`)

- **`lib/gear-api.ts`** — Lazy singleton `GearApi` (WebSocket to Vara testnet/mainnet). Browser-only; throws on server.
- **`lib/contract.ts`** — All contract reads use `api.message.calculateReply()` (simulate). Writes use `api.message.send()` + Polkadot signer. Payload encoding is raw JSON hex (placeholder — not proper SCALE encoding).
- **`lib/wallet.ts`** — `@polkadot/extension-dapp` for Polkadot.js/Talisman wallet integration.
- **`lib/encryption.ts`** — Browser-side AES-256-GCM via `crypto.subtle`. `lib/encryption-browser.ts` has key generation helpers using `crypto.getRandomValues`.
- **`app/`** routes: `/browse` (list content), `/post/[id]` (view + decrypt), `/creator` (publish form), `/my-passes` (user passes)
- **`components/`**: `ContentCard`, `ContentViewer`, `PassMintButton`, `WalletConnect`

## Environment Variables

**Agent** (`agent/.env.local`, see `agent/.env.example`):
- `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default: `claude-haiku-4-5`)
- `PINATA_API_KEY`, `PINATA_SECRET_KEY`
- `VARA_ACCOUNT` (default: `agent-wallet`), `NETWORK` (default: `testnet`)
- `PROGRAM_ID` — set automatically by `deploy.sh`
- `CONTRACT_IDL` — path to patched `.idl` file
- `AGENT_NETWORK_PID`, `AGENT_NETWORK_IDL` — Vara Agent Network integration
- `DAILY_DIGEST_PRICE` — in smallest VARA units (default: `1000000000000` = 1 VARA)

**Frontend** (`frontend/.env.local`, see `frontend/.env.example`):
- `NEXT_PUBLIC_PROGRAM_ID` — set automatically by `deploy.sh`
- `NEXT_PUBLIC_NETWORK` — `testnet` or `mainnet`

## Key Constraints

- **Contract toolchain**: Rust stable, targets `wasm32-unknown-unknown` and `wasm32v1-none`. Build produces `content_agent.opt.wasm` and `content_agent.idl`.
- **IDL patching**: After `cargo build --release`, run `scripts/fix-idl-for-wallet.sh` before using `vara-wallet` to call the contract. `deploy.sh` does this automatically. The `patchEncodedPayload()` in the agent does the same for runtime calls.
- **GearApi is browser-only**: Never import `lib/gear-api.ts` in server components or API routes.
- **AES key format**: Always `"key_hex:iv_hex"` — 32-byte key + 12-byte IV, both hex-encoded. Never change this format without updating both agent and frontend decryption.
- **Payload encoding**: `lib/contract.ts` uses raw JSON→hex encoding, not proper Sails SCALE encoding. This is a known limitation noted in the file; replace with the sails-js generated client after deployment if needed.
