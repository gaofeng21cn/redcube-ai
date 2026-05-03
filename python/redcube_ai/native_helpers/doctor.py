from __future__ import annotations

import argparse
import importlib.util
import json
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
}


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
