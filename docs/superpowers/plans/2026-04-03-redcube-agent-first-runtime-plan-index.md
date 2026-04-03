# RedCube Agent-First Runtime Program Plan

已批准的重构 spec 过大，已拆分为三份可独立执行的实现计划：

1. [2026-04-03-redcube-foundation-cutover-plan.md](/Users/gaofeng/workspace/RedCube%20AI/docs/superpowers/plans/2026-04-03-redcube-foundation-cutover-plan.md)
   - workspace contract
   - runtime protocol
   - gateway foundation
   - CLI v2 scaffold

2. [2026-04-03-redcube-agent-vertical-slice-plan.md](/Users/gaofeng/workspace/RedCube%20AI/docs/superpowers/plans/2026-04-03-redcube-agent-vertical-slice-plan.md)
   - `xiaohongshu overlay`
   - runtime store / event log
   - `create_topic -> run_topic_route -> get_run`
   - MCP exposure

3. [2026-04-03-redcube-legacy-cutover-plan.md](/Users/gaofeng/workspace/RedCube%20AI/docs/superpowers/plans/2026-04-03-redcube-legacy-cutover-plan.md)
   - legacy importer
   - production path cutover
   - Web / Workbench retirement

建议执行顺序：

1. Foundation
2. Vertical Slice
3. Legacy Cutover
