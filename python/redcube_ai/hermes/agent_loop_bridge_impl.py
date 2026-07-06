from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


RETIREMENT_BOUNDARY = {
    "backend_lifecycle": "historical_opt_in_deferred_external_adapter",
    "rca_default_backend": False,
    "adapter_deletion_gate_owner": "opl_agent_executor_adapter",
    "adapter_deletion_gate": [
        "opl_agent_executor_adapter_default_caller_parity",
        "attempt_ledger_runtime_record_parity",
        "rca_route_policy_and_receipt_refs_preserved",
        "focused_proof_tests_migrated_to_opl_owned_surface",
        "no_active_rca_caller_scan",
        "rca_owner_receipt_or_typed_blocker",
    ],
}


def _retired_payload(action: str) -> dict[str, Any]:
    return {
        "ok": False,
        "action": action,
        "error_kind": "hermes_agent_loop_retired",
        "blocking_reason": (
            "RCA-owned Hermes-Agent loop bridge implementation has been retired; "
            "use OPL executor adapter receipt refs instead."
        ),
        "retirement_boundary": RETIREMENT_BOUNDARY,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Retired RedCube AI Hermes-Agent loop bridge boundary."
    )
    parser.add_argument("request_json", nargs="?", help="Retired probe/generate request JSON file.")
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    action = "probe"
    if args.request_json:
        request = json.loads(Path(args.request_json).read_text(encoding="utf-8"))
        action = str(request.get("action") or "probe").strip() or "probe"
    sys.stdout.write(json.dumps(_retired_payload(action), ensure_ascii=False))
    sys.stdout.write("\n")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
