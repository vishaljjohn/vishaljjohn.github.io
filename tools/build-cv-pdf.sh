#!/bin/bash
# Rebuilds assets/VishalJohnCV.pdf from the CV on the About page (assets/cv.json).
# Usage: ./tools/build-cv-pdf.sh   (needs Google Chrome and python3)
set -euo pipefail
cd "$(dirname "$0")/.."

# stamp today's date as the CV's "Last updated" (shown on the page and in the PDF)
python3 - <<'PY'
import json, datetime
f = "assets/cv.json"
cv = json.load(open(f))
cv["updated"] = datetime.date.today().isoformat()
open(f, "w").write(json.dumps(cv, indent=2, ensure_ascii=False) + "\n")
PY

PORT=8799
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=8000 \
  --print-to-pdf="assets/VishalJohnCV.pdf" \
  "http://localhost:$PORT/pages/about.html" 2>/dev/null

echo "Wrote assets/VishalJohnCV.pdf"
