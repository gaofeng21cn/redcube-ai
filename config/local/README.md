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

推荐做法：

- 公开仓库只保留 `config/defaults/*.json`
- 当前项目自己的作者、人设与品牌优先写到 `<workspace>/.redcube/*.json`
- `config/local/*.json` 适合本机临时覆盖
- 如果需要跨机器同步，再放到 `~/.config/redcube/*.json`
