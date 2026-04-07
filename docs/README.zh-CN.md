# 文档索引

[English](./README.md) | **中文**

这里是 `RedCube AI` 的双语文档索引，也是默认对外公开面。
内容与产品真相保持一致：该项目在共享 `Unified Harness Engineering Substrate` 上承载视觉交付的领域承载操作系统（Domain Harness OS），本地执行呈现为 Codex 默认 host-agent runtime；当前仓内已实现且可验证的正式入口只有 MCP 与 CLI，`controller` 目前不是独立、可验证的仓内入口。

## 统一文档治理

- 所有对外文档都必须同时提供英文 `.md` 与中文 `.zh-CN.md`，并保持同步更新。
- 内部设计、规划、操作备忘等内容默认使用中文，除非明确提升到公开面再补充英文。
- 术语可以保留英文，但要避免无意义的中英混写，保证语言连贯。
- `docs/README*` 的结构与措辞应统一，帮助读者区分公开面与内部内容。
- 详情可查阅 [文档治理规则](documentation-governance.md)。

## 默认对外双语公开面

- [仓库首页](../README.zh-CN.md)

这份索引和仓库首页共同构成默认的 GitHub 双语对外面。任何面向公众的详细文档都应出现在这里，并配套中英文版本。

## 仓库跟踪的内部操作文档

### 面向人类操作同事

- [人类快速上手](human_quickstart.md)
- [典型交付示例](deliverable_examples.md)
- [稳定交付手工测试 brief](stable_deliverable_manual_test_brief.md)
- [Phase 2 activation package freeze](phase_2_source_intake_activation_package_freeze.md)

### 面向技术协作 / Agent 执行者

- [运行架构](runtime_architecture.md)
- [Domain Harness OS 定位映射](domain-harness-os-positioning.md)
- [GitHub 公开发布流程](public-github-publish.md)
- [文档治理规则](documentation-governance.md)

### 私有 / 本地配置文档

- [私有作者信息与 prompts 配置](private-profile-setup.md)

## 稳定内部规则

- [内部规则索引](policies/README.md)
- [运行模型规则](policies/runtime_operating_model.md)
- [交付合同模型规则](policies/deliverable_contract_model.md)

## 仓库历史

- [更新日志](../CHANGELOG.md)

## 文档边界

- `README*` 与 `docs/README*`：默认双语对外公开面。
- 详细 `docs/*.md`：默认仓库跟踪的内部操作文档，中文为主。
- `docs/policies/`：稳定内部规则，默认中文维护。
- `docs/superpowers/`：本地 AI / Superpowers 的笔记、计划、草案，保持未跟踪。
