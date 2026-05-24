#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MD="$ROOT/DEMO.md"
HTML="$ROOT/DEMO-print.html"
PDF="$ROOT/DEMO.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [[ ! -f "$MD" ]]; then
  echo "ERROR: $MD not found"
  exit 1
fi

pandoc "$MD" -o "$HTML" --standalone \
  --metadata title="Tella — Demo Playbook" \
  --css "scripts/demo-pdf.css"

if [[ ! -x "$CHROME" ]]; then
  echo "ERROR: Google Chrome not found at $CHROME"
  echo "Install Chrome or run: npx md-to-pdf DEMO.md"
  exit 1
fi

"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf="$PDF" \
  "file://$HTML"

rm -f "$HTML"
echo "==> Wrote $PDF ($(wc -c < "$PDF" | tr -d ' ') bytes)"
