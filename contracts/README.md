# 合同目录说明

这个目录只保留 machine-readable contract surface。

- narrative 协作规则看仓库根 `AGENTS.md`
- 默认人类/AI 入口看 `README*` 与 `docs/README*`，其中 `RedCube AI Foundry Agent`、direct route 与单一 `redcube-ai` app skill 是第一公开主语
- 稳定运行边界看 `docs/policies/runtime_operating_model.md`

当前保留的 repo-tracked machine-readable mainline truth：

- `runtime-program/current-program.json`：当前 active mainline pointer，包含 `OPL Runtime Manager` 薄管理层边界与 `TypeScript + Python` 实现目标
- `runtime-program/current-program.json#/product_release_metadata`：`RedCube AI Foundry Agent` 的产品层发布 metadata，声明它是 built on `OPL Framework` 的 OPL-compatible package，并把 single app skill、service-safe domain entry、product sidecar/projection 与 stage control projection 归入同一发布形态；该 metadata 不持有 visual truth、review/export verdict 或 artifact authority
- `runtime-program/upstream-hermes-agent-final-target-shape.json`：独立 RCA domain-agent 在显式 hosted runtime carrier 语境下的目标形态冻结件（direct route 与 OPL-hosted handoff 共用同一下游 domain entry）
- `runtime-program/redcube-product-entry-mvp.json`：当前 direct product-entry service surface 冻结件
- `runtime-program/opl-framework-hosted-product-entry.json`：当前 OPL-hosted stage runtime handoff / integration 冻结件
- `runtime-program/managed-product-entry-hardening.json`：当前 product-entry session continuity 冻结件
- `product_status` 等 product-entry command keys 只作为单一 `redcube-ai` app skill 下的 machine-readable overview / intake / entry-shell contract 保留；它们不表示成熟 GUI、WebUI 或最终用户前台壳已经落地。
- `runtime-program/rca-executor-routing-config.schema.json`：RCA executor routing 的 opt-in 配置 schema；只表达 `codex_cli` / `hermes_agent` 与 `structured_call` / `agent_loop`，不保存 provider secret
- `runtime-program/ppt-image-first-production-route.json`：`ppt_deck` 当前默认 image-first visual route 冻结件；`author_image_pages / repair_image_pages` 通过 Responses `image_generation` 生成整页 16:9 PNG，并继续走 review/export gate；默认 lightweight proof 不调用真实 API 且不把完整“肠癌AI”长 PPT 纳入常规回归
- `runtime-program/ppt-native-authoring-proof-lane.json`：`ppt_deck` native PPT authoring / repair 生产可选、默认关闭路线冻结件；用户明确要求可编辑 / 原生 PPTX / DrawingML 时替代当前 image-first author/repair stages
- `runtime-program/ppt-native-python-engine-contract.json`：RedCube-owned clean-room SVG IR / DrawingML writer / true render proof engine 合同
- Python native helper contract 必须挂在 RedCube route/selectable lane、review/export gate 与 repo-tracked contract 下；不得作为绕过 visual-domain truth 的通用 Office/PPT 脚本入口。
- `runtime-program/ppt-mainline-quality-closeout.json`：`ppt_deck` 历史 HTML 默认路线视觉质量债核查 closeout，记录历史 OPL-series 问题已由后续 review / repair hardening 覆盖；当前默认路线已由 `ppt-image-first-production-route.json` 接管
- `runtime-program/upstream-hermes-agent-live-verification-closeout.json`：当前 F4 live closeout 证明件
- `runtime-program/upstream-hermes-agent-live-verification-blocker.json`：历史 F4 live blocker 冻结件
- `runtime-program/*.json`：absorbed tranche、prefrozen follow-on board 与 provenance contract

这里不再保留 narrative 的 `project-truth/AGENTS.md` 层。
