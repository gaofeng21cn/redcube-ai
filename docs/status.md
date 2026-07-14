# RedCube AI 当前状态

Owner: RedCube AI
Purpose: 给出当前 admitted source、结构收口与验证口径。
State: candidate_validation_pending
Machine boundary: exact 状态以 Git SHA、root contracts、OPL admission JSON 与 test output 为准。

Date anchor: 2026-07-14

## 当前结论

RCA 已按标准 OPL Agent 目标完成私有平台源码的结构性退役，候选正在执行最终验证。最终吸收前不把本文件状态解读为 production-ready。

## 保留的 active source

- `agent/`：declarative visual pack；
- `contracts/`：package/pack/interface/authority/policy/schema/evidence refs；
- `python/redcube_ai/native_helpers/`：RCA native helper；
- `runtime/authority_functions/`：最小 authority 声明；
- `plugins/redcube-ai/`：Codex carrier mirror；
- `tools/`、`scripts/`、`tests/`：developer proof、边界校验和 native-helper 回归，不是 runtime。

## 已退役的 private control plane

- `apps/redcube-cli`；
- `packages/redcube-domain-entry`；
- `packages/redcube-runtime` 与 `packages/redcube-runtime-protocol`；
- `packages/redcube-governance`；
- `packages/redcube-overlay-core`；
- repo-local current-program baton、私有 product-entry/session/runtime contracts；
- 对应 CLI/runtime/product-entry tests、mock executor、case helper 与 compatibility aliases。

## 当前机器入口

| Surface | Source | Owner |
| --- | --- | --- |
| Package identity/lifecycle sidecar | `contracts/opl_agent_package_manifest.json` | RCA 声明，OPL Connect 管理 lifecycle |
| Domain descriptor | `contracts/domain_descriptor.json` | RCA |
| Hosted actions | `contracts/action_catalog.json` | RCA 语义，OPL 生成/托管 |
| Stage graph | `agent/stages/manifest.json` | RCA 语义，OPL StageRun 执行 |
| Standard interface | `contracts/standard_agent_interface.json` | RCA 声明，OPL compiler 消费 |
| Native helpers | `contracts/runtime-program/python-native-helper-catalog.json` | RCA 实现，OPL envelope 执行 |
| Private-platform guard | `scripts/check-private-platform-retirement.ts` | repo verification only |

## 验证门

候选必须同时满足：

1. `npm run typecheck`；
2. `npm run test:smoke`、`npm run test:fast`、`npm run test:full`；
3. `npm run test:private-platform:strict`；
4. `git diff --check` 与 repo hygiene；
5. OPL `agents interfaces --repo-dir ...`；
6. OPL `agents conformance --agent rca=...`；
7. source-closure 0 unresolved / 0 private-generic / 0 unreachable / 0 audit mismatch；
8. default callers closed、residue decisions verified zero。

## 后置证据

真实 visual StageRun、真实 image generation、真实 native PPT export、review/export acceptance、owner receipt、provider restart/resume 与 long-soak 不由本次结构迁移虚构。它们继续记录为 evidence gap，不能阻塞可独立完成的源码标准化，也不能被测试结果替代。
