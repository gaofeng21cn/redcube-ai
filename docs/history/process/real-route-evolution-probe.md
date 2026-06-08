# RCA Real Route Evolution Probe

Owner: `RedCube AI`
Purpose: `real_route_evolution_probe_provenance`
State: `history_process`
Machine boundary: 本文是人读 probe provenance。机器真相继续归 `scripts/run-real-route-evolution-probe.ts`、contracts、product-entry invoke 行为、workspace/runtime artifacts、route artifacts、review/export gates、typed blockers、probe JSON 输出和 focused tests。

## Lifecycle Readout

本文从 `docs/delivery/` 归入 process history，只保留 real-route evolution probe 的压缩历史读法和 current owner map。它不再维护可复制命令、输出字段手册、物理样片路径长清单、run/proof transcript 或效率读数表。

当前 delivery truth 回到 `docs/delivery/README.md`、route support docs、contracts、runtime-family source、workspace artifacts、review/export gates 和 owner receipts。`scripts/run-real-route-evolution-probe.ts` 是 repo-native machine probe；是否可执行、参数、输出字段、cache 行为、typed blocker 和测试覆盖以脚本、contracts 与 tests 为准。

## Current Owner Map

| Theme | Current owner |
| --- | --- |
| Probe command, mock/live mode, route timeout, output files | `scripts/run-real-route-evolution-probe.ts` |
| Product-entry route evidence | `redcube product invoke --task-intent run_deliverable_route`, domain-entry source, workspace artifacts, review/export gates |
| Probe regression coverage | `tests/real-route-evolution-probe.test.ts`, `tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts` |
| Image-first route support | `docs/delivery/image-first-ppt-production-route.md`, `contracts/runtime-program/ppt-image-first-production-route.json`, route source/tests |
| Native PPTX proof environment | `docs/delivery/native-ppt-proof-environment.md`, native helper contracts/source/tests |
| Three-route AgentLab refs-only boundary | `contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json`, `tests/rca-ppt-three-route-agent-lab-suite.test.ts` |
| Production evidence and readiness boundary | `docs/active/rca-ideal-state-gap-plan.md`, `contracts/production_acceptance/rca-production-acceptance.json`, runtime evidence, owner receipts, typed blockers |

## Historical Read

The retained historical facts are intentionally narrow:

- The probe established that RCA route execution can produce artifacts, reuse cache on repeated input, preserve review/export gates, and emit typed blockers when provider or route execution fails.
- The three lanes are `image`, `html`, and `native`; `image` remains the default route, while `html` and `native` are explicit optional routes with the same review/export gate boundary.
- AgentLab / OPL Meta Agent / takeover evidence is refs-only control-plane evidence. It cannot replace RCA product-entry workspace artifacts, RCA review/export gates, or RCA owner receipts.
- Historical native sample roots, absolute paths, run ids, screenshots, attempt ids and timing figures are provenance only. They do not prove visual ready, exportable, handoffable, domain ready, production ready, or production visual-stage long soak complete.
- Mock provider/helper proof proves plumbing, cache behavior, hard-count regression, fail-closed typed blockers and file wiring. It is not visual quality proof.

## No-Resurrection Rules

- Do not move probe commands, output-field specs, sample root paths, run ids or long transcript snippets back into current delivery docs or active docs.
- Do not treat this historical record as a runnable contract. Use scripts, contracts and focused tests.
- Do not use AgentLab suite score, mock provider output, route cache hit, or a single native sample to claim RCA visual quality, export readiness, handoff readiness, domain readiness or production readiness.
- Do not bypass `visual_director_review`, `screenshot_review` or `export_pptx` because an upstream authoring stage hit cache.

## Verification Pointers

For repo-native regression, use the current test/script owners:

```bash
npm run --silent build
node --experimental-strip-types --test tests/real-route-evolution-probe.test.ts
node --experimental-strip-types --test tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts
```

These commands are pointers to current machine owners. If they change, update the script/tests/contracts first, then keep this history record as provenance.
