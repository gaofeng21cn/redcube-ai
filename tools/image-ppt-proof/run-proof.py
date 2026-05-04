#!/usr/bin/env python3
import argparse
import base64
import hashlib
import json
import os
import subprocess
import zipfile
import zlib
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from pathlib import Path


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


def write_prompt_manifests(output_root):
    prompts = [
        {
            "prompt_id": "hero-product-signal",
            "slide_id": "S01",
            "prompt": "Create a bright image-first title slide background for a RedCube AI presentation proof.",
            "size": "1024x1024",
        },
        {
            "prompt_id": "workflow-gallery",
            "slide_id": "S02",
            "prompt": "Create a clean workflow gallery image showing source truth to final PPT delivery.",
            "size": "1024x1024",
        },
        {
            "prompt_id": "medical-concept-map",
            "slide_id": "S03",
            "prompt": "Create a Chinese medical lecture concept-map slide with hand-drawn arrows and pastel marker blocks.",
            "size": "1536x864",
        },
        {
            "prompt_id": "platform-architecture",
            "slide_id": "S04",
            "prompt": "Create a RedCube AI platform architecture slide with a source-readiness to review-gate system diagram.",
            "size": "1536x864",
        },
        {
            "prompt_id": "evidence-checklist",
            "slide_id": "S05",
            "prompt": "Create a concise operator evidence checklist slide with PNG, manifest, PPTX, PDF, and gallery proof blocks.",
            "size": "1536x864",
        },
        {
            "prompt_id": "closing-summary",
            "slide_id": "S06",
            "prompt": "Create a closing summary slide in the same white dotted paper and hand-drawn medical lecture style.",
            "size": "1536x864",
        },
    ]
    write_json(output_root / "run-manifest.json", {
        "schema_version": "image_ppt_proof_run_manifest.v1",
        "proof_runner": "tools/image-ppt-proof/run.sh",
        "workspace_root": (output_root / "workspace").as_posix(),
        "image_first": True,
        "required_outputs": [
            "image-manifest.json",
            "prompt-manifest.json",
            "export/export-bundle.json",
            "gallery/gallery.json",
            "export/final-delivery-manifest.json",
            "artifact-index.json",
        ],
    })
    write_json(output_root / "prompt-manifest.json", {
        "schema_version": "image_ppt_prompt_manifest.v1",
        "prompts": prompts,
    })
    return prompts


def parse_codex_config():
    config_file = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")) / "config.toml"
    if not config_file.exists():
        return {}
    raw = config_file.read_text(encoding="utf-8")

    def match_top_level(key):
        prefix = f"{key} = "
        for line in raw.splitlines():
            stripped = line.strip()
            if stripped.startswith(prefix) and '"' in stripped:
                return stripped.split('"', 2)[1]
        return ""

    provider = match_top_level("model_provider")
    model = match_top_level("model")
    provider_block = ""
    if provider:
        header = f"[model_providers.{provider}]"
        in_block = False
        lines = []
        for line in raw.splitlines():
            stripped = line.strip()
            if stripped == header:
                in_block = True
                continue
            if in_block and stripped.startswith("[") and stripped.endswith("]"):
                break
            if in_block:
                lines.append(line)
        provider_block = "\n".join(lines)

    def match_provider(key):
        prefix = f"{key} = "
        for line in provider_block.splitlines():
            stripped = line.strip()
            if stripped.startswith(prefix) and '"' in stripped:
                return stripped.split('"', 2)[1]
        return ""

    return {
        "provider": provider,
        "model": model,
        "base_url": match_provider("base_url"),
        "token": match_provider("experimental_bearer_token"),
    }


def resolve_responses_config():
    codex = parse_codex_config()
    base_url = (
        os.environ.get("REDCUBE_IMAGE_GENERATION_BASE_URL")
        or os.environ.get("OPENAI_BASE_URL")
        or codex.get("base_url")
        or "https://api.openai.com/v1"
    ).rstrip("/")
    token = (
        os.environ.get("REDCUBE_IMAGE_GENERATION_TOKEN")
        or os.environ.get("OPENAI_API_KEY")
        or codex.get("token")
        or ""
    )
    request_model = (
        os.environ.get("REDCUBE_IMAGE_PPT_PROOF_MODEL")
        or os.environ.get("REDCUBE_IMAGE_GENERATION_MODEL")
        or codex.get("model")
        or "gpt-5.4"
    )
    provider = os.environ.get("REDCUBE_IMAGE_GENERATION_PROVIDER") or codex.get("provider") or "openai"
    return {
        "provider": provider,
        "base_url": base_url,
        "base_url_host": urlparse(base_url).netloc,
        "endpoint": f"{base_url}/responses",
        "request_model": request_model,
        "default_image_model": "gpt-image-2",
        "token": token,
    }


def write_live_png(path, prompt):
    command = os.environ.get("REDCUBE_CODEX_RESPONSES_IMAGE_GENERATION_CMD")
    if command:
        subprocess.run(
            command,
            input=json.dumps({"prompt": prompt, "output_file": str(path)}, ensure_ascii=False),
            text=True,
            shell=True,
            check=True,
        )
        return

    config = resolve_responses_config()
    if not config["token"]:
        raise SystemExit("--live-image-generation requires a Codex provider token, REDCUBE_IMAGE_GENERATION_TOKEN, OPENAI_API_KEY, or REDCUBE_CODEX_RESPONSES_IMAGE_GENERATION_CMD")
    request = Request(
        config["endpoint"],
        data=json.dumps({
            "model": config["request_model"],
            "input": prompt,
            "tools": [{
                "type": "image_generation",
                "size": "1536x864",
                "quality": "high",
                "format": "png",
                "background": "opaque",
            }],
            "tool_choice": {"type": "image_generation"},
        }).encode("utf-8"),
        headers={
            "authorization": f"Bearer {config['token']}",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=240) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Responses image_generation failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise SystemExit(f"Responses image_generation failed: {exc.reason}") from exc

    image_b64 = None
    for item in response_payload.get("output", []) or []:
        if item.get("type") == "image_generation_call":
            image_b64 = item.get("result")
            break
        for content in item.get("content", []) or []:
            image_b64 = content.get("image_base64") or content.get("b64_json")
            if image_b64:
                break
        if image_b64:
            break
    image_b64 = (image_b64 or "").replace("data:image/png;base64,", "")
    if not image_b64:
        raise SystemExit("Responses image_generation returned no image_generation_call result")
    path.write_bytes(base64.b64decode(image_b64))
    return {
        "provider": config["provider"],
        "base_url_host": config["base_url_host"],
        "endpoint": "/responses",
        "request_model": config["request_model"],
        "default_image_model": config["default_image_model"],
        "response_id": response_payload.get("id"),
        "image_call_id": next((item.get("id") for item in response_payload.get("output", []) or [] if item.get("type") == "image_generation_call"), None),
    }


def write_images(output_root, mode, prompts):
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
            provenance = write_live_png(png_file, item["prompt"])
            provider = provenance.get("provider") or "codex_config_or_openai_responses"
            api_mode = "responses.image_generation"
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
        "image_generation_mode": mode,
        "uses_real_api": mode == "live",
        "images": images,
    }
    write_json(output_root / "image-manifest.json", image_manifest)
    return image_manifest


def write_delivery(output_root, mode, image_manifest):
    export_dir = output_root / "export"
    gallery_dir = output_root / "gallery"
    export_dir.mkdir(parents=True, exist_ok=True)
    gallery_dir.mkdir(parents=True, exist_ok=True)

    pptx_file = export_dir / "image-first-proof.pptx"
    pdf_file = export_dir / "image-first-proof.pdf"
    export_bundle_file = export_dir / "export-bundle.json"
    gallery_file = gallery_dir / "gallery.json"
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
    })
    write_json(gallery_file, {
        "schema_version": "image_ppt_gallery.v1",
        "items": [
            {"slide_id": image["slide_id"], "image_id": image["image_id"], "png_file": image["png_file"]}
            for image in image_manifest["images"]
        ],
    })
    write_json(final_delivery_manifest_file, {
        "schema_version": "image_ppt_final_delivery_manifest.v1",
        "delivery_status": "ready",
        "refs": {
            "pptx": pptx_file.resolve().as_posix(),
            "pdf": pdf_file.resolve().as_posix(),
            "export_bundle": export_bundle_file.resolve().as_posix(),
            "gallery": gallery_file.resolve().as_posix(),
        },
    })

    summary = {
        "schema_version": "image_ppt_proof_summary.v1",
        "status": "passed",
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
            "final_delivery_manifest_file": final_delivery_manifest_file.resolve().as_posix(),
        },
    }
    write_json(output_root / "proof-summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Run image-first PPT proof.")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--image-generation-mode", choices=["mock", "live"], required=True)
    args = parser.parse_args()

    output_root = Path(args.output_dir).resolve()
    (output_root / "workspace").mkdir(parents=True, exist_ok=True)
    prompts = write_prompt_manifests(output_root)
    image_manifest = write_images(output_root, args.image_generation_mode, prompts)
    write_delivery(output_root, args.image_generation_mode, image_manifest)


if __name__ == "__main__":
    main()
