from __future__ import annotations

import platform
import shutil
from pathlib import Path
from typing import Any


LIBREOFFICE_CANDIDATES = (
    "soffice",
    "libreoffice",
)
MACOS_LIBREOFFICE_PATHS = (
    Path("/Applications/LibreOffice.app/Contents/MacOS/soffice"),
    Path("/opt/homebrew/Caskroom/libreoffice/latest/LibreOffice.app/Contents/MacOS/soffice"),
)
POPPLER_COMMANDS = {
    "pdftoppm": ("pdftoppm",),
    "pdfinfo": ("pdfinfo",),
}
MACOS_INSTALL_COMMAND = "brew install --cask libreoffice && brew install poppler font-noto-sans-cjk"
DEBIAN_INSTALL_COMMAND = "sudo apt-get update && sudo apt-get install -y libreoffice poppler-utils fonts-noto-cjk"
NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND = "tools/native-ppt-proof/install-deps.sh"
NATIVE_PPT_DOCKER_COMMAND = (
    "docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof . "
    "&& docker run --rm -it -v \"$PWD:/workspace\" -w /workspace redcube-native-ppt-proof "
    "bash -lc \"npm ci && python3 -m redcube_ai.native_helpers.doctor\""
)


def command_probe(name: str, *candidates: str, extra_paths: tuple[Path, ...] = ()) -> dict[str, Any]:
    for candidate in candidates:
        path = shutil.which(candidate)
        if path:
            return {
                "name": name,
                "available": True,
                "command": candidate,
                "path": path,
                "blocked_reason": None,
            }
    for candidate_path in extra_paths:
        if candidate_path.exists():
            return {
                "name": name,
                "available": True,
                "command": str(candidate_path),
                "path": str(candidate_path),
                "blocked_reason": None,
            }
    return {
        "name": name,
        "available": False,
        "command": candidates[0] if candidates else None,
        "path": None,
        "blocked_reason": f"missing executable: {' or '.join(candidates)}",
    }


def libreoffice_probe() -> dict[str, Any]:
    return command_probe("libreoffice", *LIBREOFFICE_CANDIDATES, extra_paths=MACOS_LIBREOFFICE_PATHS)


def poppler_probe(command_name: str) -> dict[str, Any]:
    return command_probe(command_name, *POPPLER_COMMANDS[command_name])


def install_commands() -> dict[str, str]:
    return {
        "redcube_dependency_installer": NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND,
        "macos_homebrew": MACOS_INSTALL_COMMAND,
        "debian_ubuntu": DEBIAN_INSTALL_COMMAND,
        "docker": NATIVE_PPT_DOCKER_COMMAND,
    }


def platform_install_hint() -> str:
    system = platform.system()
    if system == "Darwin":
        return NATIVE_PPT_DEPENDENCY_INSTALL_COMMAND
    if system == "Linux":
        return DEBIAN_INSTALL_COMMAND
    return NATIVE_PPT_DOCKER_COMMAND

