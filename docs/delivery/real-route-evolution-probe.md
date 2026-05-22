# RCA Real Route Evolution Probe

Owner: `RedCube AI`
Purpose: `real_route_evolution_probe_support`
State: `active_support`
Machine boundary: 人读运行说明。机器真相继续归 product-entry invoke 行为、workspace/runtime artifacts、route artifacts、review/export gates、typed blockers 和 probe JSON 输出。

## Status

`scripts/run-real-route-evolution-probe.ts` 是 RCA 当前 repo-native 的真实 route 演进 probe。它创建真实 workspace，补齐 source readiness，然后通过 `invokeProductEntry` 的 `task_intent=run_deliverable_route` 顺序执行 deliverable route。

它验证的是“RCA 能真实运行、真实产出 artifact、真实复跑命中 cache、真实返回 typed blocker”。它不替代 `visual_director_review`、`screenshot_review`、`export_pptx`，也不把 OPL Agent Lab score 写成 RCA visual quality verdict。

## Route Lanes

支持的 lane：

- `image`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`
- `html`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> export_pptx`
- `native`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx`

`image` 仍是默认主线。HTML 和 native PPTX 只在显式选择时跑，继续保留相同 review/export gate。

## Commands

快速 mock probe：

```bash
node --experimental-strip-types scripts/run-real-route-evolution-probe.ts \
  --mock \
  --routes image \
  --iterations 2 \
  --route-timeout-ms 60000 \
  --skip-codex-probe \
  --workspace-root /tmp/rca-real-route-workspace \
  --output-dir /tmp/rca-real-route-output \
  --json
```

live provider probe：

```bash
node --experimental-strip-types scripts/run-real-route-evolution-probe.ts \
  --live \
  --routes image,html,native \
  --iterations 1 \
  --route-timeout-ms 900000 \
  --workspace-root /tmp/rca-real-route-live-workspace \
  --output-dir /tmp/rca-real-route-live-output \
  --json
```

Mock mode 注入测试 Codex CLI、测试 Python helper 和 mock image generation，只证明 product-entry route、artifact 写入、cache、review/export gate wiring 与 typed blocker。Live mode 会调用真实 Codex / image / native helper provider，完整三 lane 可能显著超过 30 分钟；耗时本身是正常信号，不应被外层 refs-only 流程掩盖。

## Output

Probe 写入：

- `<output-dir>/real-route-evolution-probe.json`
- `<output-dir>/performance-report.json`
- `<output-dir>/route-child-results/*.json`
- workspace 内的 route artifacts、PNG、review reports、PPTX/PDF 和 publish bundle

关键字段：

- `lanes[].route_runs[].artifact_refs`: 真实 route artifact / PNG / report / PPTX / PDF refs
- `lanes[].cache_summary.second_iteration_all_cached`: 两轮复跑时第二轮是否全 route cache hit
- `quality_gate_policy`: 明确保留 `visual_director_review`、`screenshot_review`、`export_gate`
- `typed_blockers`: live provider 缺 token、Codex 阻塞、native helper 阻塞、quality gate block 或 route timeout 的 typed blocker
- `no_forbidden_write_policy`: 期望 artifact 写入只落在 workspace root，不写 repo source

## Cache Boundary

Route cache 按 stage DAG 方向计算输入：

- `author_image_pages`、`render_html`、`author_pptx_native` 只因 source / outline / blueprint / visual direction / explicit operator authoring input 改变而失效。
- `repair_image_pages`、`fix_html`、`repair_pptx_native` 继续依赖 `visual_director_review`、`screenshot_review` 和 operator 返修要求。
- `visual_director_review`、`screenshot_review` 和 `export_pptx` 继续依赖当前可视 artifact，不能因为上游 authoring cache hit 跳过质量门。

这个边界允许第二轮相同输入复跑时直接复用 artifact，同时仍保证 blocked-page-only repair 和 review/export gate 不降级。

## Verification

Repo-native regression：

```bash
npm run --silent build
node --experimental-strip-types --test tests/real-route-evolution-probe.test.ts
node --experimental-strip-types --test tests/runtime-deliverable-route-cases/cache-liveness-and-repeat-blocks.test.ts
```

`tests/real-route-evolution-probe.test.ts` 覆盖 mock image lane 到 `export_pptx` 的真实 product-entry route、第二轮 cache hit、PPTX/PDF refs、质量 gate policy，以及 route timeout typed blocker。
