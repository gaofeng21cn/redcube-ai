# Source Augmentation / Deep Research 执行器合同

这份文档写给技术协作同事和 Agent 执行者。
它不属于默认双语公开面，而是 repo 跟踪的稳定内部操作文档。

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

如果你是通过 Codex 驱动：

- 材料足够时，可以只跑 `source intake`
- 材料不足时，应继续跑 `source augment`
- 如果 request 状态是 `required` 或你决定执行补料，就继续跑 `source execute-augmentation`

## 外部执行器如何接入

运行时通过环境变量 `REDCUBE_SOURCE_AUGMENT_CMD` 指向外部执行器。

例如：

```bash
export REDCUBE_SOURCE_AUGMENT_CMD=/absolute/path/to/source-augment-executor
```

调用时，RedCube 会把 canonical request 文件路径作为第一个参数传给这个命令。

也就是说，执行器需要满足：

```text
<executor> <source-augmentation-request.json>
```

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
- request 中出现的每个 evidence gap，都必须在 result 的 `evidence_gap_resolution` 里出现一次

如果 result 不合法，系统会显式返回：

- `status = blocked`
- `blocking_reason` 包含 `result contract invalid`

同样不会伪装成成功。

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
