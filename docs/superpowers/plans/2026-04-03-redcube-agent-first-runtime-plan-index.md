# RedCube Agent-First Runtime Program Plan

`2026-04-03` 的三份计划仍保留为 foundation 阶段的历史记录。

截至 `2026-04-04`，项目方向已进一步收敛为：

- `Agent-first, human-auditable`
- `visual deliverable runtime`
- `xiaohongshu + ppt_deck` 多 overlay
- `host-agent executor adapter` 作为 runtime 主路径

因此，vertical slice 的后续执行以新计划为准：

1. [2026-04-04-redcube-presentation-ops-profile-design.md](/Users/gaofeng/workspace/redcube-ai/.worktrees/redcube-agent-vertical-slice/docs/superpowers/specs/2026-04-04-redcube-presentation-ops-profile-design.md)
   - `RedCube` 与 `OPL / Presentation Ops` 的边界
   - `overlay family -> profile pack -> deliverable contract`
   - `ppt_deck` 首批正式 profile pack
   - `xiaohongshu` 与 `Presentation Ops` 的边界

2. [2026-04-04-redcube-multi-overlay-alignment-plan.md](/Users/gaofeng/workspace/redcube-ai/.worktrees/redcube-agent-vertical-slice/docs/superpowers/plans/2026-04-04-redcube-multi-overlay-alignment-plan.md)
   - README / public narrative refresh
   - visual deliverable runtime 对齐
   - `ppt_deck overlay`
   - host-agent runtime adapter direction
   - deliverable-centric gateway / MCP surface

下面三份历史计划主要服务于 `xiaohongshu foundation` 与 foundation cutover，不应再直接当成 `Presentation Ops / ppt_deck` 的完整蓝图；其中 `Web / Workbench retirement` 已经可以按直接删除遗留层来理解，不再要求保留 UI 兼容。

之前拆分出的三份计划如下：

1. [2026-04-03-redcube-foundation-cutover-plan.md](/Users/gaofeng/workspace/redcube-ai/docs/superpowers/plans/2026-04-03-redcube-foundation-cutover-plan.md)
   - workspace contract
   - runtime protocol
   - gateway foundation
   - CLI v2 scaffold

2. [2026-04-03-redcube-agent-vertical-slice-plan.md](/Users/gaofeng/workspace/redcube-ai/docs/superpowers/plans/2026-04-03-redcube-agent-vertical-slice-plan.md)
   - `xiaohongshu overlay`
   - runtime store / event log
   - `create_topic -> run_topic_route -> get_run`
   - MCP exposure

3. [2026-04-03-redcube-legacy-cutover-plan.md](/Users/gaofeng/workspace/redcube-ai/docs/superpowers/plans/2026-04-03-redcube-legacy-cutover-plan.md)
   - legacy importer
   - production path cutover
   - Web / Workbench retirement

建议执行顺序：

1. Foundation
2. Multi-Overlay Alignment
3. Legacy Cutover
