#!/bin/zsh
set -e
cd "$(dirname "$0")"
PORT=${PORT:-3100}
node apps/redcube-web/src/server.js
