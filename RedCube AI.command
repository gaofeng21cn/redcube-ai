#!/bin/zsh
set -e
cd "$(dirname "$0")"
node apps/redcube-cli/src/cli.js help
echo "\n请输入 redcube 命令，例如:"
echo "node apps/redcube-cli/src/cli.js deliverable create --workspace-root \"工作区\" --overlay ppt_deck --profile-id lecture_student --topic-id topic-a --deliverable-id deck-a --title \"标题\" --goal \"目标\""
exec $SHELL
