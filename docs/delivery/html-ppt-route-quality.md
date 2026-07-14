# RedCube PPT HTML Route Quality

Owner: `RedCube AI`
Purpose: `html_ppt_route_quality_support`
State: `active_support`
Machine boundary: 人读 route support。机器真相继续归 `contracts/runtime-program/ppt-html-route-quality-nonregression.json`、declarative pack、OPL-hosted StageRun artifacts、review/export gates、owner receipts 与 canonical artifacts。

## Status

`ppt_deck` 的默认视觉生产路线仍是 image-first：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`

HTML 路线只在用户或 contract 显式选择时启用：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> render_html -> visual_director_review -> screenshot_review -> fix_html -> export_pptx`

`render_html / fix_html` 是生产可选路线，用于 HTML/CSS/网页稿或历史 HTML 维护。它不改变默认 executor，不降低 `visual_director_review`、`screenshot_review` 或 `export_pptx`。

## Contract

- 机器合同是 `contracts/runtime-program/ppt-html-route-quality-nonregression.json`。
- `render_html` 继续由 AI 直接创作 HTML，不退化成固定 template compiler。
- HTML prompt/static 优化只允许复用 refs、稳定上下文 hash 和 batch/runtime telemetry，不能移除 audience visibility、layout guardrail 或 review/export gate。
- HTML layout floor 固定为 16:9 slide root、`data-slide-id`、语义化 `data-qa-block` 和 `data-primary-point` anchor。
- 禁止把 speaker notes、transition text、source/material id、模板注册表、脚本/style block 或 operator 语言写进观众可见内容。
- `fix_html` 必须消费 prior current HTML 与 review refs，只重画 blocked slide ids 或 operator 明确 target slide ids；未阻断页通过 `render_execution.reused_slide_ids` 和 `targeted_rerun.reused_slide_ids` 保持复用。
- 如果 upstream planning 比 current HTML 更新，或 prior current HTML 缺失，`render_html` 可以 full regeneration；`fix_html` 不能在已有 blocked-slide refs 时做全局重画。

## Agent Lab

HTML quality non-regression surface 只给 OPL Agent Lab 标准 suite 输入 refs：

- route policy ref
- prompt/static policy ref
- layout constraints ref
- `fix_html` target/reuse ref
- `render_execution` ref
- screenshot review gate ref
- export result ref

Agent Lab 可以比较 non-regression refs 和编排可观察性。Agent Lab score 不是 RCA visual verdict，不能写 visual truth、artifact blob、memory body，也不能授权 quality verdict、exportable、visual ready 或 handoffable。

## Hosted Read Model

HTML artifact 会暴露 `html_route_quality_companion` refs-only companion，位于 route artifact 顶层和 `html_bundle` 内：

- `contract_ref`
- `prompt_static_policy_ref`
- `layout_constraints_ref`
- `fix_html_policy_ref`
- `agent_lab_suite_input_ref`
- `quality_gate_refs`
- forbidden authority flags

该 companion 是 read-model / suite input locator，不承载 visual truth、artifact body、review/export verdict 或 owner receipt。

## Verification

HTML route policy 与标准 Agent 边界的最小验证：

```bash
node --test tests/opl-agent-pack-contracts-semantic-pack.test.js
npm run test:fast
```

这些验证只证明 declarative route policy、hosted refs 和标准 Agent 边界。最终 visual ready/exportable/handoffable 仍回到 RCA-owned review/export gates 与真实 rendered artifact evidence。
