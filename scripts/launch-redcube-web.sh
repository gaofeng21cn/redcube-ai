#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PORT="${PORT:-3100}"
HOST="${HOST:-127.0.0.1}"
URL="http://${HOST}:${PORT}/"
LOG_FILE="${ROOT_DIR}/redcube-web.log"

is_redcube_ready() {
  curl -fsS "${URL}" 2>/dev/null | grep -q "RedCube AI Workbench"
}

cd "$ROOT_DIR"

if ! is_redcube_ready; then
  nohup env PORT="$PORT" node apps/redcube-web/src/server.js >"$LOG_FILE" 2>&1 &
fi

for _ in {1..40}; do
  if is_redcube_ready; then
    open "$URL"
    exit 0
  fi
  sleep 0.5
done

echo "RedCube AI Web 未能在 ${URL} 成功启动。" >&2
exit 1
