# 运行模型 Policy

Owner: `RedCube AI`
Purpose: `runtime_operating_model_policy`
State: `current_policy`
Machine boundary: 人读运行模型 policy。机器真相继续归 contracts、source、CLI/MCP/API 行为、product-entry manifest、runtime artifacts、owner receipts 和 RCA-owned review/export gates。

这份文档定义 `RedCube AI` 当前稳定的顶层运行边界。

## 项目定位

`RedCube AI` 对外是独立 visual-deliverable domain agent，第一公开主语是 `redcube-ai` app skill、direct product entry 与 service-safe domain entry；`gateway / harness` 只作为仓内边界层、包名或历史执行层语言保留。它不承担 generic framework/runtime，也不再是面向人类点击操作的 Web / Workbench 产品。

## 稳定原则

- 当前 formal-entry matrix 固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`
- `domain-agent entry` 是 `CLI / MCP` 共享的唯一正式控制面
- `controller` 当前不是独立、可验证的仓内公开正式入口
- RCA overlay / route / review gate 负责领域约束与交付质量协议
- RCA runtime-family shell 只负责 visual-deliverable stage pack、artifact refs、review/export gate 与 owner receipt
- 通用 stage attempt、queue、wakeup、retry/dead-letter、operator projection 与 App/workbench shell 归 OPL Framework 或产品壳
- 正式主线优先复用宿主 Agent runtime，不在 RCA 内重建 generic runtime platform
- 默认 concrete executor 是本地 `Codex CLI host-agent runtime`
- 非 Codex executor 的 hosted selection、attempt ledger 与 receipt 归 OPL owner surface
- `Codex` 本地 operator host 是当前 deployment host / development shell
- 历史 `repo-local managed runtime pilot` 只作为迁移 provenance，不是兼容桥、当前 owner 或可继续扩展的 active path
- 未来人用 workbench / product shell 应读取 projection 和 receipt refs；它不持有 visual truth、review/export verdict 或 artifact rewrite authority
- 当前仓库主线按 `Auto-only` 理解；未来 `Human-in-the-loop` 产品应作为 upper-layer product 复用同一 RCA domain contract

补充执行原则：

- `Agent-first` 由 RCA 物化的默认 `Codex CLI` concrete executor 与 OPL-hosted executor owner boundary 共同成立
- 在当前 Codex-native 语境里，`Codex` 继续承担本地 operator / development host 与默认 concrete executor，而不是 generic managed-runtime owner
- code 必须退回 contract、governance、audit、artifact persistence、review/export gate 与 render boundary

## 执行句柄与 durable surface 原则

当前主线的身份边界固定为：

- `program_id`
  - 控制面与 report-routing 指针
  - 不得误写成某次 deliverable run 的句柄
- `topic_id`
  - topic 聚合根身份
  - canonical source truth 与 publication projection 的 durable root
- `deliverable_id`
  - topic 内持久交付物身份
  - hydrated `delivery_contract`、`review-state.json` 与 export gate 都围绕它收口
- `run_id`
  - 单次 routed execution 的正式执行句柄
  - rerun linkage、runtime watch、runtime event / telemetry 都以它为 per-run handle

当前 canonical durable surfaces 固定为：

- audit / watch：`auditDeliverable`、`runtimeWatch`
- review / projection：`getReviewState`、`getPublicationProjection`
- canonical artifacts：
  - `topics/<topic>/canonical/source-audit.json`
  - `topics/<topic>/publication-state.json`
  - `topics/<topic>/deliverables/<deliverable>/contracts/delivery-contract.json`
  - `topics/<topic>/deliverables/<deliverable>/reports/review-state.json`

当前 behavior convergence 继续要求：

- `auditDeliverable` 与 `runtimeWatch` 在同一 deliverable/topic 边界上，不得脱离 canonical `review_state`、topic 级 `publication_projection` 与 hydrated `delivery_contract`
- `getReviewState` / `getPublicationProjection` 是权威表面；audit / watch 只能围绕它们收口，不能另写一套平行语义

后续即使接入 upper-layer product shell、OPL App workbench 或托管展示面，也只能迁移宿主展示、projection 消费和 operator action transport，不能迁移 RCA execution handle、visual truth、review/export verdict 或 artifact authority。

## 长线目标与当前 program 必须分开理解

这里必须严格区分：

- 长线目标
- 当前 program
- 历史 tranche / freeze / closeout 证据

长线目标回答的是：

- `RedCube AI` 理想情况下最终要收敛成什么

当前 program 回答的是：

- 当前 repo-tracked mainline 正在覆盖哪一层能力

历史 tranche / freeze / closeout 证据回答的是：

- 现在这条主线是如何被逐步吸收到 `main` 的

因此：

- 长线目标不等于 `Phase 2 minimum baseline`
- 已吸收的 tranche 证据不等于当前产品身份
- 在 `autonomous longrun program mode` 下，某一 tranche 吸收到 `main` 后，后续 hardening 默认仍在同一主线上继续推进
- 只有遇到 frozen-truth conflict、产品级改向判断或 external dependency 时，才应停车

## 统一生命周期原则

正式主线统一按以下宏观生命周期理解：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核与治理采用共享双层 overlay：

- `visual_director_review`
- `screenshot_review`

补充约束：

- `research` 属于 shared source readiness / source augmentation，不应继续被理解成小红书专属 creative stage
- `Story Architecture` 与 `Visual Authorship` 必须以 agent / director 为主要创作责任面
- `screenshot_review` 现在采用 AI-first review overlay：代码只负责截图与机械指标，最终截图审稿必须由 Codex 直接读图完成；`visual_director_review` 同样不能退化成纯 heuristic gate
- 当前优先级是先统一生命周期语义与职责边界，再决定是否收敛 route naming

## 当前正式能力面

本节只保存当前 runtime policy，不追加 absorbed tranche 清单。旧 workspace/operator quickstart、operator surface、runtimeWatch locator、direct-delivery handoff、source convergence、Hermes closure 等过程证据按 provenance 读取，位置在 `docs/history/phase-2/`、`docs/history/hermes/` 或 `docs/history/process/`。

| Capability area | 当前政策 |
| --- | --- |
| Source readiness | `CLI` / `MCP` / product-entry 只暴露 source intake、readiness、augmentation、research trigger 和 fail-closed source gate；source truth 与 augmentation truth 归 source owner docs、contracts、canonical artifacts 和 tests。 |
| Visual route lifecycle | `ppt_deck` 与 `xiaohongshu` 默认 image-first；`poster_onepager` 是 guarded knowledge poster；HTML 和 native editable PPTX 是显式可选路线。 |
| Review / watch / projection | `auditDeliverable`、`runtimeWatch`、`getReviewState` 和 `getPublicationProjection` 围绕同一 `workspace/topic/deliverable/run` 与 hydrated delivery contract 收口，不能生成平行 review truth。 |
| Product/runtime handoff | direct product entry、service-safe domain entry、OPL stage-plan refs 和 Codex-default concrete executor 构成当前 repo-verified baseline；OPL/Temporal 持有通用 runtime 与 attempt ledger，RCA 持有 visual-domain authority。 |
| Delivery / publication | `publication-state.json`、delivery contract、review state、operator handoff 和 lifecycle stage summary 只做 handoff / projection / gate 解释；RCA review/export verdict 和 artifact authority 仍由 owner receipt、typed blocker 和 workspace artifacts 证明。 |
| Evidence tail | 真实 long-soak、production-like repeated route no-regression、memory/lifecycle receipt scaleout 和 generated/default caller thinning 继续由 active gap plan 与 production acceptance contracts 管理。 |

## 真相源原则

- 正式运行真相源是 canonical artifact
- Markdown / HTML / TXT 只作为导出视图，不作为反向运行真相
- 不允许长期保留双真相结构

## 退出的旧主线

下面这些已经退出正式 production path：

- Web UI
- Workbench
- 旧的双真相同步链
- retired public entry / federation / source-pack-federation / product frontdesk
- repo-local Hermes substrate package / standalone upstream probe
- gateway-action / gateway-tool 兼容 alias

## 面向未来的约束

- 当前正式 surface 已包括：
  - `ppt_deck`
  - `xiaohongshu`
  - `poster_onepager`（当前只代表 knowledge poster，不代表 academic poster closeout）
- 新交付物类型应通过 overlay 扩展，而不是重新引入独立主线
- 新入口应通过 product/domain action、service-safe domain entry、RCA domain handler target、OPL-generated descriptor 或 RCA-owned route/gate 接入；不得恢复 Gateway / retired public entry / federation alias 或在外面包一层平行系统
- 新的质量规则应进入 contract / gate / policy，而不是依赖 prompt 补救
- 在 `OPL` 顶层语义里，`RedCube AI` 是独立 visual-deliverable domain agent，不是 `OPL` 顶层 gateway 的替代物
- 不允许把 deterministic code authorship 重新包装成 `pack-first` 或 `typed` 进展
- 不允许把部署形态（host-agent / managed web）改写成本体语义变化
