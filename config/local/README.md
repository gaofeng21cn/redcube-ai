# 本地私有配置

这个目录用于保存**仅本机使用**、**不进入 git** 的运行时配置。

可选文件：

- `runtime.json`
  - `rootDir`
  - `workspaceRoot`
  - `promptsDir`
- `identity.json`
  - 默认作者
  - 人设路由
  - 品牌与署名
- `executor-routing.json`
  - effective default executor 的本机覆盖
  - route-level `structured_call` routing
  - 只保存非 secret 的 Hermes profile id

推荐做法：

- 公开仓库只保留 `config/defaults/*.json`
- route-specific Hermes model/profile routing 默认不启用；先参考 `config/examples/executor-routing.example.json`
- 当前项目自己的作者、人设与品牌优先写到 `<workspace>/.redcube/*.json`
- `config/local/*.json` 适合本机临时覆盖
- 如果需要跨机器同步，再放到 `~/.config/redcube/*.json`
- Hermes provider、base URL、API key 与真实模型清单放在 Hermes-Agent 自己的配置中，不进入 RCA
