# PPT Mainline Quality Closeout

Owner: `RedCube AI`
Purpose: `historical_ppt_html_quality_closeout_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 closeout brief。当前机器真相继续归 contracts、runtime-family source、workspace artifacts、artifact manifests、review/export receipts、canonical artifacts 和 delivery owner docs。

状态锚点：`2026-05-01`

## Lifecycle

本文只保存当时 HTML 默认路线质量债收口的历史 provenance。它不再是当前 PPT route checklist、HTML quality gate、proof transcript、branch state 或执行计划。

当前 `ppt_deck` 默认视觉路线是 image-first，由 `docs/delivery/image-first-ppt-production-route.md`、`contracts/runtime-program/ppt-image-first-production-route.json`、runtime-family source/tests、workspace artifacts 和 RCA review/export gates 持有。HTML 与 native editable PPTX 都是显式可选路线。

## Historical Fact

当时的判断对象是 HTML authoring lane：

`render_html -> visual_director_review -> screenshot_review -> fix_html -> screenshot_review -> export_pptx`

历史结论是：HTML lane 的 review / repair / export hardening 后续覆盖了当时的历史视觉质量债，记录状态读为 `resolved_by_later_work`。这只说明 2026-05-01 HTML debt closeout 已归档，不声明今天的 visual ready、exportable、handoffable、domain ready、production ready 或 production visual-stage long soak complete。

## Historical Boundary

- `screenshot_review` 曾把 page-level 视觉问题路由回 `fix_html`。
- speaker-fit 等结构性问题回到 `slide_blueprint`，不塞进页面级补丁。
- `fix_html` 支持定点页面回修，并要求复审读取新鲜页面。
- `export_pptx` 只能使用稳定通过审查的 HTML。
- native PPTX 路线不参与这个历史 HTML closeout，也不是 HTML lane 的兜底修复手段。

## No-Resurrection Rule

不要把本文恢复成当前 HTML route 操作手册、质量门、proof lane、执行计划或 readiness evidence。需要推进 HTML 路线时，回到 current route contracts、delivery owner docs、runtime-family source/tests、workspace artifacts、review/export receipts、owner receipts 和 typed blockers。
