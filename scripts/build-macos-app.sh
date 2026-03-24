#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_SOURCE="${ROOT_DIR}/macos/RedCube AI Launcher.applescript"
APP_TARGET="${ROOT_DIR}/RedCube AI.app"

chmod +x "${ROOT_DIR}/scripts/launch-redcube-web.sh" "${ROOT_DIR}/RedCube AI Web.command"
rm -rf "${APP_TARGET}"
osacompile -o "${APP_TARGET}" "${APP_SOURCE}"

INFO_PLIST="${APP_TARGET}/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleName RedCube AI" "${INFO_PLIST}" >/dev/null 2>&1 || true
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName RedCube AI" "${INFO_PLIST}" >/dev/null 2>&1 || true

echo "已生成 ${APP_TARGET}"
