# Source Readiness Deep Research Longrun Target State

日期锚点：`2026-04-09`

> **future-facing 目标态文档**
>
> 这份参考文档用于冻结 source-plane 的未来目标边界，帮助后续 tranche 在不改写当前 repo truth 的前提下持续收敛。
> 它本身**不会**自动改写 `contracts/runtime-program/current-program.json`，也**不是**已经 absorbed 的当前真相声明。

## 1. 目标定位

`Deep Research` 的正式定位必须收紧为：

- 它属于 `Source Readiness`
- 它是正式的前置补料能力，不是漂在外面的第 0 步
- 它补的是事实材料、来源、证据与 readiness
- 它**不**替代 `Storyline`
- 它**不**等价于 `MedDeepScientist` 的 `Scout + Idea`
- 它**不**负责把 narrative choice 伪装成 research 结果

因此，产品语义必须保持：

`Source Readiness -> Storyline -> Plan -> Visual -> Delivery`

其中 `Deep Research` 只是 `Source Readiness` 内部的一种正式运行模式。

## 2. 启动逻辑目标态

### 2.1 必须强制启动

满足任一条件时，系统必须强制进入 `source augmentation / Deep Research`：

- 输入只有 `topic`、`keywords` 或粗略想法
- canonical source truth 缺少可直接消费的事实材料
- canonical source truth 缺少支撑后续判断所需的公开可追溯来源
- source-level blocker 仍阻断 `Storyline / Plan` 的叙事与规划判断
- `source-readiness-pack.json` 的 planning gate 仍未到达 `planning_ready`

### 2.2 建议启动

满足任一条件时，系统可建议启动，但不应伪装成强制：

- canonical source truth 已能支撑 `planning_ready`，但仍存在可携带的 residual gap
- 现有材料可规划，但来源质量说明仍需补强
- 后续目标更依赖公开背景脉络，而不是只依赖用户私有材料

### 2.3 只做 source intake 即可

仅在以下条件同时成立时，`source intake` 可直接收口 Step 1：

- canonical source truth 已写出正式 quartet
- `source_audit` 已通过
- `source-readiness-pack` 已把 planning gate 标成 `planning_ready`
- 不存在阻断 `Storyline` 的 blocking evidence gap

### 2.4 可直接放行到 Storyline

只有当以下条件同时满足时，才允许正式放行到 `Storyline`：

- `planning_ready = true`
- blocking evidence gap 已清空
- residual evidence gap 已明确标注为可携带
- `auditDeliverable / runtimeWatch / getReviewState / getPublicationProjection` 对同一 topic / deliverable 的 planning gate 口径一致

## 3. planning_ready 目标语义

`planning_ready` 不是“有一点材料了”的模糊判断，而是正式 gate：

- `source_audit.status = pass`
- canonical `source-readiness-pack.json` 明确给出 `planning_ready = true`
- blocking evidence gap 已解决
- 后续 `Storyline / Plan` 不再承担“补事实”的主责

### 3.1 blocking evidence gap

blocking evidence gap 是**必须在 Step 1 内解决**的 gap，例如：

- `public_evidence_missing`
- `consumable_material_missing`
- `source_audit_not_passed`

### 3.2 residual evidence gap

residual evidence gap 是**可以在显式标注后携带进入后续阶段**的 gap。

当前 longrun target 允许存在 residual channel，但它不能被误用为：

- 把 blocking gap 伪装成 residual
- 把“没有证据”包装成“后面再补”
- 让 `Storyline` 或 `Plan` 承担事实补料主责

## 4. 正式 durable surfaces 目标态

### 4.1 Topic 级 canonical source truth

以下 surfaces 属于 topic 级 canonical source substrate：

- `topics/<topic>/canonical/source-index.json`
- `topics/<topic>/canonical/extracted-materials.json`
- `topics/<topic>/canonical/source-audit.json`
- `topics/<topic>/canonical/source-brief.json`
- `topics/<topic>/canonical/source-readiness-pack.json`
- `topics/<topic>/canonical/source-augmentation-request.json`
- `topics/<topic>/canonical/source-augmentation-result.json`
- `topics/<topic>/canonical/source-augmentation-report.json`
- `topics/<topic>/canonical/source-research-report.json`

### 4.2 Deliverable 级后续工件

以下 surfaces 属于 deliverable 级后续工件，不得回写成 topic truth：

- `storyline`
- `plan` family artifacts
- `visual` family artifacts
- `delivery` family artifacts
- `review-state.json`
- hydrated `delivery-contract.json`

### 4.3 禁止做法

- 不允许用 prompt patch 替代 contract hydration
- 不允许把 source-plane gate 藏成隐式 heuristic
- 不允许把 narrative choice 直接写进 Deep Research contract

## 5. Family boundary

### 5.1 Shared source substrate

`ppt_deck`、`xiaohongshu`、guarded `poster_onepager` 都应共享同一套 Source Readiness / Deep Research substrate：

- 同一 topic 级 canonical source truth
- 同一 planning gate 语义
- 同一 request / result / report / readiness surfaces

### 5.2 必须保持的差异

- `xiaohongshu` 继续保持 `human publication` family，不得借此改写成 direct-delivery
- `poster_onepager` 继续保持 guarded `knowledge poster` 边界，不得借此激活 academic poster contract
- 本线不得跨入 `controller expansion`
- 本线不得跨入 `managed web runtime migration`

## 6. 成功标准

当以下条件同时成立时，可认为 source-plane target 已与 longrun target 对齐：

- 用户只有主题或关键词时，系统也能正式进入 `Source Readiness` 补料
- `planning_ready` gate 已 machine-readable 且可验证
- canonical request / result / report / readiness surfaces 已稳定
- family 共享同一 source substrate，但 family ontology 不被改写
- 文档、合同、运行面与 fresh verification 口径一致
