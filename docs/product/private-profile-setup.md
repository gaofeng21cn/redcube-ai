# 私有作者信息与 prompts 配置

Owner: `RedCube AI`
Purpose: `private_profile_setup_guide`
State: `active_support`
Machine boundary: 人读本地配置指南。机器真相继续归 ignored local config、workspace `.redcube/` files、CLI behavior、contracts 和 product-entry manifest。

本文档说明如何在不污染公开仓库的前提下，继续使用你自己的作者信息、品牌、提示词和默认工作区。
它属于私有 / 本地配置说明，不属于默认公开入口。

## 推荐结构

优先把作者档案放在当前 workspace 的 `.redcube/`。这样每个项目都能直接声明“这是谁的账号、这套图文该用什么人设”，也更适合 agent 在同一工作区内维护。

```text
<workspace>/.redcube/
  runtime.json
  identity.json
  README.md
  prompts/
    aligned/
      自动小红书/
        作者档案库.md
```

`source intake` / `source research` 第一次 bootstrap brand-new workspace 时，已经会自动生成一套通用模板，默认作者占位是 `RedCube AI`。后续把这几个文件改成当前项目真正要用的署名与品牌即可。

如果你希望跨多个 workspace 复用同一套私有层，再放到用户级：

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

- workspace 级作者身份与项目绑定更清楚
- 仓库保持公开干净
- 用户级私有层仍可做跨机器复用

## runtime.json 示例

```json
{
  "rootDir": "/absolute/path/to/your/workspace",
  "workspaceRoot": "/absolute/path/to/your/workspace",
  "promptsDir": "./prompts"
}
```

说明：

- workspace 级配置里，`promptsDir` 推荐写成 `./prompts`
- 用户级配置里，`promptsDir` 继续配合 `~/.config/redcube/prompts/` 使用

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

## 生效边界

私有 profile 只填补当前交付请求没有声明的作者、品牌、署名和风格默认值。优先级固定为：显式交付请求与已批准素材、RCA visual direction 判断、workspace `.redcube/` profile、用户级 profile、内置 route 默认值。私有 profile 不能覆盖当前任务中已批准的 logo、产品图、UI 截图、品牌色、字体、source truth 或交付约束，也不能产生 source-ready、visual-ready、exportable、handoffable、review-pass、owner receipt 或 artifact mutation verdict。缺少关键品牌/素材时，应记录 source/material gap refs 或 typed blocker，而不是用 profile 推断值静默替代。

## 本机覆盖：config/local

如果某台机器需要临时覆盖配置，可以在仓库里的 `config/local/` 放私有文件，例如：

- `config/local/runtime.json`
- `config/local/identity.json`

这个目录已经在 `.gitignore` 中整体忽略，只保留说明文件和占位文件，因此适合放本机专属配置。

## 迁移与备份

私有 profile 就是普通目录，不再使用 RCA 专有 bundle 协议。迁移旧 prompts 时直接复制到用户级或 workspace 级配置目录：

```bash
mkdir -p ~/.config/redcube/prompts/aligned
cp -R "/absolute/path/to/your-private-prompts/system/自动小红书" \
  ~/.config/redcube/prompts/aligned/
```

跨机器备份使用平台自带的 `tar`：

```bash
tar -czf ~/Downloads/redcube-private-profile.tgz -C ~/.config redcube
mkdir -p ~/.config
tar -xzf ~/Downloads/redcube-private-profile.tgz -C ~/.config
```

恢复后检查 `runtime.json` 中的绝对路径是否需要按新机器调整，再通过 `redcube profile --action list` 读取当前 profile catalog。覆盖现有目录前自行保留备份；RCA 不再包装复制、覆盖和归档语义。
