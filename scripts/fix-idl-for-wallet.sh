#!/usr/bin/env bash
# vara-wallet recomputes Sails interface_id hashes; patch generated IDL so CLI accepts it.
set -euo pipefail
IDL="${1:-$(cd "$(dirname "$0")/../contracts/tella" && pwd)/target/wasm32-gear/release/tella.idl}"
if [ ! -f "$IDL" ]; then
  echo "IDL not found: $IDL (run: cd contracts/tella && cargo build --release)"
  exit 1
fi
sed -i '' \
  -e 's/0xc3aae4627b50f054/0x6e6c0e38efa38a43/g' \
  -e 's/0x1017ab3b5a2c733c/0x7a087345765a3790/g' \
  -e 's/0x5e3679ba33d6775f/0x47a8dd7c5aa52256/g' \
  "$IDL"
echo "Patched IDL: $IDL"
