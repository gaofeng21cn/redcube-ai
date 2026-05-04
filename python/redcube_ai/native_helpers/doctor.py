from __future__ import annotations

import argparse
import importlib.util
import json
import platform
import shutil
import sys
import tomllib
from pathlib import Path
from typing import Any

from .catalog import CATALOG_FILE, load_helper_catalog, repo_root


OPTIONAL_IMPORT_NAMES = {
    "Pillow": "PIL",
    "python-pptx": "pptx",
    "playwright": "playwright",
    "upstream-hermes-agent-local": None,
    "Microsoft PowerPoint": None,
}

NATIVE_PPT_DOCKER_COMMAND = (
    "docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof . "
    "&& docker run --rm -it -v \"$PWD:/workspace\" -w /workspace redcube-native-ppt-proof "
    "bash -lc \"npm ci && python3 -m redcube_ai.native_helpers.doctor\""
)


def _pyproject_metadata(pyproject_file: Path) -> dict[str, Any]:
    data = tomllib.loads(pyproject_file.read_text(encoding="utf-8"))
    project = data.get("project", {}) if isinstance(data.get("project"), dict) else {}
    return {
        "name": project.get("name"),
        "version": project.get("version"),
        "scripts": project.get("scripts", {}) if isinstance(project.get("scripts"), dict) else {},
    }


def _dependency_summary(requirements: list[str]) -> list[dict[str, Any]]:
    summary: list[dict[str, Any]] = []
    for requirement in requirements:
        import_name = OPTIONAL_IMPORT_NAMES.get(requirement, requirement)
        if import_name is None:
            summary.append({
                "name": requirement,
                "import_name": None,
                "status": "external_runtime_dependency",
                "available": None,
            })
            continue
        available = importlib.util.find_spec(import_name) is not None
        summary.append({
            "name": requirement,
            "import_name": import_name,
            "status": "available" if available else "missing",
            "available": available,
        })
    return summary


def _command_probe(name: str, *candidates: str) -> dict[str, Any]:
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
    return {
        "name": name,
        "available": False,
        "command": candidates[0] if candidates else None,
        "path": None,
        "blocked_reason": f"missing executable: {' or '.join(candidates)}",
    }


def _python_dependency_probe(name: str, import_name: str) -> dict[str, Any]:
    available = importlib.util.find_spec(import_name) is not None
    return {
        "name": name,
        "available": available,
        "import_name": import_name,
        "blocked_reason": None if available else f"missing Python package import: {import_name}",
    }


def _powerpoint_probe() -> dict[str, Any]:
    mac_app = Path("/Applications/Microsoft PowerPoint.app")
    osa = shutil.which("osascript")
    available = platform.system() == "Darwin" and mac_app.exists() and bool(osa)
    blocked = []
    if platform.system() != "Darwin":
        blocked.append("Microsoft PowerPoint AppleScript render proof is macOS-only")
    if not mac_app.exists():
        blocked.append("missing /Applications/Microsoft PowerPoint.app")
    if not osa:
        blocked.append("missing osascript executable")
    return {
        "name": "powerpoint_applescript",
        "available": available,
        "renderer_kind": "powerpoint_applescript",
        "app_path": str(mac_app),
        "osascript_path": osa,
        "blocked_reason": None if available else "; ".join(blocked),
        "fallback_for_linux_native_proof": False,
    }


def _renderer_availability() -> dict[str, Any]:
    libreoffice = _command_probe("libreoffice", "libreoffice", "soffice")
    pdftoppm = _command_probe("pdftoppm", "pdftoppm")
    pdfinfo = _command_probe("pdfinfo", "pdfinfo")
    python_deps = [
        _python_dependency_probe("Pillow", "PIL"),
        _python_dependency_probe("python-pptx", "pptx"),
        _python_dependency_probe("playwright", "playwright"),
    ]
    powerpoint = _powerpoint_probe()
    linux_proof_checks = [
        libreoffice,
        pdftoppm,
        pdfinfo,
        *python_deps,
    ]
    linux_ready = all(check["available"] for check in linux_proof_checks)
    blocked_reasons = [
        str(check["blocked_reason"])
        for check in linux_proof_checks
        if not check["available"] and check.get("blocked_reason")
    ]
    return {
        "surface_kind": "native_ppt_renderer_availability",
        "executes_generation": False,
        "executes_review_export_gates": False,
        "linux_native_proof": {
            "available": linux_ready,
            "renderer_kind": "libreoffice_pdf_plus_poppler_png",
            "blocked_reason": None if linux_ready else "; ".join(blocked_reasons),
            "required_system_packages": [
                "libreoffice",
                "poppler-utils",
                "fonts-noto-cjk",
            ],
            "required_python_packages": [
                "Pillow",
                "python-pptx",
                "playwright",
            ],
        },
        "renderers": {
            "libreoffice": libreoffice,
            "poppler": {
                "available": pdftoppm["available"] and pdfinfo["available"],
                "commands": {
                    "pdftoppm": pdftoppm,
                    "pdfinfo": pdfinfo,
                },
                "blocked_reason": None
                if pdftoppm["available"] and pdfinfo["available"]
                else "; ".join(
                    str(check["blocked_reason"])
                    for check in (pdftoppm, pdfinfo)
                    if check.get("blocked_reason")
                ),
            },
            "powerpoint_applescript": powerpoint,
        },
        "python_dependencies": python_deps,
        "powerpoint_fallback_allowed": False,
        "suggested_docker_command": NATIVE_PPT_DOCKER_COMMAND,
    }


def _helper_diagnostics(helper: dict[str, Any], scripts: dict[str, str]) -> dict[str, Any]:
    module = str(helper.get("package_module") or "")
    entrypoint = helper.get("package_entrypoint", {}) if isinstance(helper.get("package_entrypoint"), dict) else {}
    console_script = str(entrypoint.get("console_script") or "")
    callable_name = str(entrypoint.get("callable") or "")
    expected_script = f"{module}:{callable_name}" if module and callable_name else None
    module_spec_found = importlib.util.find_spec(module) is not None if module else False

    return {
        "helper_id": helper.get("helper_id"),
        "importability": {
            "package_module": module,
            "module_spec_found": module_spec_found,
        },
        "entrypoint": {
            "console_script": console_script,
            "module_command": entrypoint.get("module_command"),
            "callable": callable_name,
            "pyproject_target": scripts.get(console_script),
            "matches_pyproject": bool(expected_script and scripts.get(console_script) == expected_script),
        },
        "optional_dependencies": {
            "declared": list(helper.get("requires") or []),
            "summary": _dependency_summary(list(helper.get("requires") or [])),
        },
        "renderer_availability": _renderer_availability() if helper.get("helper_id") == "ppt_deck_native" else None,
        "routes": list(helper.get("routes") or []),
        "gates": list(helper.get("gates") or []),
        "capability_status": helper.get("capability_status"),
        "default_enabled": helper.get("default_enabled"),
        "engine_capabilities": helper.get("engine_capabilities"),
        "true_render_proof": helper.get("true_render_proof"),
    }


def build_report(catalog_file: Path | None = None) -> dict[str, Any]:
    root = repo_root()
    catalog_path = (catalog_file or CATALOG_FILE).resolve()
    catalog = load_helper_catalog(catalog_path)
    package = catalog.get("package", {}) if isinstance(catalog.get("package"), dict) else {}
    pyproject_file = root / str(package.get("pyproject") or "pyproject.toml")
    pyproject = _pyproject_metadata(pyproject_file)
    helpers = catalog.get("helpers", []) if isinstance(catalog.get("helpers"), list) else []
    helper_reports = [_helper_diagnostics(helper, pyproject["scripts"]) for helper in helpers]
    required_gates = list(catalog.get("bypass_policy", {}).get("required_review_export_gates") or [])
    all_entrypoints_registered = all(report["entrypoint"]["matches_pyproject"] for report in helper_reports)
    all_modules_found = all(report["importability"]["module_spec_found"] for report in helper_reports)

    return {
        "surface_kind": "python_native_helper_doctor",
        "status": "ok" if all_entrypoints_registered and all_modules_found else "degraded",
        "renderer_availability": _renderer_availability(),
        "package": {
            "name": pyproject.get("name") or package.get("name"),
            "version": pyproject.get("version"),
            "import_root": package.get("import_root"),
            "source_root": package.get("source_root"),
        },
        "catalog": {
            "path": str(catalog_path.relative_to(root)),
            "contract_id": catalog.get("contract_id"),
        },
        "helper_count": len(helpers),
        "helpers": helper_reports,
        "bypass_policy": catalog.get("bypass_policy"),
        "required_gates": required_gates,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Emit a JSON diagnostic report for RedCube AI Python native helpers.",
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=CATALOG_FILE,
        help="Path to python-native-helper-catalog.json.",
    )
    args = parser.parse_args(argv)

    report = build_report(args.catalog)
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
