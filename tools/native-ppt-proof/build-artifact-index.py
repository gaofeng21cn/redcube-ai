#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path


REQUIRED_REPORTS = [
    ("doctor_json", "doctor.json", "application/json", "runtime_doctor"),
    ("product_manifest_json", "product-manifest.json", "application/json", "product_entry"),
    ("product_status_json", "product-status.json", "application/json", "product_entry"),
    ("native_helper_input_json", "native-helper-input.json", "application/json", "native_helper"),
    ("native_helper_output_json", "native-helper-output.json", "application/json", "native_helper"),
    ("native_package_readback_json", "native-package-readback.json", "application/json", "native_quality"),
    ("native_quality_verdict_json", "native-quality-verdict.json", "application/json", "native_quality"),
    ("proof_summary_json", "proof-summary.json", "application/json", "proof_summary"),
]
REQUIRED_NATIVE_ARTIFACTS = [
    (
        "editable_pptx",
        "pptx_file",
        "native-helper/benchmark-author.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ),
    (
        "rendered_pdf",
        "pdf_file",
        "native-helper/benchmark-author.pdf",
        "application/pdf",
    ),
    (
        "shape_manifest_json",
        "shape_manifest_file",
        "native-helper/benchmark-shape-manifest.json",
        "application/json",
    ),
]
EXPECTED_PREVIEW_COUNT = 6
EXPECTED_RENDERER_PIPELINE = "libreoffice_headless_pdf_png_v1"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def artifact_entry(*, artifact_id, path, output_root, media_type, category, required=True):
    exists = path.exists()
    entry = {
        "artifact_id": artifact_id,
        "relative_path": path.relative_to(output_root).as_posix(),
        "media_type": media_type,
        "category": category,
        "required": required,
        "exists": exists,
    }
    if exists and path.is_file():
        entry["bytes"] = path.stat().st_size
        entry["sha256"] = file_sha256(path)
    return entry


def referenced_artifact_entry(
    *,
    artifact_id,
    reference,
    fallback_relative_path,
    output_root,
    media_type,
):
    source_ref_present = isinstance(reference, str) and bool(reference.strip())
    path = Path(reference).resolve() if source_ref_present else output_root / fallback_relative_path
    entry = artifact_entry(
        artifact_id=artifact_id,
        path=path,
        output_root=output_root,
        media_type=media_type,
        category="native_render",
    )
    entry["source_ref_present"] = source_ref_present
    return entry


def build_index(output_root):
    output_root = output_root.resolve()
    helper_report = output_root / "native-helper-output.json"
    summary_report = output_root / "proof-summary.json"
    helper = read_json(helper_report) if helper_report.exists() else {}
    summary = read_json(summary_report) if summary_report.exists() else {}
    render_proof = helper.get("render_proof", {})

    artifacts = [
        artifact_entry(
            artifact_id=artifact_id,
            path=output_root / relative_path,
            output_root=output_root,
            media_type=media_type,
            category=category,
        )
        for artifact_id, relative_path, media_type, category in REQUIRED_REPORTS
    ]

    for (
        artifact_id,
        helper_key,
        fallback_relative_path,
        media_type,
    ) in REQUIRED_NATIVE_ARTIFACTS:
        artifacts.append(
            referenced_artifact_entry(
                artifact_id=artifact_id,
                reference=helper.get(helper_key),
                fallback_relative_path=fallback_relative_path,
                output_root=output_root,
                media_type=media_type,
            )
        )

    raw_preview_refs = render_proof.get("preview_screenshots", [])
    preview_refs = raw_preview_refs if isinstance(raw_preview_refs, list) else []
    preview_refs = [
        reference
        for reference in preview_refs
        if isinstance(reference, str) and reference.strip()
    ]
    declared_preview_paths = [
        Path(reference).resolve().as_posix()
        for reference in preview_refs
    ]
    declared_preview_refs = set(declared_preview_paths)
    for index in range(1, EXPECTED_PREVIEW_COUNT + 1):
        reference = preview_refs[index - 1] if index <= len(preview_refs) else None
        artifacts.append(
            referenced_artifact_entry(
                artifact_id=f"preview_png_{index:02d}",
                reference=reference,
                fallback_relative_path=f"native-helper/previews/slide-{index:02d}.png",
                output_root=output_root,
                media_type="image/png",
            )
        )

    missing_required = [
        artifact["artifact_id"]
        for artifact in artifacts
        if artifact["required"]
        and (
            not artifact["exists"]
            or artifact.get("source_ref_present") is False
        )
    ]
    summary_native_helper = summary.get("native_helper", {})
    raw_summary_preview_refs = summary_native_helper.get("preview_screenshots", [])
    summary_preview_refs = (
        raw_summary_preview_refs if isinstance(raw_summary_preview_refs, list) else []
    )
    summary_preview_refs = [
        reference
        for reference in summary_preview_refs
        if isinstance(reference, str) and reference.strip()
    ]
    summary_preview_paths = [
        Path(reference).resolve().as_posix()
        for reference in summary_preview_refs
    ]
    summary_package_readback = summary.get("native_package_readback", {})
    summary_quality_verdict = summary.get("native_quality_verdict", {})
    required_checks = [
        ("proof_summary_status", summary.get("status") == "passed"),
        (
            "renderer_pipeline",
            summary_native_helper.get("renderer_pipeline") == EXPECTED_RENDERER_PIPELINE,
        ),
        (
            "native_helper_page_count",
            summary_native_helper.get("page_count") == EXPECTED_PREVIEW_COUNT,
        ),
        (
            "native_package_slide_count",
            summary_package_readback.get("slide_count") == EXPECTED_PREVIEW_COUNT,
        ),
        (
            "native_quality_verdict_status",
            summary_quality_verdict.get("status") == "pass_candidate",
        ),
        ("preview_png_count", len(preview_refs) == EXPECTED_PREVIEW_COUNT),
        ("preview_png_unique", len(preview_refs) == len(declared_preview_refs)),
        (
            "preview_summary_binding",
            summary_preview_paths == declared_preview_paths,
        ),
    ]
    failed_required_checks = [
        check_id for check_id, passed in required_checks if not passed
    ]

    return {
        "schema_version": "native_ppt_proof_artifact_index.v2",
        "output_root": output_root.as_posix(),
        "status": "failed" if missing_required or failed_required_checks else "passed",
        "missing_required_artifacts": missing_required,
        "failed_required_checks": failed_required_checks,
        "retention_contract": {
            "required_artifact_ids": [artifact["artifact_id"] for artifact in artifacts if artifact["required"]],
            "preview_png_count": len(preview_refs),
            "preview_png_unique_count": len(declared_preview_refs),
            "summary_preview_png_count": len(summary_preview_paths),
            "preview_summary_bound": summary_preview_paths == declared_preview_paths,
            "doctor_status": summary.get("doctor_status"),
            "proof_summary_status": summary.get("status"),
            "renderer_pipeline": summary_native_helper.get("renderer_pipeline"),
            "native_helper_page_count": summary_native_helper.get("page_count"),
            "native_package_slide_count": summary_package_readback.get("slide_count"),
            "native_quality_verdict_status": summary_quality_verdict.get("status"),
        },
        "artifacts": artifacts,
    }


def main():
    parser = argparse.ArgumentParser(description="Build native PPT proof artifact index.")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--index-file", default=None)
    args = parser.parse_args()

    output_root = Path(args.output_dir).resolve()
    index_file = Path(args.index_file).resolve() if args.index_file else output_root / "artifact-index.json"
    artifact_index = build_index(output_root)
    index_file.write_text(json.dumps(artifact_index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(artifact_index, ensure_ascii=False, indent=2))
    if artifact_index["status"] != "passed":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
