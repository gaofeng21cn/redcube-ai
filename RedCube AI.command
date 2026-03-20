#!/bin/zsh
set -e
cd "$(dirname "$0")"
node apps/redcube-cli/src/cli.js help
echo "\n请输入 redcube 命令，例如:"
echo "node apps/redcube-cli/src/cli.js run --project \"项目名\""
exec $SHELL
