#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path


REQUIRED_REPORTS = [
    ("doctor_json", "doctor.json", "application/json", "runtime_doctor"),
    ("product_manifest_json", "product-manifest.json", "application/json", "product_entry"),
    ("product_frontdesk_json", "product-frontdesk.json", "application/json", "product_entry"),
    ("native_helper_input_json", "native-helper-input.json", "application/json", "native_helper"),
    ("native_helper_output_json", "native-helper-output.json", "application/json", "native_helper"),
    ("proof_summary_json", "proof-summary.json", "application/json", "proof_summary"),
]


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

    native_artifacts = [
        ("editable_pptx", helper.get("pptx_file"), "application/vnd.openxmlformats-officedocument.presentationml.presentation", "native_render"),
        ("rendered_pdf", helper.get("pdf_file"), "application/pdf", "native_render"),
        ("shape_manifest_json", helper.get("shape_manifest_file"), "application/json", "native_render"),
    ]
    for artifact_id, file_path, media_type, category in native_artifacts:
        if file_path:
            artifacts.append(
                artifact_entry(
                    artifact_id=artifact_id,
                    path=Path(file_path).resolve(),
                    output_root=output_root,
                    media_type=media_type,
                    category=category,
                )
            )

    for index, file_path in enumerate(render_proof.get("preview_screenshots", []), start=1):
        artifacts.append(
            artifact_entry(
                artifact_id=f"preview_png_{index:02d}",
                path=Path(file_path).resolve(),
                output_root=output_root,
                media_type="image/png",
                category="native_render",
            )
        )

    missing_required = [
        artifact["artifact_id"]
        for artifact in artifacts
        if artifact["required"] and not artifact["exists"]
    ]
    preview_png_count = sum(1 for artifact in artifacts if artifact["media_type"] == "image/png")

    return {
        "schema_version": "native_ppt_proof_artifact_index.v2",
        "output_root": output_root.as_posix(),
        "status": "failed" if missing_required else "passed",
        "missing_required_artifacts": missing_required,
        "retention_contract": {
            "required_artifact_ids": [artifact["artifact_id"] for artifact in artifacts if artifact["required"]],
            "preview_png_count": preview_png_count,
            "doctor_status": summary.get("doctor_status"),
            "proof_summary_status": summary.get("status"),
            "renderer_pipeline": summary.get("native_helper", {}).get("renderer_pipeline"),
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
