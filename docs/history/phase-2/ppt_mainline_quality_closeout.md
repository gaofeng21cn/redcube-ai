# PPT Mainline Quality Closeout

Owner: `RedCube AI`
Purpose: `historical_ppt_html_quality_closeout_provenance`
State: `historical_provenance`
Machine boundary: 人读历史 closeout brief。当前机器真相继续归 contracts、runtime-family source、workspace artifacts、artifact manifests、review/export receipts 和 canonical artifacts。

状态锚点：`2026-05-01`

## 结论

当前 RCA `ppt_deck` 历史 HTML 质量闭环不需要回到历史 OPL-series PPT 重跑来证明。这个 closeout 记录的是 2026-05-01 当时的 HTML 默认路线质量债收口；当前默认视觉路线已经切到 image-first `author_image_pages`。

这次 closeout 的判断对象是当时 HTML authoring lane 的代码、合同和测试约束：`render_html -> visual_director_review -> screenshot_review -> fix_html -> screenshot_review -> export_pptx` 是否已经具备预期的质量闭环。

结论是：历史视觉质量债务已被后续 HTML lane 的 review / repair hardening 覆盖，状态记为 `resolved_by_later_work`。HTML 现在保留为生产可选二线；`ppt_deck` 当前默认视觉路线由 `contracts/runtime-program/ppt-image-first-production-route.json` 冻结。

## 证据

- `screenshot_review` 已把 page-level 视觉问题路由回 `fix_html`。
- speaker-fit 这类结构性问题仍回到 `slide_blueprint`，不被塞进页面级补丁。
- `fix_html` 已支持定点页面回修，保留已通过页面。
- 回修后的 visual review / screenshot review 会基于新鲜页面重新判断，不复用 stale review。
- `export_pptx` 使用稳定通过审查的 HTML，而不是未审查 draft。
- slide review 与 page-local repair 的并行能力只提升吞吐，不改变 quality gate。

## 边界

native PPT proof lane 仍是二线：它用于用户明确要求可编辑 / 原生 PPTX / DrawingML 时的生产可选路线。

它不参与这次历史 HTML closeout，也不是 HTML lane 视觉问题的兜底修复手段。

## Plan Closeout

- `planned`：核查当前 `ppt_deck` HTML 主线质量闭环是否仍有历史视觉质量债缺口。
- `done`：确认 review、rerun target、定点回修、复审、export 与并行边界已由当前代码和测试覆盖。
- `deferred`：无。
- `skipped`：不重跑历史 OPL-series PPT；不手工修历史 PPT；不把 native PPT proof lane 接成 HTML fallback；不在这个历史 HTML closeout 内重跑当前 image-first proof；不新增历史样本分类工程。
- `verification`：见 `contracts/runtime-program/ppt-mainline-quality-closeout.json`。
- `commit-push state`：完成 fresh verification 后提交并推送。
