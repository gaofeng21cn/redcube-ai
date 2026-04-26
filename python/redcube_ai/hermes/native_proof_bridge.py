from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Any


def _normalize_text(value: Any) -> str | None:
    text = str(value or "").strip()
    return text or None


def _normalize_model_default(payload: Any) -> str | None:
    if isinstance(payload, dict):
        return _normalize_text(payload.get("default"))
    return _normalize_text(payload)


def _normalize_contract(config: dict[str, Any]) -> dict[str, Any]:
    model_config = config.get("model", {}) if isinstance(config.get("model"), dict) else {}
    agent_config = config.get("agent", {}) if isinstance(config.get("agent"), dict) else {}

    model = (
        _normalize_text(os.environ.get("REDCUBE_HERMES_MODEL"))
        or _normalize_model_default(model_config)
    )
    if model is None:
        raise RuntimeError(
            "Hermes-native proof 缺少可执行 model：请在 `~/.hermes/config.yaml` 提供 `model.default`，"
            "或显式设置 `REDCUBE_HERMES_MODEL`。"
        )

    provider = _normalize_text(os.environ.get("REDCUBE_HERMES_PROVIDER")) or _normalize_text(model_config.get("provider"))
    base_url = _normalize_text(os.environ.get("REDCUBE_HERMES_BASE_URL")) or _normalize_text(model_config.get("base_url"))
    api_mode = _normalize_text(os.environ.get("REDCUBE_HERMES_API_MODE")) or _normalize_text(model_config.get("api_mode"))
    reasoning_effort = (
        _normalize_text(os.environ.get("REDCUBE_HERMES_REASONING_EFFORT"))
        or _normalize_text(agent_config.get("reasoning_effort"))
    )

    return {
        "entrypoint": "run_agent.AIAgent.run_conversation",
        "full_agent_loop_required": True,
        "model": model,
        "provider": provider,
        "base_url": base_url,
        "api_mode": api_mode,
        "reasoning_effort": reasoning_effort,
        "model_selection": "inherit_local_hermes_default",
        "reasoning_selection": "inherit_local_hermes_default",
    }


def _load_dependencies() -> tuple[Any, Any, Any]:
    try:
        from hermes_cli.config import load_config
        from hermes_constants import parse_reasoning_effort
        from run_agent import AIAgent
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Hermes-native proof bridge 无法导入上游 Hermes-Agent 依赖。"
        ) from exc
    return load_config, parse_reasoning_effort, AIAgent


def _preview(value: Any, limit: int = 240) -> str:
    text = str(value)
    return text if len(text) <= limit else f"{text[:limit]}..."


def _parse_json_object(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        return payload
    if not isinstance(payload, str) or not payload.strip():
        raise RuntimeError("Hermes-native proof 未返回 final JSON object。")
    stripped = payload.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()
    parsed = json.loads(stripped)
    if not isinstance(parsed, dict):
        raise RuntimeError("Hermes-native proof final response 顶层必须是 JSON object。")
    return parsed


@contextmanager
def _pushd(cwd: Path):
    previous = Path.cwd()
    os.chdir(cwd)
    try:
        yield
    finally:
        os.chdir(previous)


def _build_bridge_prompt(prompt_file: Path) -> str:
    return (
        "You are running the RedCube AI Hermes-native structured generation proof.\n"
        "Before producing the final answer, use the available file-reading tool to read this prompt file exactly once:\n"
        f"{prompt_file}\n"
        "Then follow the prompt faithfully and return a JSON object only.\n"
        "Do not browse external sources.\n"
    )


def _run_generate(request: dict[str, Any]) -> dict[str, Any]:
    load_config, parse_reasoning_effort, agent_factory = _load_dependencies()
    config = load_config() if callable(load_config) else {}
    contract = _normalize_contract(config if isinstance(config, dict) else {})

    cwd = Path(str(request.get("cwd") or "")).expanduser().resolve()
    if not cwd.exists():
        raise RuntimeError(f"Hermes-native proof working directory 不存在: {cwd}")

    prompt_text = str(request.get("prompt") or "").strip()
    if not prompt_text:
        raise RuntimeError("Hermes-native proof 缺少 prompt。")

    events: list[dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="redcube-hermes-native-proof-") as temp_dir:
        prompt_file = Path(temp_dir) / "prompt.md"
        prompt_file.write_text(prompt_text, encoding="utf-8")

        agent = agent_factory(
            quiet_mode=True,
            model=contract["model"],
            provider=contract["provider"] or None,
            base_url=contract["base_url"] or None,
            api_mode=contract["api_mode"] or None,
            reasoning_config=parse_reasoning_effort(contract["reasoning_effort"] or ""),
            skip_context_files=True,
            skip_memory=True,
            tool_start_callback=lambda _tcid, name, args: events.append(
                {"type": "tool_start", "tool": name, "args": args}
            ),
            tool_complete_callback=lambda _tcid, name, _args, result: events.append(
                {"type": "tool_complete", "tool": name, "result_preview": _preview(result)}
            ),
            step_callback=lambda step_index, previous_tools: events.append(
                {"type": "step", "step": step_index, "prev_tool_count": len(previous_tools)}
            ),
            status_callback=lambda event_name, message: events.append(
                {"type": "status", "event": event_name, "message": _preview(message)}
            ),
            reasoning_callback=lambda text: events.append(
                {"type": "reasoning", "preview": _preview(text)}
            ),
        )
        try:
            with _pushd(cwd):
                result = agent.run_conversation(_build_bridge_prompt(prompt_file))
        finally:
            close = getattr(agent, "close", None)
            if callable(close):
                close()

    if not isinstance(result, dict):
        raise RuntimeError("Hermes-native proof 返回值必须是 object。")
    if not result.get("completed"):
        raise RuntimeError("Hermes-native proof 未完成完整 agent loop。")

    tool_start_events = [event for event in events if event.get("type") == "tool_start"]
    tool_complete_events = [event for event in events if event.get("type") == "tool_complete"]
    if not tool_start_events or not tool_complete_events:
        raise RuntimeError("Hermes-native proof 未触发任何工具事件，不接受 chat-only 结果。")

    payload = _parse_json_object(result.get("final_response"))
    proof = {
        "proof_kind": "full_agent_loop_aiaagent",
        "full_agent_loop_proved": True,
        "session_id": _normalize_text(getattr(agent, "session_id", None)),
        "api_calls": int(result.get("api_calls") or 0),
        "tool_call_count": len(tool_start_events),
        "event_count": len(events),
        "event_stream": events,
        "reasoning_semantics_status": "not_proved"
        if contract["provider"] != "custom" or contract["api_mode"] != "chat_completions"
        else "unproven_custom_chat_completions",
    }
    return {
        "ok": True,
        "payload": payload,
        "contract": contract,
        "proof": proof,
    }


def _run_probe() -> dict[str, Any]:
    load_config, _parse_reasoning_effort, _agent_factory = _load_dependencies()
    config = load_config() if callable(load_config) else {}
    contract = _normalize_contract(config if isinstance(config, dict) else {})
    return {
        "ok": True,
        "contract": contract,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the RedCube AI Hermes-native proof bridge from a request JSON file."
    )
    parser.add_argument("request_json", help="Path to a probe or generate request JSON file.")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    request_path = str(args.request_json).strip()
    request = json.loads(Path(request_path).read_text(encoding="utf-8"))
    action = str(request.get("action") or "").strip()
    if action == "probe":
        payload = _run_probe()
    elif action == "generate":
        payload = _run_generate(request)
    else:
        raise RuntimeError(f"Unsupported Hermes-native proof bridge action: {action}")
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        sys.stderr.write(f"{exc}\n")
        raise
