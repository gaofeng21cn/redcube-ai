from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


CATALOG_FILE = repo_root() / "contracts" / "runtime-program" / "python-native-helper-catalog.json"


def load_helper_catalog(catalog_file: Path | None = None) -> dict[str, Any]:
    path = (catalog_file or CATALOG_FILE).resolve()
    catalog = json.loads(path.read_text(encoding="utf-8"))
    if catalog.get("contract_id") != "python-native-helper-catalog":
        raise ValueError(f"Unexpected Python helper catalog contract_id in {path}")
    if catalog.get("language") != "python":
        raise ValueError(f"Unexpected Python helper catalog language in {path}")
    return catalog
