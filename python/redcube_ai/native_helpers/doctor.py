from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import tomllib
from pathlib import Path
from typing import Any

from .catalog import CATALOG_FILE, load_helper_catalog, repo_root
from .renderer_dependencies import (
    NATIVE_PPT_DOCKER_COMMAND,
    install_commands,
    libreoffice_probe,
    platform_install_hint,
    poppler_probe,
)


OPTIONAL_IMPORT_NAMES = {
    "Pillow": "PIL",
    "python-pptx": "pptx",
    "playwright": "playwright",
    "LibreOffice headless": None,
}

def _pyproject_metadata(pyproject_file: Path) -> dict[str, Any]:
    data = tomllib.loads(pyproject_file.read_text(encoding="utf-8"))
    project = data.get("project", {}) if isinstance(data.get("project"), dict) else {}
    return {
        "name": project.get("name"),
        "version": project.get("version"),
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


def _python_dependency_probe(name: str, import_name: str) -> dict[str, Any]:
    available = importlib.util.find_spec(import_name) is not None
    return {
        "name": name,
        "available": available,
        "import_name": import_name,
        "blocked_reason": None if available else f"missing Python package import: {import_name}",
    }


def _renderer_availability() -> dict[str, Any]:
    libreoffice = libreoffice_probe()
    pdftoppm = poppler_probe("pdftoppm")
    pdfinfo = poppler_probe("pdfinfo")
    python_deps = [
        _python_dependency_probe("Pillow", "PIL"),
        _python_dependency_probe("python-pptx", "pptx"),
        _python_dependency_probe("playwright", "playwright"),
    ]
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
            "renderer_kind": "libreoffice_headless",
            "renderer_pipeline": "libreoffice_headless_pdf_png_v1",
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
        },
        "python_dependencies": python_deps,
        "desktop_app_fallback_allowed": False,
        "dependency_install": {
            "automatic_install_allowed": False,
            "provisioning_owner": "opl_connect_or_operator",
            "developer_proof_installer": "tools/native-ppt-proof/install-deps.sh",
            "suggested_command": platform_install_hint(),
            "commands": install_commands(),
            "executes_generation": False,
            "executes_review_export_gates": False,
        },
        "suggested_docker_command": NATIVE_PPT_DOCKER_COMMAND,
    }


def _helper_diagnostics(helper: dict[str, Any], root: Path) -> dict[str, Any]:
    module = str(helper.get("package_module") or "")
    module_spec_found = importlib.util.find_spec(module) is not None if module else False
    descriptor_ref = str(helper.get("probe_descriptor_ref") or "")
    source_ref = str(helper.get("source_ref") or "")
    descriptor_file = (root / descriptor_ref).resolve() if descriptor_ref else None
    source_file = (root / source_ref).resolve() if source_ref else None
    descriptor: dict[str, Any] = {}
    if descriptor_file and descriptor_file.is_file():
        try:
            candidate = json.loads(descriptor_file.read_text(encoding="utf-8"))
            if isinstance(candidate, dict):
                descriptor = candidate
        except (OSError, json.JSONDecodeError):
            descriptor = {}
    entrypoint_ref = str(descriptor.get("entrypoint_ref") or "")
    descriptor_entrypoint = (
        (descriptor_file.parent / entrypoint_ref).resolve()
        if descriptor_file and entrypoint_ref
        else None
    )
    authority = descriptor.get("authority_boundary")
    authority_is_false = (
        isinstance(authority, dict)
        and bool(authority)
        and all(value is False for value in authority.values())
    )
    descriptor_matches_source = bool(
        descriptor_file
        and source_file
        and descriptor.get("surface_kind") == "opl_pack_native_helper_probe_descriptor"
        and descriptor.get("schema_version") == 1
        and descriptor.get("helper_id") == helper.get("helper_id")
        and descriptor_entrypoint == source_file
        and authority_is_false
    )

    return {
        "helper_id": helper.get("helper_id"),
        "importability": {
            "package_module": module,
            "module_spec_found": module_spec_found,
        },
        "entrypoint": {
            "source_ref": source_ref,
            "probe_descriptor_ref": descriptor_ref,
            "probe_descriptor_exists": bool(descriptor_file and descriptor_file.is_file()),
            "probe_descriptor_matches_source": descriptor_matches_source,
            "public_launcher": False,
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
    helper_reports = [_helper_diagnostics(helper, root) for helper in helpers]
    required_gates = list(catalog.get("bypass_policy", {}).get("required_review_export_gates") or [])
    all_entrypoints_registered = all(
        report["entrypoint"]["probe_descriptor_matches_source"]
        for report in helper_reports
    )
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
