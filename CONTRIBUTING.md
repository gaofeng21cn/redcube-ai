# Contributing

感谢你为 RedCube AI 提交改进。

## 开始之前

- 先阅读 [README.md](README.md)
- 如变更涉及公开仓库边界，优先阅读 `docs/tutorials/` 和 `docs/plans/` 下的相关文档
- 这个仓库只保留功能代码、公开 prompts、测试与文档，不保留业务工作区和私有素材

## 本地开发

安装依赖：

```bash
npm install
```

运行测试：

```bash
node --test tests/*.test.js
```

常用入口：

```bash
node apps/redcube-cli/src/cli.js help
node apps/redcube-mcp/src/server.js
```

## 提交要求

- 变更保持聚焦，不把无关重构混进同一个提交
- 如果改了行为、命令、目录约定或公开接口，请同步更新文档
- 提交前至少运行一次 Node 测试，并确认结果为 `fail 0`
- 保持 Node 主线一致，不要重新引入 Python 严格流程入口或第二套 prompts 主链

## 私有信息边界

不要提交以下内容：

- 业务工作区
- 运行产物，例如 `projects/`、`publish/`、`.redcube_pi/`、`input/`、`output/`
- 本机私有配置，例如 `config/local/` 下的实际配置文件
- `~/.config/redcube/` 中的私有 identity、runtime、prompts 或备份包
- `.env`、`.cursor/`、API key、真实作者人设、品牌素材或外部客户数据

如果你的改动依赖私有配置，请只提交公开安全的默认值与说明文档，不要把真实内容写进仓库。

## Pull Request 建议

- 在描述里写清楚问题、方案和验证方式
- 如涉及界面或流程变化，附上关键截图、流程图或操作说明
- 如涉及 prompts、workflow 或 deliverable contract 行为变化，说明影响阶段和回归范围
