#!/usr/bin/env python3
"""Project RCA owner resources into its self-contained Codex carrier.

Delegates to Framework CLI (`opl pack project-carrier`) when available, and
falls back to a deterministic pure-Python materializer driven by
`contracts/carrier_projection.json` when `opl` is unavailable (e.g. standalone CI).
"""
from __future__ import annotations

import argparse
import copy
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import sys
import tomllib
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROJECTION_CONFIG_REF = "contracts/carrier_projection.json"


def resolve_opl_bin() -> str | None:
    env_bin = os.environ.get("OPL_BIN", "").strip()
    if env_bin:
        return env_bin
    fw_root = os.environ.get("OPL_FRAMEWORK_ROOT", "").strip()
    if fw_root:
        candidate = Path(fw_root) / "bin" / "opl"
        if candidate.is_file() and os.access(candidate, os.X_OK):
            return str(candidate)
    sibling = ROOT.parent / "one-person-lab" / "bin" / "opl"
    if sibling.is_file() and os.access(sibling, os.X_OK):
        return str(sibling)
    found = shutil.which("opl")
    if found and os.access(found, os.X_OK):
        return found
    return None


def _normalize_rel(raw_ref: str, field: str, *, allow_trailing_slash: bool = False) -> str:
    trimmed = raw_ref.strip()
    if not trimmed or "\x00" in trimmed or trimmed.startswith("/"):
        raise ValueError(f"{field} must be a non-empty relative path: {raw_ref!r}")
    stripped = trimmed.rstrip("/") if allow_trailing_slash else trimmed
    if not stripped or stripped == ".":
        raise ValueError(f"{field} must resolve inside the repository without naming root: {raw_ref!r}")
    parts = stripped.replace("\\", "/").split("/")
    if any(not part or part in {".", ".."} for part in parts):
        raise ValueError(f"{field} must not contain empty, '.', or '..' segments: {raw_ref!r}")
    return "/".join(parts)


def _join_rel(*parts: str) -> str:
    cleaned = [part.strip("/") for part in parts if isinstance(part, str) and part.strip("/")]
    return "/".join(cleaned)


def _resolve_contained(repo_root: Path, rel_posix: str, field: str) -> Path:
    normalized = _normalize_rel(rel_posix, field)
    resolved = (repo_root / normalized).resolve(strict=False)
    try:
        resolved.relative_to(repo_root)
    except ValueError as exc:
        raise ValueError(f"{field} escapes containment root: {normalized}") from exc
    if resolved == repo_root:
        raise ValueError(f"{field} must not name repository root: {normalized}")
    return resolved


def _assert_no_symlink_segments(repo_root: Path, target_path: Path, field: str) -> None:
    if target_path == repo_root:
        return
    rel = target_path.relative_to(repo_root)
    current = repo_root
    for part in rel.parts:
        current = current / part
        if current.is_symlink():
            rel_str = current.relative_to(repo_root).as_posix()
            raise ValueError(f"{field} must not traverse or target a symbolic link: {rel_str}")


def _read_regular_file(repo_root: Path, rel_posix: str, field: str) -> tuple[bytes, int]:
    absolute = _resolve_contained(repo_root, rel_posix, field)
    _assert_no_symlink_segments(repo_root, absolute, field)
    if not absolute.exists():
        raise FileNotFoundError(f"Required carrier source file is missing: {rel_posix}")
    st = absolute.lstat()
    if not stat.S_ISREG(st.st_mode):
        raise ValueError(f"{field} must be a regular file: {rel_posix}")
    return absolute.read_bytes(), stat.S_IMODE(st.st_mode)


def _json_bytes(payload: Any) -> bytes:
    return (json.dumps(payload, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def _matches_exclusion(rel_posix: str, config: dict[str, Any]) -> bool:
    for prefix in config.get("exclude_prefixes") or []:
        if rel_posix.startswith(str(prefix).lstrip("/")):
            return True
    segments = rel_posix.split("/")
    exclude_segments = set(config.get("exclude_path_segments") or [])
    if any(segment in exclude_segments for segment in segments):
        return True
    basename = segments[-1]
    if basename in set(config.get("exclude_basenames") or []):
        return True
    if any(basename.startswith(str(prefix)) for prefix in config.get("exclude_basename_prefixes") or []):
        return True
    include_exts = config.get("include_extensions") or []
    if include_exts and PurePosixPath(rel_posix).suffix not in include_exts:
        return True
    return False


def _matches_preserve_rule(carrier_rel_posix: str, preserve_rules: list[str]) -> bool:
    for raw_rule in preserve_rules:
        rule = str(raw_rule).lstrip("/")
        if rule.endswith("/**"):
            if carrier_rel_posix.startswith(rule[:-2]):
                return True
        elif rule.endswith("/"):
            if carrier_rel_posix.startswith(rule):
                return True
        elif carrier_rel_posix == rule:
            return True
    return False


def _list_git_tracked_entries(repo_root: Path) -> dict[str, int]:
    result = subprocess.run(
        ["git", "-C", str(repo_root), "ls-files", "--stage", "-z"],
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            "Carrier projection requires a readable Git index when resource_source_mode is git_tracked: "
            + result.stderr.decode("utf-8", errors="replace").strip()
        )
    entries: dict[str, int] = {}
    for record in result.stdout.split(b"\x00"):
        if not record or b"\t" not in record:
            continue
        meta_raw, path_raw = record.split(b"\t", 1)
        meta = meta_raw.decode("utf-8").split()
        rel_path = path_raw.decode("utf-8")
        mode_octal, stage = meta[0], meta[2]
        if stage != "0":
            raise ValueError(f"Carrier source contains unmerged Git index entry: {rel_path}")
        if mode_octal == "120000":
            entries[rel_path] = 0o120000
        elif mode_octal == "100755":
            entries[rel_path] = 0o755
        elif mode_octal == "100644":
            entries[rel_path] = 0o644
    return entries


def _walk_filesystem_resources(repo_root: Path, root_rel: str, config: dict[str, Any]) -> list[str]:
    start_dir = _resolve_contained(repo_root, root_rel, "resource_roots")
    if not start_dir.exists() or start_dir.is_symlink() or not start_dir.is_dir():
        return []
    exclude_segments = set(config.get("exclude_path_segments") or [])
    out: list[str] = []

    def visit(dir_abs: Path, rel_prefix: str) -> None:
        for entry in sorted(dir_abs.iterdir(), key=lambda p: p.name):
            if entry.is_symlink() or entry.name == ".git":
                continue
            child_rel = f"{rel_prefix}/{entry.name}"
            if entry.is_dir():
                if entry.name in exclude_segments:
                    continue
                visit(entry, child_rel)
            elif entry.is_file() and not _matches_exclusion(child_rel, config):
                out.append(child_rel)

    visit(start_dir, root_rel)
    return out


def _project_package_manifest(owner: dict[str, Any], rule: dict[str, Any], repo_root: Path) -> bytes | None:
    mode = rule.get("mode", "pick_keys")
    if mode == "none":
        return None
    if mode == "copy_root":
        return _json_bytes(owner)
    if mode == "clone_with_plugin_source_dot":
        cloned = copy.deepcopy(owner)
        surface = dict(cloned.get("codex_surface") or {}) if isinstance(cloned.get("codex_surface"), dict) else {}
        surface["plugin_source_path"] = "."
        cloned["codex_surface"] = surface
        return _json_bytes(cloned)
    if mode == "strip_keys":
        stripped = copy.deepcopy(owner)
        for key in rule.get("strip_keys") or []:
            stripped.pop(key, None)
        return _json_bytes(stripped)

    projected: dict[str, Any] = {}
    for key in rule.get("pick_keys") or []:
        if key in owner:
            projected[key] = copy.deepcopy(owner[key])
    if rule.get("codex_surface_pick_keys") or rule.get("codex_surface_plugin_source_dot"):
        source_surface = owner.get("codex_surface") if isinstance(owner.get("codex_surface"), dict) else {}
        target_surface: dict[str, Any] = {}
        if rule.get("codex_surface_pick_keys"):
            for key in rule["codex_surface_pick_keys"]:
                if key in source_surface:
                    target_surface[key] = copy.deepcopy(source_surface[key])
        else:
            target_surface.update(copy.deepcopy(source_surface))
        if rule.get("codex_surface_plugin_source_dot"):
            target_surface["plugin_source_path"] = "."
        projected["codex_surface"] = target_surface
    if isinstance(rule.get("override_fields"), dict):
        projected.update(copy.deepcopy(rule["override_fields"]))
    if rule.get("domain_id_from_domain_descriptor") or rule.get("task_provider_suffix_from_domain_descriptor"):
        descriptor_ref = owner.get("domain_descriptor_ref")
        if not isinstance(descriptor_ref, str) or not descriptor_ref:
            raise ValueError("Owner manifest must declare domain_descriptor_ref for domain descriptor projection.")
        domain_bytes, _ = _read_regular_file(repo_root, descriptor_ref, "domain_descriptor_ref")
        domain = json.loads(domain_bytes.decode("utf-8"))
        if isinstance(domain, dict) and rule.get("domain_id_from_domain_descriptor") and isinstance(domain.get("domain_id"), str):
            projected["domain_id"] = domain["domain_id"]
        if rule.get("task_provider_suffix_from_domain_descriptor"):
            projected["task_provider_ref"] = f"{descriptor_ref}{rule['task_provider_suffix_from_domain_descriptor']}"
    strip_prefix_raw = rule.get("strip_entrypoint_carrier_prefix")
    if strip_prefix_raw and isinstance(projected.get("entrypoints"), list):
        strip_prefix = f"{str(strip_prefix_raw).rstrip('/')}/"
        updated_entrypoints = []
        for entry in projected["entrypoints"]:
            if isinstance(entry, dict) and isinstance(entry.get("carrier_ref"), str):
                normalized = entry["carrier_ref"].lstrip("/")
                if normalized.startswith(strip_prefix):
                    entry = {**entry, "carrier_ref": normalized[len(strip_prefix):]}
            updated_entrypoints.append(entry)
        projected["entrypoints"] = updated_entrypoints
    return _json_bytes(projected)


def _update_plugin_manifest(repo_root: Path, rule: dict[str, Any], owner: dict[str, Any]) -> bytes:
    rel = _normalize_rel(rule["path"], "plugin_manifests.path")
    raw_bytes, _ = _read_regular_file(repo_root, rel, "plugin_manifests.path")
    existing = json.loads(raw_bytes.decode("utf-8"))
    if not isinstance(existing, dict):
        raise ValueError(f"Plugin manifest must be a JSON object: {rel}")
    updated = copy.deepcopy(existing)
    if rule.get("sync_version"):
        updated["version"] = owner["version"]
    if rule.get("sync_name_from_plugin_id"):
        surface = owner.get("codex_surface") if isinstance(owner.get("codex_surface"), dict) else {}
        if isinstance(surface.get("plugin_id"), str) and surface["plugin_id"]:
            updated["name"] = surface["plugin_id"]
    if isinstance(rule.get("set_fields"), dict):
        updated.update(copy.deepcopy(rule["set_fields"]))
    sync_interface = rule.get("sync_interface")
    if isinstance(sync_interface, dict):
        presentation = owner.get("presentation") if isinstance(owner.get("presentation"), dict) else {}
        icon_ref = presentation.get("icon_ref") if isinstance(presentation.get("icon_ref"), str) else None
        prefix = sync_interface.get("logo_prefix", "./")
        icon_path = f"{prefix}{icon_ref.lstrip('./')}" if icon_ref else None
        if sync_interface.get("target_pointer") == "interface":
            ui_target = updated.setdefault("interface", {})
        else:
            extensions = updated.setdefault("extensions", {})
            openai = extensions.setdefault("com.openai", {})
            ui_target = openai.setdefault("interface", {})
        if isinstance(owner.get("display_name"), str):
            ui_target["displayName"] = owner["display_name"]
        if icon_path:
            ui_target["logo"] = icon_path
            ui_target["composerIcon"] = icon_path
    return _json_bytes(updated)


def _rewrite_adapter(repo_root: Path, adapter_config: dict[str, Any]) -> bytes:
    source_rel = _normalize_rel(adapter_config["source"], "adapter_projection.source")
    raw_bytes, _ = _read_regular_file(repo_root, source_rel, "adapter_projection.source")
    parsed = json.loads(raw_bytes.decode("utf-8"))
    if not isinstance(parsed, dict):
        raise ValueError(f"Adapter manifest must be a JSON object: {source_rel}")
    cloned = copy.deepcopy(parsed)
    rewrite_map = {item["from"]: item["to"] for item in adapter_config.get("argv_rewrites") or []}
    if rewrite_map:
        for section_name in ("reads", "actions"):
            section = cloned.get(section_name)
            if not isinstance(section, dict):
                continue
            for entry in section.values():
                if isinstance(entry, dict) and isinstance(entry.get("argv"), list):
                    entry["argv"] = [rewrite_map.get(arg, arg) if isinstance(arg, str) else arg for arg in entry["argv"]]
    return _json_bytes(cloned)


def project_carrier_standalone(repo_root: Path, *, check_only: bool = False) -> tuple[int, dict[str, Any]]:
    repo_root = repo_root.resolve()
    config_rel = DEFAULT_PROJECTION_CONFIG_REF
    config_bytes, _ = _read_regular_file(repo_root, config_rel, "projection_config")
    config = json.loads(config_bytes.decode("utf-8"))

    carrier_rel = _normalize_rel(config["carrier_root"], "carrier_root", allow_trailing_slash=True)
    target_prefix = (
        _normalize_rel(config["resource_target_prefix"], "resource_target_prefix", allow_trailing_slash=True)
        if config.get("resource_target_prefix")
        else ""
    )
    source_mode = config.get("resource_source_mode") or "git_tracked"
    preserve_exec_mode = config.get("preserve_exec_mode") is True

    version_checks = config.get("version_sync_checks") or {}
    manifest_rel = _normalize_rel(
        version_checks.get("manifest_path") or "contracts/opl_agent_package_manifest.json",
        "version_sync_checks.manifest_path",
    )
    owner_bytes, _ = _read_regular_file(repo_root, manifest_rel, "manifest_path")
    owner = json.loads(owner_bytes.decode("utf-8"))
    if not isinstance(owner, dict):
        raise ValueError(f"Owner package manifest must be a JSON object: {manifest_rel}")

    version_mismatches: list[str] = []
    if version_checks.get("pyproject_toml"):
        py_rel = _normalize_rel(version_checks["pyproject_toml"], "pyproject_toml")
        py_bytes, _ = _read_regular_file(repo_root, py_rel, "pyproject_toml")
        pyproject = tomllib.loads(py_bytes.decode("utf-8"))
        project = pyproject.get("project") if isinstance(pyproject.get("project"), dict) else {}
        if project.get("version") != owner.get("version"):
            version_mismatches.append(
                f"pyproject.toml version ({project.get('version')}) != owner version ({owner.get('version')})"
            )
        if version_checks.get("uv_lock"):
            lock_rel = _normalize_rel(version_checks["uv_lock"], "uv_lock")
            lock_bytes, _ = _read_regular_file(repo_root, lock_rel, "uv_lock")
            lock = tomllib.loads(lock_bytes.decode("utf-8"))
            packages = lock.get("package") if isinstance(lock.get("package"), list) else []
            locked = next((pkg for pkg in packages if isinstance(pkg, dict) and pkg.get("name") == project.get("name")), None)
            if not isinstance(locked, dict) or locked.get("version") != owner.get("version"):
                locked_ver = locked.get("version") if isinstance(locked, dict) else "missing"
                version_mismatches.append(
                    f"uv.lock version ({locked_ver}) != owner version ({owner.get('version')})"
                )

    owner_manifest_updated = False
    if version_checks.get("update_bundled_required_skill_pack_version") and isinstance(owner.get("skill_packs"), list):
        for pack in owner["skill_packs"]:
            if not isinstance(pack, dict):
                continue
            if (
                pack.get("source") == "repo_local_codex_plugin_carrier"
                and pack.get("install_mode") == "bundled_required"
                and pack.get("version") != owner.get("version")
            ):
                version_mismatches.append(
                    f"skill_pack {pack.get('id', 'unknown')} version ({pack.get('version')}) != owner version ({owner.get('version')})"
                )
                pack["version"] = owner["version"]
                owner_manifest_updated = True
        if owner_manifest_updated:
            owner_bytes = _json_bytes(owner)

    hard_version_errors = [msg for msg in version_mismatches if not msg.startswith("skill_pack ")]
    if hard_version_errors:
        raise ValueError(
            "Owner package version must match Python project and lock versions before carrier projection: "
            + "; ".join(hard_version_errors)
        )

    expected: dict[str, tuple[bytes, int]] = {}
    if owner_manifest_updated:
        expected[manifest_rel] = (owner_bytes, 0o644)

    normalized_roots = [_normalize_rel(r, "resource_roots", allow_trailing_slash=True) for r in config.get("resource_roots") or []]
    tracked_entries = _list_git_tracked_entries(repo_root) if source_mode == "git_tracked" else None
    collected: list[tuple[str, int]] = []
    if source_mode == "git_tracked" and tracked_entries is not None:
        for tracked_path, git_mode in tracked_entries.items():
            if not any(tracked_path == root or tracked_path.startswith(f"{root}/") for root in normalized_roots):
                continue
            if git_mode == 0o120000:
                raise ValueError(f"Carrier owner resource must not be a symbolic link: {tracked_path}")
            if not _matches_exclusion(tracked_path, config):
                collected.append((tracked_path, git_mode if preserve_exec_mode else 0o644))
        if any(config_rel == root or config_rel.startswith(f"{root}/") for root in normalized_roots):
            if config_rel not in tracked_entries and not _matches_exclusion(config_rel, config):
                collected.append((config_rel, 0o644))
    else:
        for root in normalized_roots:
            for rel in _walk_filesystem_resources(repo_root, root, config):
                collected.append((rel, 0o644))

    for rel, mode in collected:
        dest_rel = _join_rel(carrier_rel, target_prefix, rel)
        if rel == manifest_rel and owner_manifest_updated:
            expected[dest_rel] = (owner_bytes, mode if preserve_exec_mode else 0o644)
        else:
            data, file_mode = _read_regular_file(repo_root, rel, "resource_roots")
            expected[dest_rel] = (data, mode if preserve_exec_mode else file_mode)

    for extra_raw in config.get("extra_files") or []:
        extra_rel = _normalize_rel(extra_raw, "extra_files")
        dest_rel = _join_rel(carrier_rel, target_prefix, extra_rel)
        if extra_rel == manifest_rel and owner_manifest_updated:
            expected[dest_rel] = (owner_bytes, 0o644)
        else:
            git_mode = tracked_entries.get(extra_rel) if tracked_entries is not None else None
            if git_mode == 0o120000:
                raise ValueError(f"Carrier extra_files entry must not be a symbolic link: {extra_rel}")
            data, file_mode = _read_regular_file(repo_root, extra_rel, "extra_files")
            expected[dest_rel] = (data, git_mode if (preserve_exec_mode and git_mode) else file_mode)

    for alias in config.get("file_aliases") or []:
        from_rel = _normalize_rel(alias["from"], "file_aliases.from")
        to_rel = _normalize_rel(alias["to"], "file_aliases.to")
        from_abs = _resolve_contained(repo_root, from_rel, "file_aliases.from")
        if alias.get("optional") and not from_abs.exists():
            continue
        if from_rel == manifest_rel and owner_manifest_updated:
            data, file_mode = owner_bytes, 0o644
        else:
            data, file_mode = _read_regular_file(repo_root, from_rel, "file_aliases.from")
        mode = 0o755 if alias.get("executable") is True else (0o644 if preserve_exec_mode else file_mode)
        expected[_join_rel(carrier_rel, to_rel)] = (data, mode)

    if config.get("copy_presentation_icon"):
        presentation = owner.get("presentation") if isinstance(owner.get("presentation"), dict) else {}
        icon_ref = presentation.get("icon_ref")
        if isinstance(icon_ref, str) and icon_ref.strip():
            icon_rel = _normalize_rel(icon_ref, "presentation.icon_ref")
            data, file_mode = _read_regular_file(repo_root, icon_rel, "presentation.icon_ref")
            expected[_join_rel(carrier_rel, icon_rel)] = (data, 0o644 if preserve_exec_mode else file_mode)

    if isinstance(config.get("adapter_projection"), dict):
        target_rel = _normalize_rel(config["adapter_projection"]["target"], "adapter_projection.target")
        expected[_join_rel(carrier_rel, target_rel)] = (_rewrite_adapter(repo_root, config["adapter_projection"]), 0o644)

    pkg_rule = config.get("package_manifest_projection")
    if isinstance(pkg_rule, dict):
        pkg_bytes = _project_package_manifest(owner, pkg_rule, repo_root)
        if pkg_bytes is not None:
            pkg_target = _normalize_rel(pkg_rule.get("target") or "opl-package.json", "package_manifest_projection.target")
            expected[_join_rel(carrier_rel, pkg_target)] = (pkg_bytes, 0o644)
        sync_root = pkg_rule.get("sync_root_opl_package")
        if isinstance(sync_root, dict):
            root_target = _normalize_rel(sync_root.get("target") or "opl-package.json", "sync_root_opl_package.target")
            strip_keys = sync_root.get("strip_keys") or []
            if strip_keys:
                root_copy = copy.deepcopy(owner)
                for key in strip_keys:
                    root_copy.pop(key, None)
                root_bytes = _json_bytes(root_copy)
            else:
                root_bytes = owner_bytes
            expected[root_target] = (root_bytes, 0o644)

    for manifest_rule in config.get("plugin_manifests") or []:
        rel = _normalize_rel(manifest_rule["path"], "plugin_manifests.path")
        expected[rel] = (_update_plugin_manifest(repo_root, manifest_rule, owner), 0o644)

    preserve_rules = list(config.get("preserve_carrier_files") or [])
    default_prune_roots = [_join_rel(target_prefix, r) for r in normalized_roots]
    prune_root_rels = [
        _normalize_rel(p, "prune_roots", allow_trailing_slash=True)
        for p in (config.get("prune_roots") if config.get("prune_roots") is not None else default_prune_roots)
    ]
    unexpected_files: list[str] = []
    carrier_prefix = f"{carrier_rel}/"
    for prune_sub_rel in prune_root_rels:
        carrier_sub_rel = _join_rel(carrier_rel, prune_sub_rel)
        prune_abs = _resolve_contained(repo_root, carrier_sub_rel, "prune_roots")
        if not prune_abs.exists() and not prune_abs.is_symlink():
            continue
        if prune_abs.is_symlink():
            unexpected_files.append(carrier_sub_rel)
            continue
        if prune_abs.is_file():
            inside_rel = carrier_sub_rel[len(carrier_prefix):]
            if carrier_sub_rel not in expected and not _matches_preserve_rule(inside_rel, preserve_rules):
                unexpected_files.append(carrier_sub_rel)
            continue
        if not prune_abs.is_dir():
            continue

        def scan_prune(dir_abs: Path) -> None:
            for entry in dir_abs.iterdir():
                rel_from_repo = entry.relative_to(repo_root).as_posix()
                if entry.is_symlink():
                    unexpected_files.append(rel_from_repo)
                    continue
                if entry.is_dir():
                    scan_prune(entry)
                    continue
                if entry.is_file():
                    inside_rel = rel_from_repo[len(carrier_prefix):]
                    if rel_from_repo not in expected and not _matches_preserve_rule(inside_rel, preserve_rules):
                        unexpected_files.append(rel_from_repo)

        scan_prune(prune_abs)
    unexpected_files.sort()

    missing_files: list[str] = []
    drifted_files: list[str] = []
    written_files: list[str] = []
    unchanged_count = 0

    for target_rel in sorted(expected):
        target_bytes, target_mode = expected[target_rel]
        target_abs = _resolve_contained(repo_root, target_rel, "target")
        if target_abs.is_symlink():
            raise ValueError(f"Carrier projection target must not be a symbolic link: {target_rel}")
        if not target_abs.exists() or not target_abs.is_file():
            missing_files.append(target_rel)
            if not check_only:
                _assert_no_symlink_segments(repo_root, target_abs.parent, "target_parent")
                target_abs.parent.mkdir(parents=True, exist_ok=True)
                target_abs.write_bytes(target_bytes)
                if preserve_exec_mode:
                    os.chmod(target_abs, target_mode)
                written_files.append(target_rel)
            continue
        actual_bytes = target_abs.read_bytes()
        actual_mode = stat.S_IMODE(target_abs.lstat().st_mode)
        if actual_bytes == target_bytes and (not preserve_exec_mode or actual_mode == target_mode):
            unchanged_count += 1
            continue
        drifted_files.append(target_rel)
        if not check_only:
            _assert_no_symlink_segments(repo_root, target_abs.parent, "target_parent")
            target_abs.write_bytes(target_bytes)
            if preserve_exec_mode:
                os.chmod(target_abs, target_mode)
            written_files.append(target_rel)

    removed_files: list[str] = []
    if not check_only:
        for stale_rel in unexpected_files:
            stale_abs = _resolve_contained(repo_root, stale_rel, "stale_target")
            if stale_abs.is_symlink() or stale_abs.is_file():
                stale_abs.unlink()
                removed_files.append(stale_rel)

    has_drift = bool(missing_files or drifted_files or unexpected_files or (check_only and version_mismatches))
    report = {
        "surface_kind": "opl_carrier_projection",
        "schema_version": "opl_carrier_projection.v1",
        "materializer": "standalone_python",
        "mode": "check" if check_only else "write",
        "status": ("drifted" if has_drift else "passed") if check_only else "projected",
        "repo_root": str(repo_root),
        "carrier_root": carrier_rel,
        "projection_config_ref": config_rel,
        "projected_file_count": len(expected),
        "unchanged_count": unchanged_count,
        "written_files": written_files,
        "removed_files": removed_files,
        "missing_files": missing_files,
        "drifted_files": drifted_files,
        "unexpected_files": unexpected_files,
        "version_mismatches": version_mismatches if check_only else [],
        "authority_boundary": {
            "can_write_domain_truth": False,
            "can_sign_owner_receipt": False,
            "can_create_typed_blocker": False,
            "can_claim_domain_ready": False,
            "can_claim_production_ready": False,
        },
    }
    envelope = {
        "version": "g2",
        "pack_carrier_projection": report,
    }
    return (1 if check_only and has_drift else 0), envelope


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument(
        "--standalone",
        action="store_true",
        help="Force pure-Python projection without delegating to Framework opl CLI.",
    )
    args = parser.parse_args()

    if not args.standalone:
        opl_bin = resolve_opl_bin()
        if opl_bin:
            cmd = [opl_bin, "pack", "project-carrier", "--repo", str(ROOT), "--json"]
            if args.check:
                cmd.append("--check")
            try:
                completed = subprocess.run(cmd, check=False)
                return completed.returncode
            except OSError:
                pass

    returncode, envelope = project_carrier_standalone(ROOT, check_only=args.check)
    print(json.dumps(envelope, indent=2, ensure_ascii=False))
    return returncode


if __name__ == "__main__":
    raise SystemExit(main())
