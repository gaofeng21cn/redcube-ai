# AI-first Quality Boundary Policy

Owner: `RedCube AI`
Purpose: `ai_first_quality_boundary_policy`
State: `current_policy`
Machine boundary: 人读质量边界 policy。机器真相继续归 contracts、source、CLI/MCP/API 行为、runtime artifacts、author/reviewer artifacts、owner receipts 和 RCA-owned review/export gates。

这份 policy 固定 `RedCube AI` 的 AI-first 质量边界。它记录 RCA 近期修复后的长期规则：结构化 pack、schema、gate、audit、review projection 和 scorecard 只能约束流程、传递证据和表达机械状态；创作判断、视觉判断、审稿判断和最终交付质量判断必须由 AI-authored author / reviewer artifact 持有。

## Owner boundary

- `storyline`、`detailed_outline`、`slide_blueprint`、`visual_direction`、`author_image_pages`、`render_html` 中的主要 story / visual / markup authorship 必须来自 AI author artifact。
- `visual_director_review` 与 `screenshot_review` 的最终视觉判断必须来自 AI reviewer artifact；程序可以提供截图、几何指标、layout QC 和证据引用，但不能把这些机械信号包装成最终视觉结论。
- `profile pack`、`deliverable contract`、schema、runtime gate、audit report、publication projection 和 baseline scorecard 只拥有结构、引用、状态与可追溯性。
- `pack-first` 不等于 `AI-first`。把模板或规则搬进 pack 之后，如果主要创作或最终判断仍由确定性程序持有，就仍然违反 AI-first 边界。

## Projection and scorecard rule

任何只来自程序化完整性检查、截图指标、schema completeness、artifact existence、baseline comparison 或 publication projection 的质量状态，都只能表达 projection / mechanical readiness。

这些状态不得单独触发：

- deliverable quality ready;
- visual review accepted;
- baseline promotion accepted;
- publication-ready / export-facing quality closure;
- operator-facing “only packaging remains” 语义。

只有当对应 author / reviewer artifact 明确存在，并且该 artifact 持有具体创作或评审判断时，下游才可以把质量状态提升为 ready / accepted / promoted。

## Implementation rule

- 新增 stage、pack、review gate 或 promotion surface 时，先声明 author / reviewer judgment owner。
- 程序化 helper 只能生成 evidence、metrics、artifact refs、layout facts、rerun hints 或 mutation envelope。
- 不得新增 hidden templates、hardcoded prose、heuristic-only visual verdict、scorecard-only ready verdict 或程序化正文/HTML/视觉创作 fallback。
- 修复 visual quality bug 时，应把问题收回到 AI review / authoring loop，再加固 renderer、QC 或 gate；不得只改某个样例 artifact。
- OPL 托管路径、hosted executor refs 或 native helper 只改变运行/投影/执行位置，不改变 RedCube 的 visual-domain judgment owner。

## Verification

涉及创作、视觉审阅、截图复核、质量 promotion 或 publication projection 的改动，至少检查相关 guard：

- `tests/ai-first-authoring-boundary.test.ts`
- `tests/screenshot-review-ai-first.test.ts`
- `tests/ppt-creative-ownership.test.ts`
- `tests/xiaohongshu-creative-ownership.test.ts`
- `tests/poster-creative-ownership.test.ts`
- `tests/review-platform.test.ts`
- `scripts/verify.sh meta`
- `npm run test:fast`
