#!/usr/bin/env bash
set -euo pipefail

have_command() {
  command -v "$1" >/dev/null 2>&1
}

have_libreoffice() {
  have_command soffice \
    || have_command libreoffice \
    || [ -x /Applications/LibreOffice.app/Contents/MacOS/soffice ]
}

have_poppler() {
  have_command pdftoppm && have_command pdfinfo
}

install_macos() {
  if ! have_command brew; then
    echo "Homebrew is required to install native PPT proof dependencies on macOS." >&2
    echo "Install Homebrew first, then rerun tools/native-ppt-proof/install-deps.sh." >&2
    exit 127
  fi

  if ! have_libreoffice; then
    brew install --cask libreoffice
  fi
  if ! have_poppler; then
    brew install poppler
  fi
  if ! brew list font-noto-sans-cjk >/dev/null 2>&1; then
    brew install font-noto-sans-cjk
  fi
}

install_linux() {
  if ! have_command apt-get; then
    echo "Automatic native PPT dependency install currently supports Debian/Ubuntu via apt-get." >&2
    echo "Use tools/native-ppt-proof/Dockerfile for other Linux distributions." >&2
    exit 127
  fi

  if have_command sudo; then
    sudo apt-get update
    sudo apt-get install -y libreoffice poppler-utils fonts-noto-cjk
  else
    apt-get update
    apt-get install -y libreoffice poppler-utils fonts-noto-cjk
  fi
}

case "$(uname -s)" in
  Darwin)
    install_macos
    ;;
  Linux)
    install_linux
    ;;
  *)
    echo "Unsupported OS for automatic native PPT proof dependency install: $(uname -s)" >&2
    echo "Use the Docker proof image from tools/native-ppt-proof/Dockerfile." >&2
    exit 127
    ;;
esac

if ! have_libreoffice || ! have_poppler; then
  echo "Native PPT proof dependencies are still missing after installation." >&2
  exit 1
fi

echo "Native PPT proof dependencies are installed."
