# 本地私有配置

Owner: `RedCube AI`
Purpose: `local_private_config_boundary`
State: `active_support`
Machine boundary: 本文是人读本机配置说明。机器真相继续归 `config/defaults/`、配置 schema、source、CLI/MCP/API 行为和用户本机未跟踪配置；本文不定义 secret、executor provider 或 runtime readiness。

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
推荐做法：

- 公开仓库只保留 `config/defaults/*.json`
- 当前项目自己的作者、人设与品牌优先写到 `<workspace>/.redcube/*.json`
- `config/local/*.json` 适合本机临时覆盖
- 如果需要跨机器同步，再放到 `~/.config/redcube/*.json`
