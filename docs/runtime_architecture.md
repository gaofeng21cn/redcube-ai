# 运行架构说明

这份文档写给需要理解 `RedCube AI` 技术边界的读者。
它属于仓库跟踪的操作文档层，不属于默认对外双语公开正文面。
如果未来要把它提升到默认公开面，必须同步补齐英文 `.md` 与中文 `.zh-CN.md` 镜像。

## 一句话理解

`RedCube AI` 不是 GUI 工具集合，而是一个面向 Agent 的 `Visual Deliverable Gateway`，并由共享 `Unified Harness Engineering Substrate` 上的视觉交付 `Domain Harness OS` 驱动。

这里的 `Agent-first` 不等于必须走 `external_llm` API。
在当前 Codex / OMX 语境里，默认本地执行形态是 `Codex-default host-agent runtime`；
当前已验证的 formal entry 是 `MCP`、`CLI`；
代码应退回 contract、governance、audit、artifact persistence 与 render boundary。

当前最成熟的两类交付物，加上一条已完成 extension proof 的海报 surface，是：

- `PPT deck`
- `小红书图文`
- `poster_onepager / knowledge_poster`

## 顶层链路

独立使用时（当前默认）：

```text
Agent
  -> MCP / CLI
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Domain Harness OS
                  -> Codex-default host-agent runtime
```

放在 `OPL` 顶层语义里时：

```text
User / Agent
  -> OPL Gateway
      -> RedCube Gateway
          -> Overlay / Family / Profile / Pack
              -> RedCube Harness OS
```

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

- 承接当前已实现的正式入口 `MCP`、`CLI`
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

- `Codex-default host-agent runtime` 是当前默认部署形态，不是 RedCube 本体定义。
- 未来切到 managed web runtime 时，只要仍在同一 `Unified Harness Engineering Substrate` 上并保持同一 contract，RedCube 的 domain 语义不变。
- `OPL` 是上层语义系统；RedCube 在其中是视觉交付 domain gateway + Domain Harness OS，不是 `OPL` 本体。

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

- shared source plane / source intake code path 已存在，但当前并未打开 `Phase 2`；`P0 review-closeout` 已以可信 clean-clone baseline 通过，当前由 `Codex App` 显式激活的 `stable deliverable manual-test-driven hardening` 已完成首轮正式手工测试 closeout，仅覆盖 `ppt_deck` / `xiaohongshu`，`P1` 与 `Phase 2 / source intake + shared source truth` 仍保持关闭
- 三条 formal family surface 已共享 gateway / runtime / governance / artifact surfaces
- `xiaohongshu` 已有 `visual_director_review + screenshot_review`
- `ppt_deck` 也已有显式 `visual_director_review + screenshot_review`
- `poster_onepager` 已完成第三 family onboarding / extension proof，但当前只应被解释为 knowledge poster
- `paper_poster / conference_poster` academic poster contract 只保留为后续或历史冻结残留，不构成当前 active mainline

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

## 更稳定的规则在哪里

如果你要读长期稳定的正式规则，请继续看：

- [运行模型 Policy](policies/runtime_operating_model.md)
- [交付合同模型 Policy](policies/deliverable_contract_model.md)

如果你只想快速开始，而不关心技术层次，请回到：

- [人类用户快速上手](human_quickstart.md)
