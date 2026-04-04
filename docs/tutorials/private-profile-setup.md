# 私有作者信息与 prompts 配置

本文档说明如何在不污染公开仓库的前提下，继续使用你自己的作者信息、品牌、提示词和默认工作区。

## 推荐结构

优先把私有层放在：

```text
~/.config/redcube/
  runtime.json
  identity.json
  prompts/
    aligned/
      自动小红书/
        作者档案库.md
        人设自动路由规则.md
        defaults/
        风格指南/
        故事指南/
        策划提示词/
        视觉提示词/
```

这样做的好处：

- 仓库保持公开干净
- 私有素材不依赖当前项目目录
- 跨机器迁移更简单

## runtime.json 示例

```json
{
  "rootDir": "/absolute/path/to/your/workspace",
  "workspaceRoot": "/absolute/path/to/your/workspace",
  "promptsDir": "./prompts"
}
```

说明：

- `rootDir` 和 `workspaceRoot` 指向你真实使用的外部工作区
- `promptsDir` 配合 `~/.config/redcube/prompts/` 使用

## identity.json 示例

```json
{
  "defaultAuthor": "你的默认作者名",
  "brandName": "你的品牌名",
  "signature": "你的默认署名",
  "personaRoutingEnabled": true
}
```

这里可以继续扩展你自己的作者字段，但不要把真实内容写回公开仓库。

## 本机覆盖：config/local

如果某台机器需要临时覆盖配置，可以在仓库里的 `config/local/` 放私有文件，例如：

- `config/local/runtime.json`
- `config/local/identity.json`

这个目录已经在 `.gitignore` 中整体忽略，只保留说明文件和占位文件，因此适合放本机专属配置。

## 从旧工作目录迁移

如果你已经有一套外部 prompts，可执行：

```bash
node apps/redcube-cli/src/cli.js profile \
  --action bootstrap \
  --source-dir "/absolute/path/to/your-private-prompts/system/自动小红书"
```

这会把当前可识别的私有层迁移到 `~/.config/redcube/`。

## 导出私有层备份

```bash
node apps/redcube-cli/src/cli.js profile \
  --action export \
  --bundle "~/Downloads/redcube-private-profile.tgz"
```

适合：

- 跨机器迁移
- 做离线备份
- 在新电脑上快速恢复

## 在另一台机器安装

```bash
node apps/redcube-cli/src/cli.js profile \
  --action install \
  --bundle "~/Downloads/redcube-private-profile.tgz"
```

如果目标位置已有旧内容，可加：

```bash
--force
```

## 推荐的跨机流程

1. 在旧机器上执行 `profile export`
2. 在新机器克隆公开仓库并 `npm install`
3. 在新机器执行 `profile install`
4. 检查 `~/.config/redcube/runtime.json` 中的工作区路径是否需要按新机器调整
5. 启动 CLI 或 MCP 验证 prompts 与 identity 是否已生效
