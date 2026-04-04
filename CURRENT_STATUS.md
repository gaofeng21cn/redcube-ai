# Current Status

## 项目定位

RedCube AI 当前定位为：

- 一个可公开托管的功能仓
- 只保留 agent-first gateway / runtime / overlay 主线
- 通过运行时配置挂接外部 workspace、私有 prompts、私有人设与品牌配置
- 仓库本体只保留 Node 主线所需代码，不再保留旧 Python 运行时与本地业务状态

## 当前原则

- 仓库默认值必须可公开
- 私有目录、作者、人设、品牌、署名不写死在代码与文档中
- `projects/`、`publish/`、`.redcube_pi/` 都属于运行产物，不应保留在仓库根
- 面向 GitHub 的公开文档统一放在 `guides/`
- `docs/` 目录保留给内部 AI / Superpowers 文档与开发痕迹，不再承担公开入口职责

## 推荐私有配置位置

- `config/local/*.json`
- `~/.config/redcube/*.json`
- `<workspace>/.redcube/*.json`

## 当前主线

- 运行目录：`rootDir`
- 工作区目录：`workspaceRoot`
- prompts 目录：`promptsDir`
- identity 配置：`identity.json`

以上四者统一通过运行时配置解析，不再各自硬编码。
