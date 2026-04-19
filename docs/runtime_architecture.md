# 运行架构说明

这份文档写给需要理解 `RedCube AI` 技术边界的读者。
它属于仓库跟踪的操作文档层，不属于默认对外双语公开正文面。
如果未来要把它提升到默认公开面，必须同步补齐英文 `.md` 与中文 `.zh-CN.md` 镜像。
其中凡是历史 `docs/program/hermes/*` 冻结件，当前都只能读成 repo-local migration provenance，而不是上游 `Hermes-Agent` 已接管 runtime 的证据。

## 一句话理解

`RedCube AI` 不是 GUI 工具集合，而是一个面向 Agent 的 `Visual Deliverable Gateway`，并由共享 `Unified Harness Engineering Substrate` 上的视觉交付 `Domain Harness OS` 驱动。

这里的 `Agent-first` 通过默认 `Codex CLI host-agent runtime` 与显式 `hermes_native_proof` proof lane 共同成立。
在当前 Codex-native 语境里，route / managed run surface 已按三层 owner 理解：`Hermes-Agent` 持有长期运行与托管能力，`RedCube AI` 持有 visual-domain governance / audit / projection truth，而默认 concrete executor 仍是本地 Codex CLI host-agent runtime；`Codex` 本地 operator host 继续承担当前部署宿主与 workspace bridge，而历史 `repo-local managed runtime pilot` 只保留为迁移 provenance / compatibility bridge；
当前 formal-entry matrix 已固定为：默认正式入口 `CLI`、支持协议层 `MCP`、内部控制面 `controller`；
当前已验证的公开正式入口是 `CLI`、`MCP`；
代码应退回 contract、governance、audit、artifact persistence 与 render boundary。

这里同样必须区分：

- 长线目标：把 `RedCube AI` 收敛成稳定、可信、可复验的 visual-deliverable `Domain Gateway + Domain Harness OS`
- 当前 program：当前 repo-tracked mainline 正在覆盖的能力层
- 历史 freeze / closeout：把当前能力带进主线的 provenance 证据

当前最成熟的两类交付物，加上一条已完成 extension proof 的海报 surface，是：

- `PPT deck`
- `小红书图文`
- `poster_onepager / knowledge_poster`

## 顶层链路

独立使用时（当前默认）：

```text
Agent
  -> CLI（默认）/ MCP
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Domain Harness OS
                  -> Hermes-Agent managed runtime
                      -> RedCube service-safe domain entry
                          -> executor adapter
                              -> concrete executor (default Codex CLI host-agent runtime)
```

放在 `OPL` 顶层语义里时：

```text
User / Agent
  -> OPL Gateway
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Harness OS
```

当前冻结的最终收口链还要再明确一层：

Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> visual-domain truth surfaces

也就是说，`OPL Product Entry` 与 `RedCube Product Entry` 现在都已经可以把调用收敛到同一个 service-safe domain entry；当前仍未落地的是成熟的最终用户产品入口前台壳。

同一 substrate 上的可迁移形态：

```text
User / Agent
  -> managed web runtime
      -> Gateway
          -> Domain Harness OS
              -> Governance / Audit / Artifact persistence
```

## 各层职责

### RedCube Gateway

CLI 与 MCP 共享的唯一正式控制面，负责：

- 承接当前已实现的公开正式入口 `CLI`、`MCP`
- `CLI` 是默认 formal entry
- `MCP` 是支持协议层
- `controller` 当前未作为独立 public entry 在仓内落地
- 装载 workspace contract
- 路由到正确的 family / profile / pack
- 返回结构化状态与 artifact 引用

### Overlay / Family / Profile / Pack

负责定义交付物质量协议，而不是只定义 prompt 风格。

它们决定：

- 交付物类型
- 阶段顺序
- 审计门控
- review surface
- 导出要求

这里要特别避免一个错误：

- `pack-first` 不等于 `AI-first`
- 如果主要 story / visual / render authorship 仍由 deterministic JS 完成，
  即使这些逻辑已经移到 pack，也仍然不算恢复了 AI-first 主线

### RedCube Domain Harness OS

负责执行、记录与审计，不负责顶层产品语义。

它负责：

- run store
- event log
- rerun / resume
- canonical artifact 落盘

它不应该继续主导：

- story architecture major text authorship
- visual direction major expression
- final HTML markup authorship

这些都应逐步回到 agent / director 主执行面。

## 部署形态与本体语义分离

- route / managed run surface 的长期 owner 是 `Hermes-Agent` managed runtime。
- 默认 concrete executor 仍是本地 `Codex CLI host-agent runtime`。
- `Codex` 本地 operator host 是当前 deployment host / development shell。
- 历史 `repo-local managed runtime pilot` 只作为迁移 provenance、兼容桥与回归对照保留。
- 未来切到 managed web runtime 时，只要仍在同一 `Unified Harness Engineering Substrate` 上并保持同一 contract，RedCube 的 domain 语义不变。
- `OPL` 是上层语义系统；RedCube 在其中是视觉交付 domain gateway + Domain Harness OS，不是 `OPL` 本体。
- 当前仓库主线是 `Auto-only`；未来如需更高判断密度的 `Human-in-the-loop` 产品，应作为兼容 sibling 或 upper-layer product 复用同一 substrate，而不是把当前仓改成同仓双模。

## 执行句柄与持久表面

当前主线已经把身份与治理表面收紧成一组更明确的 contract：

- `program_id`
  - active mainline 的 control-plane pointer
  - 用于 program truth、reports 路由与 absorbed provenance 追踪
- `topic_id`
  - topic 聚合根身份
  - `topics/<topic>/canonical/source-audit.json` 与 `topics/<topic>/publication-state.json` 都挂在这一层
- `deliverable_id`
  - topic 内部的 durable deliverable 身份
  - `contracts/delivery-contract.json`、`reports/review-state.json` 与 export readiness 都围绕它收口
- `run_id`
  - 单次 routed execution 的正式执行句柄
  - run telemetry、rerun linkage、runtime watch 与 event log 必须持续回显同一个 `run_id`

当前 canonical durable surfaces 也已经固定为：

- audit / watch：`auditDeliverable`、`runtimeWatch`
- review / projection：`getReviewState`、`getPublicationProjection`

当前行为收口要求它们在同一 deliverable/topic 边界上保持一致：

- `auditDeliverable` 不只输出 gate judgement，还要回指同一份 canonical `review_state`、topic 级 `publication_projection` 与 hydrated `delivery_contract`
- `runtimeWatch` 必须和 `getReviewState` / `getPublicationProjection` 对齐，而不是自成一套 watch-only 状态

这意味着后续如果继续统一三个业务仓，不应再重复发明“这次 run 到底靠什么识别、哪份 artifact 才算正式 durable truth”。
RedCube 这一侧已经把这两个问题收紧到 repo-tracked contract 层。

## 统一生命周期

`RedCube` 现在应该按一套共享宏观生命周期理解，而不是把 `ppt_deck` 和 `xiaohongshu` 当成两套彼此割裂的流程：

1. `Source Readiness`
2. `Story Architecture`
3. `Visual Authorship`
4. `Delivery Packaging`

审核与治理采用双层 overlay：

- `visual_director_review`
- `screenshot_review`

### Source Readiness

负责：

- intake / extract / normalize / audit
- source sufficiency judgement
- 在 source truth 不足时触发 research augmentation

因此：

- `research` 不应继续被理解成 `xiaohongshu` 专属 creative stage
- 它属于 shared source readiness / source augmentation
- 它的完成标准是把 Step 1 推到 `planning_ready`，而不是替代 `Storyline`

### Story Architecture

负责：

- 讲什么
- 怎么讲
- 页/章节/篇章顺序

当前语义映射：

- `xiaohongshu`：`storyline + single_note_plan`
- `ppt_deck`：`storyline + detailed_outline + slide_blueprint`

### Visual Authorship

负责：

- `visual_direction`
- `render_html`

这一步必须由 agent / director 主导。
代码只保留 shell、canvas、artifact write、render gate。

### Delivery Packaging

负责最终交付包装：

- `xiaohongshu`：`publish_copy + export_bundle`
- `ppt_deck`：`export_pptx`

### Review Overlay

`visual_director_review` 负责导演层审片：

- 导演意图是否落地
- 是否反模板化
- 是否有节奏、峰值页、记忆点

`screenshot_review` 负责技术质控：

- overflow
- occlusion
- density
- speaker/time fit
- baseline relative comparison

## 当前 reality 与目标态

当前 reality：

- `source intake + shared source truth` 已作为 `Source Readiness` 的正式能力面进入当前主线：CLI / MCP 的 source intake 会把 canonical quartet 写入同一 substrate，`ppt_deck` / `xiaohongshu` 在同一 `gateway -> family -> profile -> pack -> harness execution` 控制链上消费 `shared_source_truth`；`P0 review-closeout` 与 stable deliverable manual hardening 继续保持通过，activation package freeze 已完成并转为已吸收前置冻结件
- `Hermes-Agent` 当前承担长期 hosted session/run/watch/resume 这层 managed-runtime owner；默认 concrete executor 仍是 `Codex CLI host-agent runtime`。`Codex` 本地 operator host 同时作为当前部署宿主、workspace bridge 与 development shell，而历史 `repo-local managed runtime pilot` 只保留为 provenance / compatibility material
- 三条 formal family surface 已共享 gateway / runtime / governance / artifact surfaces
- `xiaohongshu` 已有 `visual_director_review + screenshot_review`
- `ppt_deck` 也已有显式 `visual_director_review + screenshot_review`
- `poster_onepager` 已完成第三 family onboarding / extension proof，但当前只应被解释为 knowledge poster
- `paper_poster / conference_poster` academic poster contract 只保留为后续或历史冻结残留，不构成当前 active mainline
- `review / export / gate / audit hardening` 已吸收为前置 provenance：`auditDeliverable / runtimeWatch` 已把 canonical source readiness 与 export gate summary 收口为共享治理面
- `ppt_deck / xiaohongshu / poster_onepager 已围绕同一 source_truth_contract 与 source_truth_consumption summary 收口消费语义`
- `source-readiness deep research trigger + gate convergence` 已把 `Deep Research` 冻结为 shared `Source Readiness` augmentation：canonical `source-readiness-pack`、`source-augmentation-request/result/report` 与 `source-research-report` 现在共同把 `planning_ready` 收紧成 formal release gate
- `workspace / operator quickstart convergence` 已把 brand-new / thin workspace bootstrap 与 canonical operator route 收紧成同一条 repo-verified behavior surface：`workspace doctor` 保持诊断角色，而 `source intake / source research -> deliverable create -> deliverable audit -> deliverable run` 成为当前可验证的 quickstart 路径
- `operator surface consistency hardening` 已把 `workspace doctor` 的 bootstrap guidance、command-scoped CLI help，以及 `CLI review watch` / `MCP runtime_watch` 的 locator truth 收紧到同一 canonical operator route 与 `runtimeWatch` governance path
- `runtime watch locator integrity hardening` 已把 deliverable-scope run record 的 `topic_id` / `deliverable_id` 收紧进 canonical run envelope，并让 `runtimeWatch` / `review watch` / `runtime_watch` 在 quartet locator mismatch 时 fail-closed
- `governance_surface.runtime_topology` 现在在 create / review / audit / watch / projection 上显式暴露当前 upstream runtime owner、当前 deployment host，以及历史 local migration provenance
- stable family runtime output 现在会直接暴露同一份 upstream runtime bridge truth，而 routed artifact 在落盘前也会统一保留 `topic_id` / `deliverable_id` / `contract` / `stage_contract`
- repo-hosted managed control plane 现在也已收口到同一 substrate：`runManagedDeliverable / getManagedRun / superviseManagedRun` 可以在 `ppt_deck`、`xiaohongshu`、guarded `poster_onepager` 上共享同一套 managed run / progress projection / runtime supervision / escalation truth，并会在 durable state 创建前 fail-closed 校验 `overlay` 与 `stop_after_stage`
- service-safe domain entry adapter 也已冻结：`invokeDomainEntry` 通过同一条 `Hermes-Agent managed runtime -> executor adapter -> concrete executor` 链驱动 `runManagedDeliverable / runDeliverableRoute`，同时把 `runtimeWatch / getReviewState / getPublicationProjection / auditDeliverable` 继续留在 RedCube 侧收口
- `publication projection / delivery contract convergence` 已把 topic 级 `publication-state.json` 收紧到 hydrated `delivery_contract` 与 canonical review state；`xiaohongshu` 保持 human publication gate，`ppt_deck` / `poster_onepager` 保持 direct-delivery 语义
- `xiaohongshu` 现已形成第二条 repo-local managed family closure：`planning_ready` source readiness 之后的 `research -> export_bundle` 闭环继续保持 human-publication 语义，而不会漂移成 direct delivery
- `direct-delivery operator handoff hardening` 已把 `ppt_deck` / guarded `poster_onepager` 的 `operator_handoff` 收紧到同一 canonical governance path：`delivery_state` ownership 继续留在 required export artifact，而 handoff gate 由 `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 共同收口
- `direct-delivery lifecycle stage convergence` 已把 direct-delivery human workline 与当前 macro lifecycle 的 machine-readable bridge 收紧到同一 canonical contract surface：`Storyline + Plan` 继续映射到 `Story Architecture`，`Visual` 继续映射到 `Visual Authorship`，`Delivery` 继续映射到 `Delivery Packaging`，而 `operator_handoff / closeout` 仍留在 `Delivery`
- `poster_onepager` 继续保持 guarded knowledge-poster 边界，不借此激活 academic poster contract；source-plane 更深层的扩展仍属于同一主线上的持续增强

当前目标态：

- 多条 family 在语义上统一到同一生命周期
- `ppt_deck` 也具备显式 `visual_director_review`
- `knowledge poster` 与 `academic poster` 正式切开
- 代码只保留边界、校验、治理、审计、落盘与导出

## 为什么 PPT 和小红书放在同一套系统里

它们在目标场景上不同，但在运行形态上高度一致：

- 都需要结构化阶段
- 都需要审阅节点
- 都需要视觉与质量约束
- 都适合由 Agent 发起，而不是由人类手工点击界面

因此它们共享同一 harness，只在 family / profile / pack contract 上分化。

更准确地说：

- 它们共享同一套宏观生命周期
- 只是 family-specific 子工件数量不同
- 当前阶段先统一生命周期语义与职责，再决定是否收敛 route naming

## OPL 语义边界

如果放回 `OPL` 顶层：

- `ppt_deck` 是当前最直接映射到 `Presentation Ops` 的 family
- `xiaohongshu` 共享同一 harness，但不自动等同于 `Presentation Ops`
- `RedCube AI` 仍然必须保留独立 domain gateway 角色，而不是退化成 OPL 的内部模块
- final target route 应理解成：`User -> OPL Product Entry -> OPL Gateway -> Hermes-Agent managed runtime -> RedCube service-safe domain entry -> executor adapter -> concrete executor -> RedCube visual-domain truth surfaces`

## 更稳定的规则在哪里

如果你要读长期稳定的正式规则，请继续看：

- [运行模型 Policy](policies/runtime_operating_model.md)
- [交付合同模型 Policy](policies/deliverable_contract_model.md)

如果你只想快速开始，而不关心技术层次，请回到：

- [人类用户快速上手](human_quickstart.md)
