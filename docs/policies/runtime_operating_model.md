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
- 显式 proof lane 可以使用 `hermes_agent`，但它不是默认 runtime owner
- 默认 concrete executor 是本地 `Codex CLI host-agent runtime`
- `Hermes-Agent` 只作为显式 hosted/proof backend、非默认 executor adapter 或技术参考层保留
- `Codex` 本地 operator host 是当前 deployment host / development shell
- 历史 `repo-local managed runtime pilot` 只作为迁移 provenance，不是兼容桥、当前 owner 或可继续扩展的 active path
- 未来人用 workbench / product shell 应读取 projection 和 receipt refs；它不持有 visual truth、review/export verdict 或 artifact rewrite authority
- 当前仓库主线按 `Auto-only` 理解；未来 `Human-in-the-loop` 产品应作为 upper-layer product 复用同一 RCA domain contract

补充执行原则：

- `Agent-first` 由默认 `Codex` concrete executor 与显式 `hermes_agent` proof lane 共同成立
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

- `source intake` 已通过 `CLI` / `MCP` 成为 `Source Readiness` 的正式 baseline surface
- canonical quartet 固定为 `source-index.json`、`extracted-materials.json`、`source-audit.json`、`source-brief.json`
- canonical readiness / augmentation surfaces 现已固定包括 `source-readiness-pack.json`、`source-augmentation-request.json`、`source-augmentation-result.json`、`source-augmentation-report.json` 与 `source-research-report.json`
- `source-readiness deep research trigger + gate convergence` 已在当前主线上吸收：`Deep Research` 现在必须作为 shared `Source Readiness` augmentation 把 Step 1 推到 `planning_ready`，而不能把 `source_audit = pass` 误写成已放行
- `workspace / operator quickstart convergence` 已在当前主线上吸收：brand-new / thin workspace 现在围绕 `workspace doctor -> source intake / source research -> deliverable create -> deliverable audit -> deliverable run` 这条 canonical operator route 暴露 repo-verified quickstart surface，同时保持 `workspace doctor` 只做诊断、真正 bootstrap 由 `source intake` / `source research` 落盘
- `operator surface consistency hardening` 已在当前主线上吸收：`workspace doctor` 对 brand-new workspace 只暴露 `source intake` / `source research` bootstrap guidance；command-scoped CLI help 现在必须 machine-readable 且 `--help` 不执行真正命令；`CLI review watch` 与 `MCP runtime_watch` 围绕同一 `workspace/topic/deliverable/run` locator 收口到 `runtimeWatch`
- `runtime watch locator integrity hardening` 已在当前主线上吸收：deliverable-scope run record 现在必须持久化 `topic_id` / `deliverable_id`；`runtimeWatch` 在 persisted / preloaded run 两条入口上都必须验证 quartet locator；`CLI review watch` 与 `MCP runtime_watch` 在 mismatch 时共享同一 fail-closed 行为
- 历史 `Hermes stable family closure truth` 冻结件只保留为本地迁移 provenance；当前 repo-verified 基线是 RCA 通过 direct product entry、service-safe domain entry、runtime-family route、review/export gate 与 OPL stage-plan refs 形成同一份 Codex-default execution truth，并由 `Codex CLI` 承担默认 concrete executor 角色
- `ppt_deck` 与 `xiaohongshu` 当前在同一 substrate 上消费 `shared_source_truth`，guarded `poster_onepager` 则共享同一 `source_truth_contract` 与 `source_truth_consumption` summary
- authoritative fail-closed source gate 继续留在 auditDeliverable / runtimeWatch，而 family artifact 需输出统一的 source_truth_consumption summary
- `review / export / gate / audit hardening` 与 `family source-truth consumption convergence` 已在当前主线上吸收为前置 provenance
- `publication-state.json` 现在必须围绕 hydrated `delivery_contract` 与 canonical `review_state` 输出 topic 级 projection；`xiaohongshu` 保持 explicit human publication gate，`ppt_deck` / `poster_onepager` 保持 direct-delivery semantics
- `direct-delivery operator handoff hardening` 已在当前主线上吸收：direct-delivery family 现在必须暴露 machine-readable `operator_handoff`，同时保持 `delivery_state` ownership 与 gate semantics 的边界清晰
- `direct-delivery lifecycle stage convergence` 已在当前主线上吸收：direct-delivery family 现在必须暴露 machine-readable `lifecycle_stage_contract` 与 `lifecycle_stage_summary`，同时保持 `Story Architecture` / `Visual Authorship` / `Delivery Packaging` 的当前命名不被改写
- 更深层 source-plane 扩展仍属于同一主线上的后续增强，不应被误写成当前已完成的 repo truth
- 当前 repo-tracked phase 标签仍可保留为 program pointer，但它不等于长线目标本身

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
- 新入口应通过 product/domain action、service-safe domain entry、product sidecar 或 RCA-owned route/gate 接入；不得恢复 Gateway / retired public entry / federation alias 或在外面包一层平行系统
- 新的质量规则应进入 contract / gate / policy，而不是依赖 prompt 补救
- 在 `OPL` 顶层语义里，`RedCube AI` 是独立 visual-deliverable domain agent，不是 `OPL` 顶层 gateway 的替代物
- 不允许把 deterministic code authorship 重新包装成 `pack-first` 或 `typed` 进展
- 不允许把部署形态（host-agent / managed web）改写成本体语义变化
