# Security Policy

这是 GitHub 会识别的仓库元文档，仍由本仓库维护，但不属于默认对外双语公开正文面。

## Supported Versions

当前公开维护范围仅包括：

- `main` 分支上的最新代码

以下内容当前不承诺安全修复：

- 历史提交
- 私有分支
- 你本地长期未同步的派生副本

## Reporting a Vulnerability

如果你发现了安全问题，请不要直接把完整利用细节、密钥、私有配置或业务数据发到公开 issue。

推荐顺序：

1. 优先使用 GitHub 的 private vulnerability reporting 或 security advisory 入口
2. 如果当前仓库还没有开启私密报告入口，请先创建一个最小化的 public issue，只说明存在安全问题，不要贴出敏感细节，等待维护者转到更安全的沟通方式

## What Not To Post Publicly

请不要在公开 issue、讨论或 PR 中贴出以下内容：

- API keys
- `.env` 内容
- `config/local/` 下的实际配置
- `~/.config/redcube/` 中的 identity、runtime、prompts 或备份包
- 外部业务 workspace 的真实素材、客户数据或研究材料
- 可直接复现问题的敏感 payload、token、cookie、会话信息

## Scope Notes

这个仓库的安全边界重点在于：

- 不把私有配置和真实工作数据混入公开仓库
- 不在公开报告中泄露 prompts、identity、workspace 路径和密钥
- 对外部 LLM、搜索、抓取或第三方服务相关问题，优先最小化复现，不扩散真实数据

如果问题涉及供应链依赖、API key 暴露、文件遍历、路径逃逸、公开接口误暴露或工作区数据泄露，这些都应视为安全问题处理。
