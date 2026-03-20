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
- 个人环境把真实目录、品牌、人设写到 `config/local/*.json`
- 如果需要跨机器同步，再放到 `~/.config/redcube/*.json` 或 `<workspace>/.redcube/*.json`
