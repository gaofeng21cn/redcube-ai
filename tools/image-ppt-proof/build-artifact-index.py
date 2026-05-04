#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path


REQUIRED_REPORTS = [
    ("run_manifest_json", "run-manifest.json", "application/json", "run_manifest"),
    ("prompt_manifest_json", "prompt-manifest.json", "application/json", "prompt_manifest"),
    ("image_manifest_json", "image-manifest.json", "application/json", "image_generation"),
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


def append_ref_artifact(artifacts, *, artifact_id, value, output_root, media_type, category):
    if value:
        artifacts.append(
            artifact_entry(
                artifact_id=artifact_id,
                path=Path(value).resolve(),
                output_root=output_root,
                media_type=media_type,
                category=category,
            )
        )


def build_index(output_root):
    output_root = output_root.resolve()
    image_manifest_file = output_root / "image-manifest.json"
    summary_file = output_root / "proof-summary.json"
    image_manifest = read_json(image_manifest_file) if image_manifest_file.exists() else {}
    summary = read_json(summary_file) if summary_file.exists() else {}

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

    for index, image in enumerate(image_manifest.get("images", []), start=1):
        append_ref_artifact(
            artifacts,
            artifact_id=f"generated_png_{index:02d}",
            value=image.get("png_file"),
            output_root=output_root,
            media_type="image/png",
            category="image_generation",
        )

    delivery = summary.get("delivery_artifacts", {})
    append_ref_artifact(
        artifacts,
        artifact_id="image_first_pptx",
        value=delivery.get("pptx_file"),
        output_root=output_root,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        category="final_delivery",
    )
    append_ref_artifact(
        artifacts,
        artifact_id="rendered_pdf",
        value=delivery.get("pdf_file"),
        output_root=output_root,
        media_type="application/pdf",
        category="final_delivery",
    )
    append_ref_artifact(
        artifacts,
        artifact_id="export_bundle_json",
        value=delivery.get("export_bundle_file"),
        output_root=output_root,
        media_type="application/json",
        category="export_bundle",
    )
    append_ref_artifact(
        artifacts,
        artifact_id="gallery_json",
        value=delivery.get("gallery_file"),
        output_root=output_root,
        media_type="application/json",
        category="gallery",
    )
    append_ref_artifact(
        artifacts,
        artifact_id="final_delivery_manifest_json",
        value=delivery.get("final_delivery_manifest_file"),
        output_root=output_root,
        media_type="application/json",
        category="final_delivery",
    )

    missing_required = [
        artifact["artifact_id"]
        for artifact in artifacts
        if artifact["required"] and not artifact["exists"]
    ]

    return {
        "schema_version": "image_ppt_proof_artifact_index.v1",
        "output_root": output_root.as_posix(),
        "status": "failed" if missing_required else "passed",
        "missing_required_artifacts": missing_required,
        "retention_contract": {
            "required_artifact_ids": [artifact["artifact_id"] for artifact in artifacts if artifact["required"]],
            "png_count": sum(1 for artifact in artifacts if artifact["media_type"] == "image/png"),
            "image_generation_mode": summary.get("image_generation_mode"),
            "proof_summary_status": summary.get("status"),
            "artifact_categories": sorted({artifact["category"] for artifact in artifacts}),
        },
        "artifacts": artifacts,
    }


def main():
    parser = argparse.ArgumentParser(description="Build image PPT proof artifact index.")
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
