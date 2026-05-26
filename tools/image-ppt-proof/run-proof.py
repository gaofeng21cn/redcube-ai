#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import subprocess
import zipfile
import zlib
from pathlib import Path


DEFAULT_FIXTURE = Path("tests/fixtures/ppt-image-first-lightweight/fixture.json")


def png_chunk(kind, data):
    payload = kind + data
    return len(data).to_bytes(4, "big") + kind + data + (zlib.crc32(payload) & 0xFFFFFFFF).to_bytes(4, "big")


def mock_png(width, height, seed):
    digest = hashlib.sha256(seed.encode("utf-8")).digest()
    bg = (248, 246, 238, 255)
    accent = tuple(80 + (value % 120) for value in digest[:3]) + (255,)
    raw_rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            band = ((x + int(y * 1.7)) % 181) < 5
            marker = width * 0.08 < x < width * 0.92 and height * 0.18 < y < height * 0.82 and ((x // 46 + y // 38) % 11 == 0)
            row.extend(accent if band or marker else bg)
        raw_rows.append(bytes(row))
    ihdr = (
        width.to_bytes(4, "big")
        + height.to_bytes(4, "big")
        + bytes([8, 6, 0, 0, 0])
    )
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(b"".join(raw_rows), 6))
        + png_chunk(b"IEND", b"")
    )


def png_dimensions(path):
    data = path.read_bytes()
    if len(data) >= 24 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return {
            "width": int.from_bytes(data[16:20], "big"),
            "height": int.from_bytes(data[20:24], "big"),
            "ratio": "16:9" if int.from_bytes(data[16:20], "big") * 9 == int.from_bytes(data[20:24], "big") * 16 else "custom",
        }
    return {"width": 0, "height": 0, "ratio": "unknown"}


def write_json(path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_fixture(path):
    fixture = read_json(path)
    pages = fixture.get("pages", [])
    max_slide_count = int(fixture.get("max_slide_count", 6))
    if not pages:
        raise SystemExit(f"Fixture has no pages: {path}")
    if len(pages) > max_slide_count or len(pages) > 6:
        raise SystemExit(f"Lightweight image PPT proof fixture must contain <=6 pages: {path}")
    canvas = fixture.get("canvas", {})
    width = int(canvas.get("width", 1536))
    height = int(canvas.get("height", 864))
    prompts = [
        {
            "prompt_id": page["prompt_id"],
            "slide_id": page["slide_id"],
            "prompt": page["prompt"],
            "size": f"{width}x{height}",
        }
        for page in pages
    ]
    return fixture, prompts


def write_prompt_manifests(output_root, fixture, prompts):
    write_json(output_root / "run-manifest.json", {
        "schema_version": "image_ppt_proof_run_manifest.v1",
        "proof_runner": "tools/image-ppt-proof/run.sh",
        "fixture_id": fixture.get("fixture_id"),
        "mode": fixture.get("mode", "lightweight_real_style_smoke"),
        "workspace_root": (output_root / "workspace").as_posix(),
        "image_first": True,
        "required_outputs": [
            "image-manifest.json",
            "prompt-manifest.json",
            "style-manifest.json",
            "review/review-summary.json",
            "export/export-bundle.json",
            "gallery/gallery.json",
            "gallery/final-gallery-manifest.json",
            "export/final-delivery-manifest.json",
            "artifact-index.json",
        ],
    })
    write_json(output_root / "prompt-manifest.json", {
        "schema_version": "image_ppt_prompt_manifest.v1",
        "fixture_id": fixture.get("fixture_id"),
        "profile_id": fixture.get("profile_id"),
        "mode": fixture.get("mode", "lightweight_real_style_smoke"),
        "max_slide_count": fixture.get("max_slide_count", 6),
        "prompts": prompts,
    })
    return prompts


def iter_style_reference_sources(fixture, style_reference_dir):
    if style_reference_dir:
        root = Path(style_reference_dir).expanduser().resolve()
        if not root.is_dir():
            raise SystemExit(f"--style-reference-dir must point to a directory: {style_reference_dir}")
        for source in sorted(root.iterdir()):
            if source.is_file() and source.suffix.lower() == ".png":
                yield {"filename": source.name, "source_file": source}
        return
    for seed in fixture.get("style_reference_seeds", []):
        yield {"filename": seed["filename"], "seed": seed["seed"]}


def write_style_manifest(output_root, fixture, style_reference_dir):
    style_dir = output_root / "style-references"
    style_dir.mkdir(parents=True, exist_ok=True)
    canvas = fixture.get("canvas", {})
    width = int(canvas.get("width", 1536))
    height = int(canvas.get("height", 864))
    references = []
    for index, source in enumerate(iter_style_reference_sources(fixture, style_reference_dir), start=1):
        filename = Path(source["filename"]).name
        artifact_file = style_dir / filename
        if "source_file" in source:
            artifact_file.write_bytes(source["source_file"].read_bytes())
        else:
            artifact_file.write_bytes(mock_png(width, height, source["seed"]))
        references.append({
            "reference_id": f"style-reference-{index:02d}",
            "filename": filename,
            "sha256": file_sha256(artifact_file),
            "dimensions": png_dimensions(artifact_file),
            "artifact_copy": artifact_file.relative_to(output_root).as_posix(),
        })

    if not references:
        raise SystemExit("Lightweight image PPT proof requires at least one style reference artifact copy")

    style_manifest = {
        "schema_version": "image_ppt_style_manifest.v1",
        "fixture_id": fixture.get("fixture_id"),
        "profile_id": fixture.get("profile_id"),
        "mode": fixture.get("mode", "lightweight_real_style_smoke"),
        "truth_policy": "style_reference_truth_is_hash_filename_dimensions_and_local_artifact_copy",
        "external_style_reference_dir_recorded_as_truth": False,
        "style_references": references,
    }
    write_json(output_root / "style-manifest.json", style_manifest)
    return style_manifest


def parse_codex_command(raw):
    value = (raw or "").strip()
    if value:
        if value.startswith("["):
            parsed = json.loads(value)
            if not isinstance(parsed, list) or not parsed:
                raise SystemExit("REDCUBE_CODEX_COMMAND JSON array must be non-empty")
            return [str(item).strip() for item in parsed if str(item).strip()]
        return [value]
    canonical = Path.home() / "bin" / "codex-canonical"
    if canonical.is_file() and os.access(canonical, os.X_OK):
        return [canonical.as_posix()]
    return ["codex"]


def resolve_codex_contract():
    return {
        "command": parse_codex_command(os.environ.get("REDCUBE_CODEX_COMMAND")),
        "sandbox": os.environ.get("REDCUBE_CODEX_SANDBOX") or "workspace-write",
        "model": os.environ.get("REDCUBE_CODEX_MODEL") or "",
        "reasoning_effort": os.environ.get("REDCUBE_CODEX_REASONING_EFFORT") or "",
        "model_selection": os.environ.get("REDCUBE_CODEX_MODEL") or "inherit_local_codex_default",
        "reasoning_selection": os.environ.get("REDCUBE_CODEX_REASONING_EFFORT") or "inherit_local_codex_default",
    }


def build_codex_native_imagegen_prompt(output_file, prompt, slide_id):
    return "\n".join([
        "你是 RedCube AI 的 Codex executor，负责执行一个 RCA image-first PPT proof visual artifact task。",
        "必须使用 Codex 原生 imagegen / image_generation 能力生成 raster PNG。不要使用脚本绘图、SVG、HTML 截图、占位图、外部 curl/fetch、显式 Base URL、显式 API key、OPENAI_API_KEY 或 REDCUBE_IMAGE_GENERATION_TOKEN。",
        "使用内置 imagegen 默认路径生成后，把最终 PNG 复制或移动到指定 output_file。不要把 project-bound asset 只留在 $CODEX_HOME/generated_images。",
        "如果需要读取 imagegen skill，请按本机 Codex skill 指南执行；不要切换到 CLI/API fallback。",
        f"family: ppt_deck",
        f"route: image_ppt_proof",
        f"slide_id: {slide_id}",
        f"output_file: {output_file}",
        'image_tool_options: {"type":"image_generation","size":"1536x864","quality":"high","format":"png","background":"opaque"}',
        "",
        "Image prompt:",
        prompt,
        "",
        "完成后只回复一行 JSON，不要附加说明：",
        json.dumps({"ok": True, "image_file": str(output_file), "mode": "codex_native_imagegen"}, ensure_ascii=False),
    ])


def parse_codex_events(stdout):
    events = []
    for line in (stdout or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


def write_live_png(path, prompt, slide_id):
    contract = resolve_codex_contract()
    last_message_file = path.parent / f".{path.stem}.codex-imagegen-last-message.json"
    args = [
        "exec",
        "--json",
        "--ephemeral",
        "--cd",
        Path.cwd().as_posix(),
        "--skip-git-repo-check",
        "-s",
        contract["sandbox"],
        "-c",
        'approval_policy="never"',
    ]
    if contract["reasoning_effort"]:
        args.extend(["-c", f'model_reasoning_effort="{contract["reasoning_effort"]}"'])
    if contract["model"]:
        args.extend(["--model", contract["model"]])
    args.extend(["--output-last-message", last_message_file.as_posix(), "-"])

    task_prompt = build_codex_native_imagegen_prompt(path.resolve().as_posix(), prompt, slide_id)
    result = subprocess.run(
        [contract["command"][0], *contract["command"][1:], *args],
        input=task_prompt,
        text=True,
        capture_output=True,
        timeout=900,
        check=False,
    )
    events = parse_codex_events(result.stdout)
    run_id = next((event.get("run_id") for event in reversed(events) if event.get("run_id")), None)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "Codex native imagegen task failed").strip()
        raise SystemExit(detail)
    if not path.exists():
        raise SystemExit(f"Codex native imagegen task did not create output PNG: {path}")
    dimensions = png_dimensions(path)
    if dimensions["width"] <= 0 or dimensions["height"] <= 0:
        raise SystemExit(f"Codex native imagegen output is not a PNG: {path}")
    return {
        "provider": "codex_native_imagegen",
        "base_url_host": "codex_executor",
        "endpoint": "codex_native_imagegen_skill",
        "request_model": contract["model_selection"],
        "default_image_model": "codex_native_imagegen",
        "response_id": run_id,
        "image_call_id": None,
        "task_surface": "codex_native_imagegen_skill",
        "provider_token_required": False,
        "provider_token_source": "codex_executor_native_tool",
        "token_persisted": False,
    }


def write_images(output_root, mode, fixture, prompts):
    image_dir = output_root / "images"
    image_dir.mkdir(parents=True, exist_ok=True)
    images = []
    for index, item in enumerate(prompts, start=1):
        png_file = image_dir / f"{index:02d}-{item['prompt_id']}.png"
        if mode == "mock":
            png_file.write_bytes(mock_png(1536, 864, item["prompt"]))
            provider = "mock"
            api_mode = "none"
            provenance = {}
        else:
            provenance = write_live_png(png_file, item["prompt"], item["slide_id"])
            provider = provenance.get("provider") or "codex_native_imagegen"
            api_mode = "codex_native_imagegen_skill"
        images.append({
            "image_id": item["prompt_id"],
            "slide_id": item["slide_id"],
            "png_file": png_file.resolve().as_posix(),
            "dimensions": png_dimensions(png_file),
            "provider": provider,
            "api_mode": api_mode,
            "mock": mode == "mock",
            "provenance": {
                key: value for key, value in provenance.items()
                if key != "token" and value is not None
            },
        })

    image_manifest = {
        "schema_version": "image_ppt_image_manifest.v1",
        "fixture_id": fixture.get("fixture_id"),
        "profile_id": fixture.get("profile_id"),
        "mode": fixture.get("mode", "lightweight_real_style_smoke"),
        "image_generation_mode": mode,
        "uses_real_api": mode == "live",
        "images": images,
    }
    write_json(output_root / "image-manifest.json", image_manifest)
    return image_manifest


def write_delivery(output_root, mode, fixture, image_manifest, style_manifest):
    export_dir = output_root / "export"
    gallery_dir = output_root / "gallery"
    review_dir = output_root / "review"
    export_dir.mkdir(parents=True, exist_ok=True)
    gallery_dir.mkdir(parents=True, exist_ok=True)
    review_dir.mkdir(parents=True, exist_ok=True)

    pptx_file = export_dir / "image-first-proof.pptx"
    pdf_file = export_dir / "image-first-proof.pdf"
    export_bundle_file = export_dir / "export-bundle.json"
    gallery_file = gallery_dir / "gallery.json"
    final_gallery_manifest_file = gallery_dir / "final-gallery-manifest.json"
    review_summary_file = review_dir / "review-summary.json"
    final_delivery_manifest_file = export_dir / "final-delivery-manifest.json"

    with zipfile.ZipFile(pptx_file, "w", compression=zipfile.ZIP_DEFLATED) as deck:
        deck.writestr("[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"/>")
        deck.writestr("ppt/presentation.xml", "<presentation proof=\"image-first\"/>")
        for image in image_manifest["images"]:
            image_path = Path(image["png_file"])
            deck.write(image_path, f"ppt/media/{image_path.name}")
    pdf_file.write_bytes(b"%PDF-1.4\n% image-first proof placeholder\n%%EOF\n")
    write_json(export_bundle_file, {
        "schema_version": "image_ppt_export_bundle.v1",
        "source_visual_route": "author_image_pages",
        "editable": False,
        "pptx_file": pptx_file.resolve().as_posix(),
        "pdf_file": pdf_file.resolve().as_posix(),
        "image_manifest_file": (output_root / "image-manifest.json").resolve().as_posix(),
        "prompt_manifest_file": (output_root / "prompt-manifest.json").resolve().as_posix(),
        "style_manifest_file": (output_root / "style-manifest.json").resolve().as_posix(),
        "review_summary_file": review_summary_file.resolve().as_posix(),
    })
    write_json(gallery_file, {
        "schema_version": "image_ppt_gallery.v1",
        "items": [
            {"slide_id": image["slide_id"], "image_id": image["image_id"], "png_file": image["png_file"]}
            for image in image_manifest["images"]
        ],
    })
    write_json(final_gallery_manifest_file, {
        "schema_version": "image_ppt_final_gallery_manifest.v1",
        "fixture_id": fixture.get("fixture_id"),
        "status": "ready",
        "items": [
            {
                "slide_id": image["slide_id"],
                "image_id": image["image_id"],
                "png_file": image["png_file"],
                "sha256": file_sha256(Path(image["png_file"])),
                "dimensions": image["dimensions"],
            }
            for image in image_manifest["images"]
        ],
    })
    write_json(review_summary_file, {
        "schema_version": "image_ppt_review_summary.v1",
        "fixture_id": fixture.get("fixture_id"),
        "status": "passed",
        "image_count": len(image_manifest["images"]),
        "style_reference_count": len(style_manifest["style_references"]),
        "checks": {
            "lightweight_slide_count_lte_6": len(image_manifest["images"]) <= 6,
            "mock_mode_uses_real_api": mode == "live",
            "style_reference_truth_has_local_artifact_copy": all(
                reference.get("artifact_copy") and reference.get("sha256") and reference.get("filename")
                for reference in style_manifest["style_references"]
            ),
        },
    })
    write_json(final_delivery_manifest_file, {
        "schema_version": "image_ppt_final_delivery_manifest.v1",
        "delivery_status": "ready",
        "refs": {
            "pptx": pptx_file.resolve().as_posix(),
            "pdf": pdf_file.resolve().as_posix(),
            "export_bundle": export_bundle_file.resolve().as_posix(),
            "gallery": gallery_file.resolve().as_posix(),
            "final_gallery_manifest": final_gallery_manifest_file.resolve().as_posix(),
            "review_summary": review_summary_file.resolve().as_posix(),
        },
    })

    summary = {
        "schema_version": "image_ppt_proof_summary.v1",
        "status": "passed",
        "fixture_id": fixture.get("fixture_id"),
        "source_visual_route": "author_image_pages",
        "editable": False,
        "image_generation_mode": mode,
        "uses_real_api": mode == "live",
        "png_count": len(image_manifest["images"]),
        "delivery_artifacts": {
            "pptx_file": pptx_file.resolve().as_posix(),
            "pdf_file": pdf_file.resolve().as_posix(),
            "export_bundle_file": export_bundle_file.resolve().as_posix(),
            "gallery_file": gallery_file.resolve().as_posix(),
            "gallery_final_manifest_file": final_gallery_manifest_file.resolve().as_posix(),
            "style_manifest_file": (output_root / "style-manifest.json").resolve().as_posix(),
            "review_summary_file": review_summary_file.resolve().as_posix(),
            "final_delivery_manifest_file": final_delivery_manifest_file.resolve().as_posix(),
        },
    }
    write_json(output_root / "proof-summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Run image-first PPT proof.")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--image-generation-mode", choices=["mock", "live"], required=True)
    parser.add_argument("--fixture", default=DEFAULT_FIXTURE.as_posix())
    parser.add_argument("--style-reference-dir", default="")
    args = parser.parse_args()

    output_root = Path(args.output_dir).resolve()
    (output_root / "workspace").mkdir(parents=True, exist_ok=True)
    fixture_file = Path(args.fixture).resolve()
    fixture, prompts = load_fixture(fixture_file)
    prompts = write_prompt_manifests(output_root, fixture, prompts)
    style_manifest = write_style_manifest(output_root, fixture, args.style_reference_dir)
    image_manifest = write_images(output_root, args.image_generation_mode, fixture, prompts)
    write_delivery(output_root, args.image_generation_mode, fixture, image_manifest, style_manifest)


if __name__ == "__main__":
    main()
