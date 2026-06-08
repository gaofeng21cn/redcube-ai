# Phase 2 PPT Native Authoring Production-Selectable Lane

Owner: `RedCube AI`
Purpose: `native_ppt_selectable_route_provenance`
State: `historical_provenance_with_current_route_support`
Machine boundary: 人读 historical proof lane brief。当前机器真相继续归 native helper catalog、proof runner scripts、runtime-family source、workspace artifacts、rendered proof artifacts、review/export receipts 和 delivery owner docs。

## Lifecycle

本文保存 native editable PPTX 从 Phase 2 proof lane 成为显式可选生产路线的历史 reader context。它仍可作为当前 optional route support 的 provenance brief，但不再维护 runnable proof plan、CI checklist、旧 closeout 字段流水、verification transcript、branch/worktree state 或 production-readiness ledger。

当前 PPT route 读法回到这些 owner：

| Theme | Current owner |
| --- | --- |
| 默认 PPT 视觉路线 | `docs/delivery/image-first-ppt-production-route.md`, `contracts/runtime-program/ppt-image-first-production-route.json` |
| native editable PPTX proof / route support | `docs/delivery/native-ppt-proof-environment.md`, `contracts/runtime-program/ppt-native-authoring-proof-lane.json`, `contracts/runtime-program/ppt-native-ai-first-design-pack.json` |
| native helper / renderer truth | `contracts/runtime-program/python-native-helper-catalog.json`, `contracts/runtime-program/ppt-native-python-engine-contract.json`, Python helper package, proof runner scripts |
| route quality non-regression | `contracts/runtime-program/ppt-native-pptx-quality-nonregression.json`, focused tests, workspace proof artifacts |
| RCA active gaps and production evidence tail | `docs/active/rca-ideal-state-gap-plan.md`, production acceptance contracts, runtime evidence, owner receipts, typed blockers |

## Current Route Read

`ppt_deck` 当前默认视觉生产路线是 image-first：

`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> repair_image_pages -> export_pptx`

Native editable PPTX 是显式可选路线，只在用户明确要求可编辑、原生 PPTX 或 DrawingML 时启用。它不能变成默认 fallback chain，也不能绕过 source truth、visual direction、visual director review、screenshot review、export gate、runtimeWatch、artifact locator、owner receipt 或 typed blocker。

当前 native PPTX 的稳定边界是：

- `author_pptx_native` / `repair_pptx_native` 作为显式可选 stages。
- AI executor 持有 design pack / editable shape plan 的创作真相。
- officecli / Python helper 只做 materialize、validate、true render proof、refs 输出和 fail-closed blocker。
- LibreOffice headless -> PDF -> Poppler PNG true render proof 是 native PPTX 可视证明面；synthetic preview、HTML proof、PowerPoint / AppleScript 桌面证明或 `officecli validate` 不能替代。
- `visual_director_review`、`screenshot_review` 和 `export_pptx` 继续是 RCA-owned hard gates。

## Historical Content Compression

旧正文中的合同字段枚举、runtime proof landed 清单、生产可选门槛和 V2 closeout 字段流水已压缩为 provenance。当前 route contract、helper contract、proof runner、CI trigger、artifact index、review/export evidence 和 production evidence tail 均回到上表 owner。

本文只保留两条历史事实：

- Phase 2 native proof lane 曾完成 editable PPTX authoring / repair、true render proof、review/export wiring 和 proof runner hardening。
- 当前 native PPTX 只作为显式可选 route support 存在，不是 image-first 默认路线、不是 HTML fallback、不是第二公开 skill，也不是 production visual-stage long-soak closeout。

## No-Resurrection Rule

不要把本文恢复成：

- 当前 native PPT proof runner 操作手册或 CI workflow handbook。
- 当前 closeout 字段流水。
- 当前 production-ready、visual-ready、exportable、handoffable、domain-ready 或 long-soak-complete evidence。
- image-first route 的 fallback chain、HTML route 的替代修复链、第二公开 skill 或 OPL-owned visual authority。
- 允许 synthetic preview、HTML proof、PowerPoint / AppleScript 桌面 proof、mock helper output 或 deterministic fixture 充当 native visual sample 的依据。

需要推进 native PPTX 时，应从 delivery owner docs、runtime-program contracts、native helper catalog、proof runner、workspace proof artifacts、RCA review/export gates、owner receipts 和 typed blockers 取 live truth；本文只提供 proof lane 历史上下文。
