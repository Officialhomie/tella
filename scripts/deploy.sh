#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$ROOT/contracts/tella"
AGENT_IDL="$ROOT/agent/tella.idl"
NETWORK="${NETWORK:-testnet}"
ACCOUNT="${ACCOUNT:-agent-wallet}"

echo "==> Building WASM binary..."
cd "$CONTRACT_DIR"
cargo build --release 2>&1

WASM="$CONTRACT_DIR/target/wasm32-gear/release/tella.opt.wasm"
IDL="$CONTRACT_DIR/target/wasm32-gear/release/tella.idl"
if [ ! -f "$WASM" ]; then
  echo "ERROR: WASM not found at $WASM"
  exit 1
fi
if [ ! -f "$IDL" ]; then
  echo "ERROR: IDL not found at $IDL"
  exit 1
fi

cp "$IDL" "$AGENT_IDL"
bash "$ROOT/scripts/fix-idl-for-wallet.sh" "$AGENT_IDL"

CODE_ID=$(vara-wallet --account "$ACCOUNT" --network "$NETWORK" --json program upload "$WASM" 2>&1 | python3 -c "import sys,json; print(json.load(sys.stdin)['codeId'])")

echo "==> Uploaded code: $CODE_ID"
echo "==> Deploying program instance (ContentAgent/New)..."
RESULT=$(vara-wallet --account "$ACCOUNT" --network "$NETWORK" --json program deploy "$CODE_ID" \
  --idl "$AGENT_IDL" --init New --args '[]' 2>&1)

echo "$RESULT"

PROGRAM_ID=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('programId',''))" 2>/dev/null || echo "")

if [ -n "$PROGRAM_ID" ]; then
  echo "==> Deployed: $PROGRAM_ID"
  for env_file in "$ROOT/frontend/.env.local" "$ROOT/agent/.env.local"; do
    touch "$env_file"
    if grep -q '^NEXT_PUBLIC_PROGRAM_ID=' "$env_file" 2>/dev/null; then
      sed -i '' "s|^NEXT_PUBLIC_PROGRAM_ID=.*|NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID|" "$env_file"
    elif grep -q '^PROGRAM_ID=' "$env_file" 2>/dev/null; then
      sed -i '' "s|^PROGRAM_ID=.*|PROGRAM_ID=$PROGRAM_ID|" "$env_file"
    else
      echo "PROGRAM_ID=$PROGRAM_ID" >> "$env_file"
    fi
  done
  if ! grep -q '^CONTRACT_IDL=' "$ROOT/agent/.env.local" 2>/dev/null; then
    echo "CONTRACT_IDL=./tella.idl" >> "$ROOT/agent/.env.local"
  fi
  cp "$AGENT_IDL" "$ROOT/frontend/lib/tella.idl"
  echo "==> Written PROGRAM_ID to agent/.env.local and frontend/.env.local"
else
  echo "WARNING: Could not parse program_id — set PROGRAM_ID manually"
fi
