from __future__ import annotations

import os
import platform
import shutil
import sys
from pathlib import Path
from typing import Any


def _load_opl_dependency_probe() -> Any | None:
    try:
        from opl_framework import dependency_probe
        return dependency_probe
    except ImportError:
        pass
    candidates: list[Path] = []
    for env_key, suffix in (
        ("OPL_FRAMEWORK_PYTHON_ROOT", ""),
        ("OPL_FRAMEWORK_ROOT", "python"),
    ):
        raw = os.environ.get(env_key, "").strip()
        if raw:
            candidates.append(Path(raw) / suffix if suffix else Path(raw))
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidates.append(parent / "one-person-lab" / "python")
    for candidate in candidates:
        if (candidate / "opl_framework").is_dir() and str(candidate) not in sys.path:
            sys.path.insert(0, str(candidate))
            try:
                from opl_framework import dependency_probe
                return dependency_probe
            except ImportError:
                return None
    return None


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
    "bash -lc \"npm ci && python -m redcube_ai.native_helpers.doctor\""
)


def command_probe(name: str, *candidates: str, extra_paths: tuple[Path, ...] = ()) -> dict[str, Any]:
    fw_probe = _load_opl_dependency_probe()
    for candidate in candidates:
        path = (
            fw_probe.find_executable(candidate, extra_paths=(), which=shutil.which)
            if fw_probe is not None
            else shutil.which(candidate)
        )
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
