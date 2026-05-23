#!/usr/bin/env bash
# vara-wallet recomputes Sails interface_id hashes; patch generated IDL so CLI accepts it.
set -euo pipefail
IDL="${1:-$(cd "$(dirname "$0")/../contracts/content-agent" && pwd)/target/wasm32-gear/release/content_agent.idl}"
if [ ! -f "$IDL" ]; then
  echo "IDL not found: $IDL (run: cd contracts/content-agent && cargo build --release)"
  exit 1
fi
sed -i '' \
  -e 's/0x9aa74b14277a5770/0x7d0d4dfb0f73a29c/g' \
  -e 's/0x1017ab3b5a2c733c/0x7a087345765a3790/g' \
  -e 's/0x5e3679ba33d6775f/0x47a8dd7c5aa52256/g' \
  "$IDL"
echo "Patched IDL: $IDL"
