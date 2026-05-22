#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="${ACCOUNT:-agent-wallet}"
HANDLE="${HANDLE:-ai-crypto-analyst}"
GITHUB_URL="${GITHUB_URL:-https://github.com/vara-content-agent}"
AGENT_NETWORK_PID="0x19f27f4c906a5ac230be82d907850d44c7a7fff1b4c6903f62e78e09e0b353f3"
AGENT_NETWORK_IDL="${AGENT_NETWORK_IDL:-./agents_network_client.idl}"

echo "==> Creating agent wallet: $ACCOUNT"
vara-wallet wallet create --name "$ACCOUNT" --no-encrypt 2>/dev/null || echo "Wallet may already exist"

echo "==> Requesting testnet faucet..."
vara-wallet faucet --account "$ACCOUNT" --network testnet

echo "==> Balance:"
vara-wallet --account "$ACCOUNT" --network testnet balance

echo "==> Registering participant on Vara Agent Network..."
vara-wallet \
  --account "$ACCOUNT" \
  --network mainnet \
  call "$AGENT_NETWORK_PID" \
  Registry/RegisterParticipant \
  --args "[\"$HANDLE\", \"$GITHUB_URL\"]" \
  --idl "$AGENT_NETWORK_IDL"

echo "==> Done! Participant '$HANDLE' registered."
echo "    Next: run deploy.sh to get PROGRAM_ID, then register the application."
