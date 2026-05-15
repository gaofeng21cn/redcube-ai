# Source Augmentation / Deep Research 执行器合同

这份文档写给技术协作同事和 Agent 执行者。
它不属于默认公开入口，而是 repo 跟踪的稳定内部操作文档。

## 这份合同解决什么问题

`source intake` 已经把 Step 1 的 canonical source truth 建起来了，但当输入只有主题、关键词或粗略想法时，系统还需要一个外部补料执行器去把事实材料补全。

这一步的正式入口就是：

1. 生成 canonical request：`source augment`
2. 执行外部补料：`source execute-augmentation`
3. 把合法结果回写到 canonical source truth

它不是“随便跑一个脚本然后塞回一点文本”，而是正式的 contract surface。

## Canonical 工作区前提

执行器只处理已经进入 canonical workspace contract 的主题。

最小前提是：

- 工作区根目录存在 `redcube.workspace.json`
- 目标主题下已经存在 `topics/<topic-id>/canonical/`
- `source intake` 已经写出下面这些 canonical artifacts：
  - `source-brief.json`
  - `source-audit.json`
  - `source-readiness-pack.json`
  - `source-augmentation-request.json`

## Agent 应怎么调用

Step 1 的正式链路固定为：

`source intake -> source augment -> source execute-augmentation`

如果你想从一个共享入口直接驱动 Step 1，而不是手动拆命令，也可以先调用：

`source research`

这个入口会先做 `source intake`，再根据当前 adapter / payload 情况决定是否继续进入 `source augment`、`source prepare-augmentation-result`、`source write-augmentation-result` 和 `source execute-augmentation`。

如果你走的是 `result_file` / Agent-native route，那么在 `source augment` 之后，还可以显式使用两条正式 surface：

- `source prepare-augmentation-result`
- `source write-augmentation-result`

这两条 surface 的职责是：

- `prepare-augmentation-result`：暴露 canonical `source-augmentation-result.json` 目标路径与 result scaffold
- `write-augmentation-result`：把外部 / Agent 产出的 research payload 校验后写回 canonical result artifact

随后再执行 `source execute-augmentation`，让 runtime 正式消费这个 canonical result artifact 并回写 shared source truth。

如果你是通过 Codex 驱动：

- 材料足够时，可以只跑 `source intake`
- 材料不足时，应继续跑 `source augment`
- 如果 request 状态是 `required` 或你决定执行补料，就继续跑 `source execute-augmentation`

## 外部执行器如何接入

运行时先通过环境变量 `REDCUBE_SOURCE_AUGMENT_ADAPTER` 选择正式 adapter。
当前 repo 内唯一正式支持的 adapter 是：

- `external_command`
- `result_file`

如果不显式配置，默认也会落到 `external_command`。

随后，再通过环境变量 `REDCUBE_SOURCE_AUGMENT_CMD` 指向这个 adapter 背后的外部执行器命令。

如果你不想再挂一个外部脚本，而是希望让 Codex / Agent 直接在 workspace 内写出标准 result contract，再由 runtime 正式接收，那么可以改用 `result_file` adapter。

例如：

```bash
export REDCUBE_SOURCE_AUGMENT_ADAPTER=external_command
export REDCUBE_SOURCE_AUGMENT_CMD=/absolute/path/to/source-augment-executor
```

或者：

```bash
export REDCUBE_SOURCE_AUGMENT_ADAPTER=result_file
export REDCUBE_SOURCE_AUGMENT_RESULT_FILE=/absolute/path/to/source-augmentation-result.json
```

对 `result_file` adapter：

- 如果配置了 `REDCUBE_SOURCE_AUGMENT_RESULT_FILE`，runtime 会直接读取该 JSON 文件
- 如果没有配置，runtime 会默认在 request 所在目录寻找同级 `source-augmentation-result.json`
- 文件不存在时，会显式返回 `source_augmentation_result_file_missing`

如果你不想自己猜 canonical 路径，也不想手工拼完整 contract，可以直接走：

```bash
redcube source prepare-augmentation-result --workspace-root /ABS/PATH --topic-id topic-a
redcube source write-augmentation-result --workspace-root /ABS/PATH --topic-id topic-a --payload-file /ABS/PATH/payload.json
```

其中：

- `prepare-augmentation-result` 会返回 canonical `sourceAugmentationResultFile`
- `write-augmentation-result` 会把 payload 补成完整 `shared_source_readiness_augmentation_result` contract 后写回 canonical artifact
- 然后 `source execute-augmentation` 在 `result_file` adapter 下就可以直接消费这个 canonical 文件

调用时，RedCube 会把 canonical request 文件路径作为第一个参数传给这个命令。

也就是说，执行器需要满足：

```text
<executor> <source-augmentation-request.json>
```

如果 `REDCUBE_SOURCE_AUGMENT_ADAPTER` 是未知值，系统会显式返回 `blocked`，并报告 unsupported adapter。

如果 `REDCUBE_SOURCE_AUGMENT_CMD` 没有配置，系统会显式返回：

- `status = blocked`
- `blocking_reason = source_augmentation_executor_unconfigured`

不会伪装成成功。

## 输入合同

外部执行器收到的输入必须是 schema version 1 的 canonical request，`request_kind` 固定为：

`shared_source_readiness_augmentation`

输入里最关键的字段有：

- `topic_id`
- `status`
- `execution_mode`
- `readiness_target`
- `trigger.evidence_gaps`
- `focus.topic_summary`
- `focus.required_outputs`
- `investigation_lanes`

如果 request 自己已经不合法，RedCube 不会调用外部执行器，而会直接返回：

- `status = blocked`
- `blocking_reason` 包含 `request contract invalid`

## 输出合同

外部执行器的标准输出必须是 JSON，并满足 schema version 1 的 result contract。

`request_kind` 固定为：

`shared_source_readiness_augmentation_result`

最小输出骨架如下：

```json
{
  "schema_version": 1,
  "topic_id": "topic-a",
  "request_kind": "shared_source_readiness_augmentation_result",
  "status": "completed",
  "readiness_target": "planning_ready",
  "topic_summary": "补料后的主题摘要",
  "reference_source_list": [
    {
      "reference_id": "REF-001",
      "label": "来源标题",
      "url": "https://example.com/source"
    }
  ],
  "key_fact_groups": [
    {
      "fact_id": "FACT-001",
      "label": "关键事实句",
      "reference_id": "REF-001"
    }
  ],
  "source_quality_notes": [
    "对来源质量的说明"
  ],
  "evidence_gap_resolution": [
    {
      "gap_id": "public_evidence_missing",
      "status": "resolved",
      "note": "已补齐公开可追溯来源"
    }
  ]
}
```

## 严格校验规则

当前 runtime 会严格验证：

- `topic_id` 必须与 request 一致
- `reference_source_list[*].reference_id` 必须存在且唯一
- `key_fact_groups[*].reference_id` 必须引用已声明的 `reference_id`
- `evidence_gap_resolution[*].gap_id` 必须来自 request 的 `trigger.evidence_gaps`
- `evidence_gap_resolution` 可以只回填本次显式处理到的 gaps，但不能凭空声明 request 之外的 gap

如果 result 不合法，系统会显式返回：

- `status = blocked`
- `blocking_reason` 包含 `result contract invalid`

同样不会伪装成成功。

另外，执行报告里现在也会保留 formal executor metadata：

- `executor.adapter`
- `executor.execution_surface`
- `executor.executor_identity`

## 回写后的 canonical 效果

当 result 合法时，RedCube 会把结果回写到 canonical source truth：

- `source-index.json` 追加 augmentation sources
- `extracted-materials.json` 追加 augmentation materials
- `source-brief.json` 更新 `material_count` / `material_ids` / `confidence`
- `source-readiness-pack.json` 更新 `topic_summary`、`reference_source_list`、`key_fact_groups`、`source_quality_notes`、`evidence_gaps`
- `source-augmentation-report.json` 记录本次执行报告

如果 evidence gaps 被全部解决，Step 1 会进入：

- `sufficiency_status = planning_ready`
- `deep_research_state = completed`

## 对执行器开发者的建议

- 不要输出旧格式字段，比如裸 `resolved_evidence_gaps`
- 不要靠数组顺序隐式绑定事实和来源，必须显式使用 `reference_id`
- 不要输出 request 中不存在的 `gap_id`
- 不要把“抓到一些文本”当作完成，目标是补齐后续 Storyline / Plan 可直接消费的 canonical facts
