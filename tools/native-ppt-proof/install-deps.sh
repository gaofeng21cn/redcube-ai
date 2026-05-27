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

have_officecli() {
  have_command officecli && officecli --version >/dev/null 2>&1
}

officecli_asset_name() {
  local os_name arch libc
  os_name="$(uname -s)"
  arch="$(uname -m)"
  case "$os_name" in
    Darwin)
      case "$arch" in
        arm64) printf '%s\n' "officecli-mac-arm64" ;;
        x86_64) printf '%s\n' "officecli-mac-x64" ;;
        *) echo "Unsupported OfficeCLI architecture: $arch" >&2; return 1 ;;
      esac
      ;;
    Linux)
      libc="gnu"
      if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi musl; then
        libc="musl"
      elif [ -f /etc/alpine-release ]; then
        libc="musl"
      fi
      case "$arch:$libc" in
        x86_64:gnu) printf '%s\n' "officecli-linux-x64" ;;
        x86_64:musl) printf '%s\n' "officecli-linux-alpine-x64" ;;
        aarch64:gnu|arm64:gnu) printf '%s\n' "officecli-linux-arm64" ;;
        aarch64:musl|arm64:musl) printf '%s\n' "officecli-linux-alpine-arm64" ;;
        *) echo "Unsupported OfficeCLI architecture/libc: $arch/$libc" >&2; return 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OfficeCLI OS: $os_name" >&2
      return 1
      ;;
  esac
}

install_officecli() {
  if have_officecli; then
    return
  fi

  local version="v1.0.100"
  local asset checksum_file expected actual source
  local install_dir="$HOME/.local/bin"
  mkdir -p "$install_dir"

  asset="$(officecli_asset_name)"
  checksum_file="$(mktemp)"
  source="$(mktemp)"
  echo "Installing OfficeCLI native PPT materializer..."
  curl -fsSL "https://github.com/iOfficeAI/OfficeCLI/releases/download/$version/SHA256SUMS" -o "$checksum_file"
  curl -fsSL "https://github.com/iOfficeAI/OfficeCLI/releases/download/$version/$asset" -o "$source"
  expected="$(grep "  $asset$" "$checksum_file" | awk '{print $1}')"
  if [ -z "$expected" ]; then
    echo "OfficeCLI checksum missing for $asset in $version." >&2
    rm -f "$checksum_file" "$source"
    exit 1
  fi
  if have_command sha256sum; then
    actual="$(sha256sum "$source" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$source" | awk '{print $1}')"
  fi
  if [ "$expected" != "$actual" ]; then
    echo "OfficeCLI checksum mismatch for $asset: expected $expected, got $actual." >&2
    rm -f "$checksum_file" "$source"
    exit 1
  fi
  install -m 0755 "$source" "$install_dir/officecli"
  rm -f "$checksum_file" "$source"

  export PATH="$install_dir:$PATH"
  if ! have_officecli; then
    echo "OfficeCLI install completed but officecli is still unavailable on PATH." >&2
    echo "Expected install dir: $install_dir" >&2
    exit 1
  fi
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
    sudo apt-get install -y --no-install-recommends libreoffice poppler-utils fonts-noto-cjk
  else
    apt-get update
    apt-get install -y --no-install-recommends libreoffice poppler-utils fonts-noto-cjk
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

install_officecli

if ! have_libreoffice || ! have_poppler || ! have_officecli; then
  echo "Native PPT proof dependencies are still missing after installation." >&2
  exit 1
fi

echo "Native PPT proof dependencies are installed."
