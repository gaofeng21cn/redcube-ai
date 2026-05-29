# RCA Real Route Evolution Probe

Owner: `RedCube AI`
Purpose: `real_route_evolution_probe_support`
State: `active_support`
Machine boundary: 人读运行说明。机器真相继续归 product-entry invoke 行为、workspace/runtime artifacts、route artifacts、review/export gates、typed blockers 和 probe JSON 输出。

## Status

`scripts/run-real-route-evolution-probe.ts` 是 RCA 当前 repo-native 的真实 route 演进 probe。它创建真实 workspace，补齐 source readiness，然后通过 `invokeProductEntry` 的 `task_intent=run_deliverable_route` 顺序执行 deliverable route。

它验证的是“RCA 能真实运行、真实产出 artifact、真实复跑命中 cache、真实返回 typed blocker”。它不替代 `visual_director_review`、`screenshot_review`、`export_pptx`，也不把 OPL Agent Lab score 写成 RCA visual quality verdict。

对外 artifact-producing 证据的正式命令入口是 RCA product-entry route handler：

```bash
npm run --prefix /Users/gaofeng/workspace/redcube-ai redcube -- product invoke ... --task-intent run_deliverable_route
```

AgentLab / OPL Meta Agent / AgentLab takeover 只作为 refs-only、control-plane、handoff 或 takeover 证据；独立手写脚本、HTML 页面或 Python 样片不能替代上述 product-entry route 证据。

## Route Lanes

支持的 lane：

- `image`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx`
- `html`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> export_pptx`
- `native`: `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx`

`image` 仍是默认主线。HTML 和 native PPTX 只在显式选择时跑，继续保留相同 review/export gate。Native PPTX 一旦被选中，内部主流程固定为 RCA AI-first native authoring：live Codex executor 生成 `editable_shape_plan`，officecli-backed writer / validator / QA gate 物化可编辑 PPTX，LibreOffice / Poppler 生成 true-render proof，随后进入 `visual_director_review`、`screenshot_review` 和 `export_pptx`。`ppt-master`、PPTAgent、`officecli-pptx`、Presenton 等只能作为设计纪律参考，不能替代 RCA product-entry route 或 review/export verdict。

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

一页 proof / smoke 类输入建议显式使用低延迟执行策略：

```bash
REDCUBE_CODEX_REASONING_EFFORT=minimal \
  npm run --prefix /Users/gaofeng/workspace/redcube-ai redcube -- product invoke \
  --workspace-root /Users/gaofeng/workspace/projects/redcube-ai/runtime-state/<run> \
  --entry-session-id <session> \
  --overlay ppt_deck \
  --topic-id <topic> \
  --deliverable-id <deliverable> \
  --profile-id lecture_student \
  --task-intent run_deliverable_route \
  --route <author_image_pages|render_html|author_pptx_native> \
  --stop-after-stage export_pptx
```

该策略只改变 Codex executor reasoning effort，不跳过 `visual_director_review`、`screenshot_review` 或 `export_pptx`。如果路线缺少 planning artifact，product-entry 必须自动补齐 `storyline -> detailed_outline -> slide_blueprint -> visual_direction` 后继续 visual route；不能要求外层 Codex 逐 stage 盯跑。

AgentLab refs-only 三路线 suite 命令：

```bash
opl agent-lab run --suite contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json --json
```

该命令读取 suite contract、route refs、gate refs 和 forbidden-authority flags。它不生产视觉质量结论，不替代 workspace artifact，也不声明 native PPTX production soak complete。

2026-05-29 native live 样片的物理 evidence root 是：

```text
/Users/gaofeng/workspace/projects/redcube-ai/runtime-state/native-ai-first-live-20260529-v5/
```

关键产物路径：

- `workspace/topics/topic-real-route-evolution/deliverables/deck-native/artifacts/native_ppt/deck-native-author_pptx_native.pptx`
- `workspace/topics/topic-real-route-evolution/deliverables/deck-native/artifacts/native_ppt/deck-native-author_pptx_native.pdf`
- `workspace/topics/topic-real-route-evolution/deliverables/deck-native/artifacts/native_ppt/deck-native-author_pptx_native-shape-manifest.json`
- `workspace/topics/topic-real-route-evolution/deliverables/deck-native/reports/native_ppt/deck-native-author_pptx_native-screenshots/slide-1.png`
- `workspace/topics/topic-real-route-evolution/deliverables/deck-native/publish/deck-native.pptx`
- `workspace/交付成果/RCA image-first real route evolution probe (native).pptx`
- `agentlab-output/rca-ppt-three-route-agent-lab-suite.json`

`.codex/projects` 不作为物理输出根；若出现该路径，只按指向 `/Users/gaofeng/workspace/projects` 的 symlink / provenance 读取。

2026-05-26/29 的真实一页 PPT 三路线测试给出如下效率和证据读法：

- 默认 image-first 成功链路约 18 分 42 秒，其中 `author_image_pages` 约 6 分 13 秒，`repair_image_pages` 约 6 分 49 秒；这是 Codex native imagegen 与回修成本，不是 AgentLab 或脚本生成。
- HTML route 在 `REDCUBE_CODEX_REASONING_EFFORT=minimal` 下 planning 可稳定落到约 2-3 分钟，但单次 `render_html` 仍约 9 分 23 秒；质量门禁阻断后应通过 `fix_html` 或代码/提示词根因修复收敛，不能绕过 gate。
- Native PPTX route 需要 officecli writer / validator / QA gate 与 LibreOffice headless true-render proof；成功链路可能经历 `repair_pptx_native`，最终必须以 RCA screenshot review pass 和 export artifact 为准。`native-ai-first-live-20260529-v5` 只证明单次 live sample 可物化、review 和 export，不证明 production soak。
- AgentLab / OPL Meta Agent 运行结果只能证明 refs-only control-plane、suite observation、forbidden-authority boundary 或 takeover/work-order 闭环；真实 PPTX/PDF/PNG 样片证明必须来自 RCA product-entry workspace artifacts。
- Mock provider / helper proof 只证明 contract、plumbing、hard-count regression、file wiring 和 fail-closed checks，不是视觉质量证明。

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
