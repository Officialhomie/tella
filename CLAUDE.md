# Tella

Tella is a three-part system for gated AI × crypto intelligence on Vara Network:

1. **`agent/`** — TypeScript agent (Claude + Pinata + `vara-wallet`) that publishes daily digests
2. **`contracts/tella/`** — Rust/Sails smart contract (no_std WASM)
3. **`frontend/`** — Next.js app for browsing, minting passes, and creator publishing

## Quick start

```bash
# Agent (dry run)
cd agent && npm run dev:dry

# Frontend
cd frontend && npm run dev

# Contract tests
cd contracts/tella && cargo test -p tella-app --release

# Deploy contract to testnet
bash scripts/setup-agent.sh
bash scripts/deploy.sh
```

## Environment

- `agent/.env.local` — `ANTHROPIC_API_KEY`, `PINATA_*`, `PROGRAM_ID`, `CONTRACT_IDL=./tella.idl`
- `frontend/.env.local` — `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_NETWORK`

## Contract

- Services: `Content`, `Pass`, `Treasury` (Sails program `ContentAgent` in IDL)
- Build output: `contracts/tella/target/wasm32-gear/release/tella.opt.wasm`, `tella.idl`
- Patch IDL for `vara-wallet`: `bash scripts/fix-idl-for-wallet.sh agent/tella.idl`
