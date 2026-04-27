# RCA executor routing config

本文档说明 `RedCube AI` 如何管理 LLM executor 的三层配置。这里的配置示例只作为 opt-in 参考；仓库默认不会激活 Huawei MaaS、DeepSeek、GLM 或任何 route-specific Hermes profile。

## 三层边界

1. 用户交互层：由 Codex CLI、OPL 或其他 shell 决定用户从哪里进入。RCA 不管理这个默认入口。
2. effective default executor：RCA 每次执行 route 前解析出的默认执行器。优先级固定为：
   - request explicit executor
   - OPL Runtime Manager / handoff default executor
   - RCA domain local user config
   - RCA built-in default `codex_cli`
3. route-level `structured_call` routing：RCA 只对单轮任务保存 route policy，例如 `render_html`、`fix_html` 可显式指向某个 Hermes profile。未命中时继承 effective default executor。

## 后端与 shape

RCA public contract 只接受：

- `executor_backend: "codex_cli" | "hermes_agent"`
- `execution_shape: "structured_call" | "agent_loop"`

`structured_call` 表示一次性结构化输入输出；`agent_loop` 表示交给 agent runtime 做多步执行。二者不混入 backend 名称。`simple_llm` 与 `openai_compatible_gateway` 不是 RCA 当前一等 backend。

## 配置文件位置

RCA 会读取以下 opt-in 配置，后面的文件覆盖前面的同名字段：

- `$CODEX_HOME/projects/redcube-ai/runtime-state/config/executor-routing.json`
- `config/local/executor-routing.json`
- `REDCUBE_EXECUTOR_ROUTING_CONFIG` 指向的显式 JSON 文件

`config/examples/executor-routing.example.json` 是 repo-tracked 示例，不会被自动读取。`config/local/*.json` 已被 git ignore，适合本机临时测试。

## Hermes profile

RCA 只保存非 secret 的 `hermes_profile` id，例如 `huawei-deepseek-v4-flash`。Provider、base URL、API key、真实模型清单与模型 alias 由外部 `Hermes-Agent` 配置管理。RCA request 中的 `model` 仍只是 API compatibility 字段，proof 记录 Hermes 返回的真实 provider/model/session/run events。

## 示例

```json
{
  "schema_version": 1,
  "structured_call_routing": {
    "enabled": true,
    "default_on_missing": "inherit_effective_default_executor",
    "routes": {
      "ppt_deck/lecture_peer/render_html": {
        "executor_backend": "hermes_agent",
        "execution_shape": "structured_call",
        "hermes_profile": "huawei-deepseek-v4-flash",
        "fallback": "inherit_effective_default_executor",
        "failure_policy": "fallback_with_proof"
      },
      "ppt_deck/lecture_peer/fix_html": {
        "executor_backend": "hermes_agent",
        "execution_shape": "structured_call",
        "hermes_profile": "huawei-glm-5.1",
        "fallback": "inherit_effective_default_executor",
        "failure_policy": "fallback_with_proof"
      }
    }
  }
}
```

route key 从精确到宽松匹配：

- `<family>/<profile>/<route>`
- `<family>/<route>`
- `<route>`

例如 `ppt_deck/lecture_peer/render_html` 优先于 `ppt_deck/render_html`。

## fallback

`failure_policy: "fallback_with_proof"` 只对 route policy 选中的 `hermes_agent + structured_call` 生效。若 Hermes structured call 失败，RCA 会回到 effective default executor，并把 fallback 原因写入 generation runtime / execution proof。显式要求 `fail_closed` 时不会 fallback。

`fix_html` 仍保留 agentic escalation：结构化回修后如果同一调用内复审仍要求 `fix_html`，最多自动升级一次到 `hermes_agent + agent_loop`，并记录两次尝试。
